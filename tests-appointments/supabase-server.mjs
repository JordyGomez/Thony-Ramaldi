// Solo loopback: Auth/Storage de prueba + PostgreSQL/RLS real de las migraciones.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
if (process.env.VERCEL_ENV || process.env.THONY_APPOINTMENT_TESTS !== "1")
  throw new Error("Solo pruebas aisladas");
const port = 3337;
const names = [
  "super",
  "legacy",
  "admin",
  "agent",
  "other",
  "pending",
  "invited",
  "owner",
];
const users = Object.fromEntries(
  names.map((name, index) => [
    name,
    {
      id: `${String(index + 1).repeat(8)}-${String(index + 1).repeat(4)}-4${String(index + 1).repeat(3)}-8${String(index + 1).repeat(3)}-${String(index + 1).repeat(12)}`,
      aud: "authenticated",
      role: "authenticated",
      email: `${name}@example.test`,
      email_confirmed_at: "2026-10-01T00:00:00Z",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: "2026-10-01T00:00:00Z",
    },
  ]),
);
const encoded = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const tokens = Object.fromEntries(
  names.map((n) => [
    n,
    `${encoded({ alg: "HS256", typ: "JWT" })}.${encoded({ sub: users[n].id, email: users[n].email, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 86400 })}.isolated-signature`,
  ]),
);
const migrations = await Promise.all(
  [
    "schema.sql",
    "migrations/20261018_site_editor.sql",
    "migrations/20261020_dual_mode_platform.sql",
    "migrations/20261021_appointments_crm.sql",
  ].map((p) => readFile(new URL(`../supabase/${p}`, import.meta.url), "utf8")),
);
const jpeg = await readFile(
  new URL("../public/images/thony-paulino.jpg", import.meta.url),
);
let db,
  org,
  files = new Map(),
  recoveries = 0,
  signups = 0,
  passwordUpdates = 0;
let messages = [],
  providerMode = "ready",
  domainVerified = true;
