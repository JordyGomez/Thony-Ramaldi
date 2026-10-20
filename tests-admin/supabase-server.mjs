// Doble HTTP local de Auth, PostgREST y Storage. Nunca usa el proyecto real.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
const port = 3335;
const id = "11111111-1111-4111-8111-111111111111";
const encoded = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encoded({ alg: "HS256", typ: "JWT" })}.${encoded({ sub: id, aud: "authenticated", role: "authenticated", email: "admin@example.test", exp: Math.floor(Date.now() / 1000) + 86400 })}.local-test-signature`;
const user = {
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "admin@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
let state;
const reset = () => {
  state = {
    admin: true,
    expired: false,
    storageError: "",
    installed: true,
    draft: { id: 1, content: {}, revision: 0 },
    publication: { id: 1, content: {}, revision: 0, published_at: null },
    history: [],
    files: [],
    properties: [],
    uploads: 0,
    removals: 0,
  };
};
reset();
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const body = Buffer.concat(buffers);
  const json = () => (body.length ? JSON.parse(body.toString()) : {});
  const send = (data, status = 200) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(data));
  };
  const sendRows = (rows, status = 200) =>
    req.headers.accept?.includes("application/vnd.pgrst.object+json")
      ? rows.length === 1
        ? send(rows[0], status)
        : send({ code: "PGRST116", message: "Expected one row" }, 406)
      : send(rows, status);
  const authenticated =
    req.headers.authorization === `Bearer ${token}` && !state.expired;
  if (url.pathname === "/__test/health")
    return send({ fixture: "thony-local-admin" });
  if (url.pathname === "/__test/reset") {
    reset();
    return send({ ok: true });
  }
  if (url.pathname === "/__test/state") {
    if (req.method === "POST") Object.assign(state, json());
    return send({
      uploads: state.uploads,
      removals: state.removals,
      propertyCount: state.properties.length,
      files: state.files.map(({ path, mime }) => ({ path, mime })),
      draft: state.draft,
      publication: state.publication,
      history: state.history,
    });
  }
  if (url.pathname === "/auth/v1/token") {
    if (
      url.searchParams.get("grant_type") === "password" &&
      json().password !== "local-test-password"
    )
      return send(
        { message: "Invalid login credentials", error: "invalid_grant" },
        400,
      );
    return send({
      access_token: token,
      refresh_token: "local-test-refresh-token",
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: "bearer",
      user,
    });
  }
  if (url.pathname === "/auth/v1/user")
    return authenticated
      ? send(user)
      : send({ message: "Invalid JWT", error_code: "bad_jwt" }, 401);
  if (url.pathname === "/auth/v1/logout") return send({});
  if (url.pathname === "/rest/v1/rpc/is_admin")
    return send(authenticated && state.admin);
  if (url.pathname === "/rest/v1/rpc/save_site_content") {
    if (!authenticated || !state.admin)
      return send({ code: "42501", message: "Permission denied" }, 403);
    if (!state.installed)
      return send({ code: "PGRST202", message: "Function not found" }, 404);
    const input = json();
    if (input.p_revision !== state.draft.revision)
      return send({ code: "40001", message: "Concurrent edit" }, 400);
    state.draft = {
      id: 1,
      content: input.p_content,
      revision: state.draft.revision + 1,
    };
    if (input.p_publish) {
      state.history.push({
        revision: state.publication.revision,
        content: state.publication.content,
        published_at:
          state.publication.published_at || new Date().toISOString(),
      });
      state.publication = {
        id: 1,
        content: input.p_content,
        revision: state.publication.revision + 1,
        published_at: new Date().toISOString(),
      };
    }
    return send({
      revision: state.draft.revision,
      publishedRevision: state.publication.revision,
      publishedAt: state.publication.published_at,
    });
  }
  if (url.pathname.startsWith("/rest/v1/rpc/"))
    return send({ code: "PGRST202", message: "Function not found" }, 404);
  if (url.pathname.startsWith("/rest/v1/")) {
    const table = url.pathname.split("/").at(-1);
    if (table === "properties" && url.searchParams.has("thony_visible"))
      return send(
        {
          code: "42703",
          message: "Column not found before platform migration",
        },
        400,
      );
    if (
      !["properties", "site_content", "site_drafts", "site_revisions"].includes(
        table,
      )
    )
      return send({ code: "PGRST205", message: "Table not found" }, 404);
    if (table !== "properties" && !state.installed)
      return send({ code: "PGRST205", message: "Missing table" }, 404);
    if (
      (table === "site_drafts" || table === "site_revisions") &&
      (!authenticated || !state.admin)
    )
      return send([]);
    if (table === "properties" && req.method === "POST") {
      if (!authenticated || !state.admin)
        return send({ code: "42501", message: "Permission denied" }, 403);
      const row = { ...json(), id: randomUUID() };
      state.properties.push(row);
      return sendRows([row], 201);
    }
    if (table === "properties" && req.method === "DELETE") {
      if (!authenticated || !state.admin)
        return send({ code: "42501", message: "Permission denied" }, 403);
      const match = url.searchParams.get("id")?.slice(3);
      const removed = state.properties.filter((row) => row.id === match);
      state.properties = state.properties.filter((row) => row.id !== match);
      return sendRows(removed);
    }
    let rows =
      table === "site_content"
        ? [state.publication]
        : table === "site_drafts"
          ? [state.draft]
          : table === "site_revisions"
            ? [...state.history].reverse()
            : table === "properties"
              ? state.properties
              : [];
    for (const [key, value] of url.searchParams)
      if (value.startsWith("eq."))
        rows = rows.filter((row) => String(row[key]) === value.slice(3));
    const limit = Number(url.searchParams.get("limit"));
    if (limit) rows = rows.slice(0, limit);
    res.setHeader(
      "Content-Range",
      `0-${Math.max(0, rows.length - 1)}/${rows.length}`,
    );
    return sendRows(rows);
  }
  if (url.pathname === "/storage/v1/object/list/properties") {
    if (!authenticated || !state.admin)
      return send({ statusCode: "403", message: "Unauthorized" }, 403);
    if (state.storageError === "bucket")
      return send({ statusCode: "404", message: "Bucket not found" }, 404);
    const { limit = 48, offset = 0 } = json();
    return send(
      state.files.slice(offset, offset + limit).map((file) => ({
        id: file.id,
        name: file.path.split("/").at(-1),
        created_at: file.createdAt,
        metadata: { mimetype: file.mime, size: file.data.length },
      })),
    );
  }
  if (
    url.pathname === "/storage/v1/object/properties" &&
    req.method === "DELETE"
  ) {
    if (!authenticated || !state.admin)
      return send({ message: "Unauthorized" }, 403);
    const { prefixes = [] } = json();
    state.removals++;
    state.files = state.files.filter((file) => !prefixes.includes(file.path));
    return send(prefixes.map((name) => ({ name })));
  }
  if (url.pathname.startsWith("/storage/v1/object/public/properties/")) {
    const path = decodeURIComponent(
      url.pathname.split("/public/properties/")[1],
    );
    const file = state.files.find((file) => file.path === path);
    if (!file) return send({ message: "Not found" }, 404);
    res.writeHead(200, { "Content-Type": file.mime });
    return res.end(file.data);
  }
  if (url.pathname.startsWith("/storage/v1/object/properties/")) {
    if (!authenticated || !state.admin || state.storageError === "permissions")
      return send(
        {
          statusCode: "403",
          message: "new row violates row-level security policy",
        },
        403,
      );
    if (state.storageError === "bucket")
      return send({ statusCode: "404", message: "Bucket not found" }, 404);
    const parsed = new Request(`http://127.0.0.1:${port}${req.url}`, {
      method: "POST",
      headers: req.headers,
      body,
    });
    const form = await parsed.formData();
    const file = [...form.values()].find((value) => value instanceof File);
    if (!file) return send({ message: "Missing file" }, 400);
    const path = decodeURIComponent(
      url.pathname.split("/object/properties/")[1],
    );
    state.files.unshift({
      id: randomUUID(),
      path,
      mime: file.type,
      data: Buffer.from(await file.arrayBuffer()),
      createdAt: new Date().toISOString(),
    });
    state.uploads++;
    return send({ Key: `properties/${path}`, Id: state.files[0].id });
  }
  return send({ message: "Unexpected test request", path: url.pathname }, 404);
});
server.listen(port, "127.0.0.1", () =>
  console.log("Supabase de pruebas listo en loopback."),
);
process.on("SIGTERM", () => server.close(() => process.exit(0)));
