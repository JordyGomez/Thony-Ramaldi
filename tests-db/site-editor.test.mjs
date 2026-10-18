import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const schema = await readFile(
  new URL("../supabase/schema.sql", import.meta.url),
  "utf8",
);
const migration = await readFile(
  new URL("../supabase/migrations/20261018_site_editor.sql", import.meta.url),
  "utf8",
);
const adminId = "11111111-1111-4111-8111-111111111111";
const viewerId = "22222222-2222-4222-8222-222222222222";

test("migración real: privacidad, permisos, publicación atómica e historial", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
      create table auth.users (id uuid primary key);
      insert into auth.users values ('${adminId}'), ('${viewerId}');
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
      grant usage on schema auth,storage to anon,authenticated;
      create table storage.buckets (id text primary key, name text, public boolean);
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      alter table storage.objects enable row level security;`);
    await db.exec(schema);
    await db.exec(`insert into public.admin_users values ('admin@example.test');
      insert into public.properties (slug,reference,title,location,type,operation,price) values ('propiedad-existente','REF-1','Propiedad existente','Santiago','Apartamento','Venta',100);
      grant select,insert,update,delete on storage.objects to authenticated;`);
    await db.exec(migration);
    const actAs = async (role, id, email) => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claims',$1,false)", [
        JSON.stringify(id ? { sub: id, email } : {}),
      ]);
      await db.exec(`set role ${role}`);
    };
    const save = (content, revision, publish) =>
      db.query("select public.save_site_content($1::jsonb,$2,$3) as result", [
        JSON.stringify(content),
        revision,
        publish,
      ]);
    await t.test(
      "se instala dos veces sin tocar propiedades existentes",
      async () => {
        await db.exec(migration);
        assert.equal(
          (await db.query("select title from public.properties")).rows[0].title,
          "Propiedad existente",
        );
      },
    );
    await t.test(
      "una visita anónima puede leer la publicación y no puede editar",
      async () => {
        await actAs("anon");
        assert.deepEqual(
          (await db.query("select content from public.site_content")).rows,
          [{ content: {} }],
        );
        await assert.rejects(
          save({ texts: { heroTitle: "No permitido" } }, 0, true),
          { code: "42501" },
        );
        await assert.rejects(db.query("select * from public.site_drafts"), {
          code: "42501",
        });
        await assert.rejects(db.query("select * from public.site_revisions"), {
          code: "42501",
        });
      },
    );
    await t.test(
      "iniciar sesión sin ser administrador no autoriza a editar",
      async () => {
        await actAs("authenticated", viewerId, "viewer@example.test");
        assert.deepEqual(
          (await db.query("select * from public.site_drafts")).rows,
          [],
        );
        await assert.rejects(
          save({ texts: { heroTitle: "No permitido" } }, 0, true),
          { code: "42501" },
        );
      },
    );
    await t.test(
      "el borrador se guarda sin cambiar la web pública",
      async () => {
        await actAs("authenticated", adminId, "admin@example.test");
        const result = (
          await save({ texts: { heroTitle: "Borrador privado" } }, 0, false)
        ).rows[0].result;
        assert.equal(result.revision, 1);
        assert.equal(result.publishedRevision, 0);
        assert.deepEqual(
          (await db.query("select content from public.site_content")).rows[0]
            .content,
          {},
        );
        assert.equal(
          (await db.query("select content from public.site_drafts")).rows[0]
            .content.texts.heroTitle,
          "Borrador privado",
        );
      },
    );
    await t.test(
      "publicar actualiza la web y conserva la versión anterior",
      async () => {
        const result = (
          await save({ texts: { heroTitle: "Nueva publicación" } }, 1, true)
        ).rows[0].result;
        assert.equal(result.revision, 2);
        assert.equal(result.publishedRevision, 1);
        assert.equal(
          (await db.query("select content from public.site_content")).rows[0]
            .content.texts.heroTitle,
          "Nueva publicación",
        );
        assert.deepEqual(
          (
            await db.query(
              "select content from public.site_revisions where revision=0",
            )
          ).rows[0].content,
          {},
        );
      },
    );
    await t.test(
      "una edición antigua no sobrescribe la de otro colaborador",
      async () => {
        await assert.rejects(
          save({ texts: { heroTitle: "Edición desactualizada" } }, 1, true),
          { code: "40001" },
        );
        assert.equal(
          (await db.query("select revision from public.site_drafts")).rows[0]
            .revision,
          2,
        );
        assert.equal(
          (await db.query("select content from public.site_content")).rows[0]
            .content.texts.heroTitle,
          "Nueva publicación",
        );
      },
    );
    await t.test(
      "el público recibe solo contenido publicado, sin acceso al historial privado",
      async () => {
        await actAs("anon");
        assert.equal(
          (await db.query("select content from public.site_content")).rows[0]
            .content.texts.heroTitle,
          "Nueva publicación",
        );
        await assert.rejects(
          db.query("select content from public.site_revisions"),
          { code: "42501" },
        );
      },
    );
    await t.test(
      "reinstalar conserva la publicación y sus revisiones",
      async () => {
        await db.exec("reset role");
        await db.exec(migration);
        assert.equal(
          (await db.query("select revision from public.site_content")).rows[0]
            .revision,
          1,
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int as n from public.site_revisions",
            )
          ).rows[0].n,
          1,
        );
      },
    );
  } finally {
    await db.close();
  }
});