async function reset() {
  if (db) await db.close();
  db = new PGlite({ extensions: { btree_gist } });
  files = new Map();
  messages = [];
  providerMode = "ready";
  domainVerified = true;
  recoveries = 0;
  signups = 0;
  passwordUpdates = 0;

  await db.exec(`create role anon;create role authenticated;create role supabase_auth_admin;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth,storage to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text unique);
 alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;`);
  for (const u of Object.values(users))
    await db.query("insert into auth.users values($1,$2,now())", [
      u.id,
      u.email,
    ]);
  for (const migration of migrations) await db.exec(migration);
  await db.query("insert into platform_superadmins(user_id) values($1)", [
    users.super.id,
  ]);
  await db.exec("insert into admin_users values('legacy@example.test')");
  org = (await db.query("select id from organizations where slug='ramaldi'"))
    .rows[0].id;
  for (const [name, role, status] of [
    ["admin", "business_admin", "active"],
    ["agent", "agent", "active"],
    ["other", "agent", "active"],
    ["pending", "agent", "pending"],
  ])
    await db.query(
      "insert into organization_members(organization_id,user_id,role,status) values($1,$2,$3,$4)",
      [org, users[name].id, role, status],
    );
  await db.query(
    "update appointment_settings set owner_user_id=$1,email='owner@example.test',whatsapp='+18095550100',enabled=true,max_daily_appointments=24,minimum_notice_minutes=30,modalities='{presencial,virtual}',owner_whatsapp_opt_in=true",
    [users.owner.id],
  );
  for (const name of ["owner", "super"])
    await db.query(
      "insert into appointment_access_grants(calendar_id,user_id,kind,can_manage,can_read_leads,can_export,can_manage_permissions,can_view_notifications) values('10000000-0000-4000-8000-000000000001',$1,$2,true,true,true,true,true)",
      [users[name].id, name === "owner" ? "owner" : "technical"],
    );
  for (let n = 0; n < 7; n++)
    await db.query(
      "insert into appointment_availability_rules(calendar_id,weekday,starts_at,ends_at) values('10000000-0000-4000-8000-000000000001',$1,'08:00','20:00')",
      [n],
    );
  await db.query(
    "update appointment_runtime set server_secret_hash=encode(sha256(convert_to($1,'UTF8')),'hex'),last_worker_at=now(),scheduler_enabled_at=now()",
    [process.env.APPOINTMENTS_SERVER_SECRET],
  );
  await db.exec(
    "insert into properties(slug,reference,title,location,type,operation,price,images) values('isolated-booking-property','ISOLATED-001','Propiedad ficticia de pruebas aisladas','Ubicación ficticia','Apartamento','Venta',100,'[{\"path\":\"media/isolated-property.jpg\",\"alt\":\"Imagen exclusiva de prueba\"}]')",
  );
}
const actAs = async (name) => {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify(
      name ? { sub: users[name].id, email: users[name].email } : {},
    ),
  ]);
  await db.exec(`set role ${name ? "authenticated" : "anon"}`);
};
const settings = () => ({
  name: "Empresa de prueba aislada",
  headline: "Inmuebles aprobados para pruebas",
  description:
    "Contenido corporativo ficticio que solo existe en el entorno aislado de pruebas.",
  email: "empresa@example.test",
  phone: "18095550000",
  whatsapp: "18095550000",
  address: "",
  seoTitle: "Portal empresarial de pruebas",
  seoDescription:
    "Descripción autorizada únicamente para las pruebas aisladas.",
  hero: `platform/${org}/${users.super.id}/88888888-8888-4888-8888-888888888888.jpg`,
  logo: `platform/${org}/${users.super.id}/99999999-9999-4999-8999-999999999999.png`,
  background: "#2B2B2B",
  text: "#FFFFFF",
  accent: "#F5E8B3",
  services: [],
});
const identifier = (value) => {
  if (!/^[a-z_]+$/.test(value))
    throw new Error("Identificador inválido en pruebas");
  return `"${value}"`;
};
async function handle(req, res, body) {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const input = () => (body.length ? JSON.parse(body) : {});
  const send = (value, status = 200) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(value));
  };
  const name = names.find(
    (n) => req.headers.authorization === `Bearer ${tokens[n]}`,
  );
  const rows = (data, status = 200) =>
    req.headers.accept?.includes("application/vnd.pgrst.object+json")
      ? data.length === 1
        ? send(data[0], status)
        : send(
            {
              code: "PGRST116",
              details: `The result contains ${data.length} rows`,
            },
            406,
          )
      : send(data, status);
  if (url.pathname === "/__test/provider-mode") {
    const options = input();
    providerMode = options.mode || "ready";
    domainVerified = options.domainVerified !== false;
    return send({ ok: true });
  }
  if (url.pathname === "/__test/agenda-state") {
    await db.exec("reset role");
    return send({
      messages,
      appointments: (await db.query("select * from appointments")).rows,
      leads: (await db.query("select * from leads")).rows,
      jobs: (await db.query("select * from notification_jobs")).rows,
      attempts: (await db.query("select * from notification_attempts")).rows,
      history: (await db.query("select * from appointment_history")).rows,
      grants: (await db.query("select * from appointment_customer_grants"))
        .rows,
    });
  }
  if (url.pathname === "/__test/agenda-sql") {
    await db.exec("reset role");
    return send({
      rows: (await db.query(input().sql, input().values || [])).rows,
    });
  }
  if (url.pathname === "/__test/agenda-date") {
    await db.exec("reset role");
    return send({
      day: (
        await db.query(
          "select ((now() at time zone 'America/Santo_Domingo')::date+3)::text chosen_day",
        )
      ).rows[0].chosen_day,
    });
  }
  if (url.pathname.startsWith("/providers/")) {
    if (url.pathname === "/providers/turnstile") {
      const form = new URLSearchParams(body.toString());
      return send({
        success: form.get("response") === "isolated-booking-captcha",
        action: "appointment_request",
        hostname: "127.0.0.1",
      });
    }
    const p = input();
    if (url.pathname.startsWith("/providers/resend/domains/"))
      return send({
        id: "isolated-domain",
        name: "example.test",
        status: domainVerified ? "verified" : "pending",
      });
    if (url.pathname.includes("/providers/meta/") && req.method === "GET") {
      if (url.pathname.includes("/message_templates"))
        return send({
          data: ["agenda_owner", "agenda_client"].map((name) => ({
            name,
            language: "es",
            status: "APPROVED",
            category: "UTILITY",
            components: [
              {
                type: "BODY",
                text: Array.from(
                  { length: 13 },
                  (_, i) => "Campo " + (i + 1) + ": {{" + (i + 1) + "}}",
                ).join(" · "),
              },
            ],
          })),
        });
      return send({
        id: "123456789",
        display_phone_number: "+1 809 555 0110",
        code_verification_status: "VERIFIED",
      });
    }
    if (req.method === "POST") {
      if (providerMode === "retry")
        return send(
          { name: "rate_limit_exceeded", error: { is_transient: true } },
          429,
        );
      if (providerMode === "reject")
        return send(
          { name: "validation_error", error: { is_transient: false } },
          400,
        );
      const idempotency = req.headers["idempotency-key"];
      const old = idempotency && messages.find((m) => m.key === idempotency);
      if (old && JSON.stringify(old.data) !== JSON.stringify(p))
        return send({ name: "invalid_idempotent_request" }, 409);
      const message = old || {
        id: "isolated-provider-" + crypto.randomUUID(),
        path: url.pathname,
        key: idempotency || null,
        data: p,
      };
      if (!old) messages.push(message);
      if (providerMode === "uncertain") {
        req.socket.destroy();
        return;
      }
      return send(
        url.pathname.includes("/resend/")
          ? { id: message.id }
          : { messages: [{ id: message.id }] },
      );
    }
  }
  if (url.pathname === "/__test/health")
    return send({ fixture: "thony-appointments-isolated" });
  if (url.pathname === "/__test/reset") {
    await reset();
    return send({ ok: true, org, users });
  }
  if (url.pathname === "/__test/prepare") {
    await actAs("super");
    const s = settings();
    for (const path of [s.hero, s.logo]) {
      const pathName = path.slice(9);
      await db.query(
        "insert into storage.objects(bucket_id,name) values('platform-media',$1) on conflict do nothing",
        [pathName],
      );
      files.set(pathName, {
        mime: path.endsWith(".png") ? "image/png" : "image/jpeg",
        data: jpeg,
      });
    }
    await db.query("select save_enterprise_settings($1,0,true)", [s]);
    await db.query("select set_corporate_authorization($1,true,$2)", [
      "Autorización FICTICIA de pruebas aisladas",
      input().registration === true,
    ]);
    return send({ ok: true, settings: s });
  }
  if (url.pathname === "/__test/break-config") {
    await db.exec(
      "reset role;update site_mode_settings set published_content='{\"name\":true}'::jsonb where mode='ramaldi'",
    );
    return send({ ok: true });
  }
  if (url.pathname === "/__test/state") {
    await db.exec("reset role");
    const mode = (await db.query("select * from platform_state")).rows[0];
    return send({
      mode,
      recoveries,
      signups,
      passwordUpdates,
      files: [...files.keys()],
      properties: (await db.query("select * from properties")).rows,
      modeAudit: (await db.query("select * from mode_change_audit")).rows,
    });
  }
  if (url.pathname === "/auth/v1/token") {
    const data = input();
    const selected =
      names.find((n) => users[n].email === data.email) ||
      names.find((n) => data.refresh_token === `refresh-${n}`);
    if (
      !selected ||
      (url.searchParams.get("grant_type") === "password" &&
        data.password !== "isolated-password")
    )
      return send(
        { error: "invalid_grant", message: "Invalid credentials" },
        400,
      );
    return send({
      access_token: tokens[selected],
      refresh_token: `refresh-${selected}`,
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: "bearer",
      user: users[selected],
    });
  }
  if (url.pathname === "/auth/v1/user") {
    if (name && req.method === "PUT") passwordUpdates++;
    return name ? send(users[name]) : send({ message: "Invalid JWT" }, 401);
  }
  if (url.pathname === "/auth/v1/logout") return send({});
  if (url.pathname === "/auth/v1/recover") {
    recoveries++;
    return send({});
  }
  if (url.pathname === "/auth/v1/signup") {
    if (
      input().gotrue_meta_security?.captcha_token !== "isolated-captcha-token"
    )
      return send({ message: "CAPTCHA rejected" }, 422);
    await db.exec("reset role;set role supabase_auth_admin");
    const hook = (
      await db.query("select before_platform_user_created($1) as result", [
        { user: { email: input().email, user_metadata: input().data || {} } },
      ])
    ).rows[0].result;
    if (hook.error)
      return send({ message: hook.error.message }, hook.error.http_code);
    signups++;
    return send({ user: users.invited, session: null });
  }
  if (url.pathname === "/auth/v1/verify") {
    if (
      input().token_hash !== "isolated-recovery-token" ||
      input().type !== "recovery"
    )
      return send({ message: "Invalid expired link" }, 400);
    return send({
      access_token: tokens.legacy,
      refresh_token: "refresh-legacy",
      expires_in: 86400,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: "bearer",
      user: users.legacy,
    });
  }
  await actAs(name);
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    const fn = identifier(url.pathname.split("/").at(-1));
    const entries = Object.entries(input());
    try {
      const result = await db.query(
        `select public.${fn}(${entries.map(([key], i) => `${identifier(key)}=>$${i + 1}`).join(",")}) as result`,
        entries.map(([, v]) => v),
      );
      return send(result.rows[0].result);
    } catch (e) {
      return send(
        { code: e.code || "XX000", message: e.message },
        e.code === "42501" ? 403 : 400,
      );
    }
  }
  if (url.pathname.startsWith("/rest/v1/")) {
    const table = identifier(url.pathname.split("/").at(-1));
    const values = [];
    const conditions = [];
    for (const [key, value] of url.searchParams) {
      if (["select", "order", "limit", "offset"].includes(key)) continue;
      const column = identifier(key);
      if (value.startsWith("eq.")) {
        values.push(value.slice(3));
        conditions.push(`${column}=$${values.length}`);
      } else if (value === "is.null") conditions.push(`${column} is null`);
      else if (value === "not.is.null")
        conditions.push(`${column} is not null`);
      else if (value.startsWith("not.in.(") || value.startsWith("in.(")) {
        const negative = value.startsWith("not.");
        const list = value.slice(negative ? 8 : 4, -1).split(",");
        conditions.push(
          `${column} ${negative ? "not " : ""}in (${list
            .map((v) => {
              values.push(v);
              return `$${values.length}`;
            })
            .join(",")})`,
        );
      } else throw new Error("Filtro de pruebas no implementado");
    }
    const select = url.searchParams.get("select") || "*";
    const columns =
      select === "*" ? "*" : select.split(",").map(identifier).join(",");
    const order = (url.searchParams.get("order") || "")
      .split(",")
      .filter(Boolean)
      .map((v) => {
        const [col, dir, nulls] = v.split(".");
        return `${identifier(col)} ${dir === "desc" ? "desc" : "asc"} ${nulls === "nullslast" ? "nulls last" : nulls === "nullsfirst" ? "nulls first" : ""}`;
      });
    const sql = `select ${columns} from public.${table}${conditions.length ? ` where ${conditions.join(" and ")}` : ""}${order.length ? ` order by ${order.join(",")}` : ""} limit ${Math.min(1000, Number(url.searchParams.get("limit") || 1000))}`;
    try {
      return rows((await db.query(sql, values)).rows);
    } catch (e) {
      return send(
        { code: e.code, message: e.message },
        e.code === "42501" ? 403 : 400,
      );
    }
  }
  if (url.pathname.startsWith("/storage/v1/object/sign/platform-media/")) {
    const path = decodeURIComponent(url.pathname.split("/platform-media/")[1]);
    const allowed = (
      await db.query("select can_read_enterprise_media($1) as allowed", [path])
    ).rows[0].allowed;
    if (!allowed || !files.has(path))
      return send({ message: "Denied", statusCode: 403 }, 403);
    return send({
      signedURL: `/object/signed-test/platform-media/${path}?token=fixture`,
    });
  }
  if (
    url.pathname.startsWith("/storage/v1/object/signed-test/platform-media/")
  ) {
    const path = decodeURIComponent(url.pathname.split("/platform-media/")[1]);
    const file = files.get(path);
    if (!file) return send({}, 404);
    res.writeHead(200, { "Content-Type": file.mime });
    return res.end(file.data);
  }
  if (url.pathname.startsWith("/storage/v1/object/platform-media/")) {
    const path = decodeURIComponent(url.pathname.split("/platform-media/")[1]);
    try {
      const parsed = new Request(`http://127.0.0.1:${port}${req.url}`, {
        method: "POST",
        headers: req.headers,
        body,
      });
      const form = await parsed.formData();
      const file = [...form.values()].find((v) => v instanceof File);
      if (!file) return send({ message: "Missing file" }, 400);
      const row = (
        await db.query(
          "insert into storage.objects(bucket_id,name) values('platform-media',$1) returning id",
          [path],
        )
      ).rows[0];
      files.set(path, {
        mime: file.type,
        data: Buffer.from(await file.arrayBuffer()),
      });
      return send({ Key: `platform-media/${path}`, Id: row.id });
    } catch (e) {
      return send({ message: e.message, statusCode: 403 }, 403);
    }
  }
  return send({ message: "Unexpected test request", path: url.pathname }, 404);
}
await reset();
let queue = Promise.resolve();
const server = createServer(async (req, res) => {
  const buffers = [];
  for await (const part of req) buffers.push(part);
  const body = Buffer.concat(buffers);
  queue = queue
    .then(() => handle(req, res, body))
    .catch((e) => {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    "Agenda con PostgreSQL y proveedores ficticios SOLO en loopback.",
  ),
);
process.on("SIGTERM", () =>
  server.close(async () => {
    await db.close();
    process.exit(0);
  }),
);
