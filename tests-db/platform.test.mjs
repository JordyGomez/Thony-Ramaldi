import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const sql = await Promise.all(
  [
    "schema.sql",
    "migrations/20261018_site_editor.sql",
    "migrations/20261020_dual_mode_platform.sql",
  ].map((p) => readFile(new URL(`../supabase/${p}`, import.meta.url), "utf8")),
);
const ids = {
  super: "11111111-1111-4111-8111-111111111111",
  legacy: "22222222-2222-4222-8222-222222222222",
  admin: "33333333-3333-4333-8333-333333333333",
  agent: "44444444-4444-4444-8444-444444444444",
  other: "55555555-5555-4555-8555-555555555555",
  pending: "66666666-6666-4666-8666-666666666666",
  unverified: "77777777-7777-4777-8777-777777777777",
};
const hash = "a".repeat(64);
test("plataforma: migración, RLS y operaciones transaccionales reales", async (t) => {
  const db = new PGlite();
  const as = async (name) => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify(
        name ? { sub: ids[name], email: `${name}@example.test` } : {},
      ),
    ]);
    await db.exec(`set role ${name ? "authenticated" : "anon"}`);
  };
  const owner = () => db.exec("reset role");
  const call = async (name, ...params) =>
    (
      await db.query(
        `select public.${name}(${params.map((_, i) => `$${i + 1}`).join(",")}) as result`,
        params,
      )
    ).rows[0].result;
  const denied = (promise) => assert.rejects(promise, { code: "42501" });
  let org, property, profileRevision;
  try {
    await db.exec(`create role anon;create role authenticated;create role supabase_auth_admin;create schema auth;create schema storage;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
   grant usage on schema auth,storage to anon,authenticated;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
   alter table storage.objects enable row level security;
   grant select,insert,update,delete on storage.objects to authenticated;`);
    for (const [name, id] of Object.entries(ids))
      await db.query("insert into auth.users values($1,$2,$3)", [
        id,
        `${name}@example.test`,
        name === "unverified" ? null : "2026-10-01",
      ]);
    await db.exec(sql[0]);
    await db.exec(sql[1]);
    await db.exec(
      "insert into admin_users values('legacy@example.test');insert into properties(slug,reference,title,location,type,operation,price) values('legado','LEG','Ficha existente','Santiago','Apartamento','Venta',100);update site_drafts set content='{\"texts\":{\"name\":\"Personal intacto\"}}';",
    );
    await t.test(
      "instalación repetible conserva datos, CMS y modo Thony sin privilegios automáticos",
      async () => {
        await db.exec(sql[2]);
        await db.exec(sql[2]);
        assert.equal(
          (await db.query("select active_mode from platform_state")).rows[0]
            .active_mode,
          "thony",
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int as n from platform_superadmins",
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (await db.query("select organization_id from properties")).rows[0]
            .organization_id,
          null,
        );
        assert.equal(
          (await db.query("select content from site_drafts")).rows[0].content
            .texts.name,
          "Personal intacto",
        );
        org = (await db.query("select id from organizations")).rows[0].id;
        await db.query("insert into platform_superadmins(user_id) values($1)", [
          ids.super,
        ]);
        for (const [name, role, status] of [
          ["admin", "business_admin", "active"],
          ["agent", "agent", "active"],
          ["other", "agent", "active"],
          ["pending", "agent", "pending"],
        ])
          await db.query(
            "insert into organization_members(organization_id,user_id,role,status) values($1,$2,$3,$4)",
            [org, ids[name], role, status],
          );
      },
    );
    await t.test(
      "anónimo solo obtiene el snapshot personal, sin borradores ni tablas privadas",
      async () => {
        await as();
        const snapshot = await call("public_platform_snapshot");
        assert.equal(snapshot.mode, "thony");
        assert.equal(snapshot.properties.length, 1);
        assert.equal(snapshot.agents.length, 0);
        await denied(db.query("select * from site_mode_settings"));
        await denied(db.query("select * from membership_invitations"));
        await denied(
          call("change_site_mode", "ramaldi", 0, "CAMBIAR A RAMALDI"),
        );
        assert.equal(
          (await db.query("select id from properties")).rows.length,
          1,
        );
        assert.equal(
          (await db.query("select active_mode from platform_state")).rows[0]
            .active_mode,
          "thony",
        );
        await denied(db.query("select changed_by from platform_state"));
      },
    );
    await t.test(
      "administrador legado no es superadministrador ni administrador empresarial",
      async () => {
        await as("legacy");
        const access = await call("platform_access");
        assert.equal(access.legacyAdmin, true);
        assert.equal(access.superadmin, false);
        assert.equal(access.canReview, false);
        await denied(call("platform_mode_impact", "ramaldi"));
        await denied(
          call(
            "set_corporate_authorization",
            "Documento corporativo de prueba",
            true,
            false,
          ),
        );
        assert.deepEqual(
          (await db.query("select * from site_mode_settings")).rows,
          [],
        );
      },
    );
    await t.test(
      "CRUD personal sigue disponible y registra borrado sin atribuir inventario a Ramaldi",
      async () => {
        await as("legacy");
        const row = (
          await db.query(
            "insert into properties(slug,reference,title,location,type,operation,price) values('crud-personal','CRUD','Ficha personal de prueba','Santiago','Apartamento','Venta',100) returning id,organization_id",
          )
        ).rows[0];
        assert.equal(row.organization_id, null);
        await db.query(
          "update properties set title='Edición personal conservada' where id=$1",
          [row.id],
        );
        await denied(
          db.query(
            "update properties set organization_id=$1,agent_id=$2,workflow_state='published' where id=$3",
            [org, ids.agent, row.id],
          ),
        );
        assert.equal(
          (
            await db.query("delete from properties where id=$1 returning id", [
              row.id,
            ])
          ).rows.length,
          1,
        );
        await owner();
        assert.equal(
          (
            await db.query(
              "select actor_id from platform_audit where event='property_deleted' and subject_id=$1",
              [row.id],
            )
          ).rows[0].actor_id,
          ids.legacy,
        );
      },
    );
    await t.test(
      "agente y administrador empresarial no pueden cambiar identidad ni permisos propios",
      async () => {
        for (const name of ["agent", "admin", "pending"]) {
          await as(name);
          await denied(
            call("change_site_mode", "ramaldi", 0, "CAMBIAR A RAMALDI"),
          );
          await denied(
            db.query("insert into platform_superadmins(user_id) values($1)", [
              ids[name],
            ]),
          );
        }
        await as("admin");
        await denied(
          call(
            "review_organization_member",
            ids.admin,
            "active",
            "business_admin",
            "",
            0,
          ),
        );
        await denied(
          call(
            "review_organization_member",
            ids.agent,
            "active",
            "business_admin",
            "",
            0,
          ),
        );
      },
    );
    await t.test(
      "registro y herramientas de agentes cerrados mientras el modo está desactivado",
      async () => {
        await as("agent");
        assert.equal((await call("platform_access")).canWork, false);
        await denied(
          call(
            "save_enterprise_property",
            null,
            { title: "No permitido", slug: "no-permitido" },
            0,
          ),
        );
        await as("super");
        await call(
          "create_membership_invitation",
          "unverified@example.test",
          hash,
        );
        assert.equal(
          await call(
            "check_membership_invitation",
            "unverified@example.test",
            hash,
          ),
          false,
        );
        await denied(
          call("change_site_mode", "ramaldi", 0, "CAMBIAR A RAMALDI"),
        );
      },
    );
    const settings = {
      name: "Empresa de prueba aislada",
      headline: "Configuración aprobada de prueba",
      description: "Contenido empresarial autorizado únicamente para pruebas.",
      seoTitle: "Portal empresarial aislado",
      seoDescription:
        "Descripción empresarial de pruebas que no llega a producción.",
      email: "empresa@example.test",
      phone: "",
      whatsapp: "",
      address: "",
      hero: `platform/${org}/${ids.super}/88888888-8888-4888-8888-888888888888.jpg`,
      logo: `platform/${org}/${ids.super}/99999999-9999-4999-8999-999999999999.png`,
      background: "#2B2B2B",
      text: "#FFFFFF",
      accent: "#F5E8B3",
      services: [],
    };
    await t.test(
      "borradores y versiones empresariales independientes, con conflictos detectados",
      async () => {
        await owner();
        await db.query(
          "insert into storage.objects(bucket_id,name) values('platform-media',$1),('platform-media',$2)",
          [settings.hero.slice(9), settings.logo.slice(9)],
        );
        await as("super");
        await call("save_enterprise_settings", settings, 0, false);
        await assert.rejects(
          call("save_enterprise_settings", settings, 0, true),
          { code: "40001" },
        );
        await call("save_enterprise_settings", settings, 1, true);
        await call(
          "save_enterprise_settings",
          { ...settings, headline: "Borrador privado diferente" },
          2,
          false,
        );
        assert.equal(
          (await db.query("select published_content from site_mode_settings"))
            .rows[0].published_content.headline,
          settings.headline,
        );
        await denied(
          call("change_site_mode", "ramaldi", 0, "CAMBIAR A RAMALDI"),
        );
      },
    );
    await t.test(
      "la RPC rechaza publicar una configuración ilegible aunque se omita Next",
      async () => {
        await as("super");
        await assert.rejects(
          call(
            "save_enterprise_settings",
            { ...settings, background: "#FFFFFF" },
            3,
            true,
          ),
          { code: "22023" },
        );
      },
    );
    await t.test(
      "activación explícita exige autorización y confirmación, y registra autor/fecha",
      async () => {
        await call(
          "set_corporate_authorization",
          "Aprobación ficticia SOLO en PostgreSQL aislado",
          true,
          true,
        );
        await assert.rejects(call("change_site_mode", "ramaldi", 0, ""), {
          code: "22023",
        });
        const impact = await call("platform_mode_impact", "ramaldi");
        assert.equal(impact.currentProperties, 1);
        assert.equal(impact.targetProperties, 0);
        assert.equal(impact.affectedProperties, 1);
        await call("change_site_mode", "ramaldi", 0, "CAMBIAR A RAMALDI");
        assert.equal(
          (await db.query("select actor_id from mode_change_audit")).rows[0]
            .actor_id,
          ids.super,
        );
        await assert.rejects(
          call("change_site_mode", "thony", 0, "CAMBIAR A THONY"),
          { code: "40001" },
        );
        await as();
        const s = await call("public_platform_snapshot");
        assert.equal(s.mode, "ramaldi");
        assert.equal(s.properties.length, 0);
        assert.equal(s.settings.headline, settings.headline);
        assert.equal(s.registrationEnabled, true);
      },
    );
    await t.test(
      "una autorización retirada por el propietario deja de exponer la identidad empresarial",
      async () => {
        await owner();
        await db.exec(
          "update organizations set authorized_at=null where slug='ramaldi'",
        );
        await as();
        assert.equal(await call("public_platform_snapshot"), null);
        await owner();
        await db.exec(
          "update organizations set authorized_at=now() where slug='ramaldi'",
        );
      },
    );
    await t.test(
      "invitación de un solo uso ligada a correo verificado; cuenta sola no otorga permisos",
      async () => {
        await as("unverified");
        assert.equal(
          await call(
            "check_membership_invitation",
            "unverified@example.test",
            hash,
          ),
          true,
        );
        await denied(
          call("accept_membership_invitation", hash, {
            name: "Solicitud de prueba",
          }),
        );
        await owner();
        await db.query(
          "update auth.users set email_confirmed_at=now() where id=$1",
          [ids.unverified],
        );
        await as("other");
        await denied(
          call("accept_membership_invitation", hash, {
            name: "Intento de apropiación",
          }),
        );
        await as("unverified");
        await call("accept_membership_invitation", hash, {
          name: "Solicitante verificado",
        });
        assert.equal((await call("platform_access")).status, "pending");
        assert.equal((await call("platform_access")).canWork, false);
        await denied(call("accept_membership_invitation", hash, {}));
        await denied(
          call(
            "save_enterprise_property",
            null,
            { title: "No permitido", slug: "no-permitido" },
            0,
          ),
        );
        await call(
          "update_membership_application",
          { name: "Solicitud completada" },
          0,
        );
      },
    );
    await t.test(
      "hook Auth cierra registros directos sin invitación y no se ejecuta como cliente",
      async () => {
        await as();
        await denied(
          call("before_platform_user_created", {
            user: { email: "empleado@ramaldigroup.com" },
          }),
        );
        await owner();
        await db.exec("set role supabase_auth_admin");
        const blocked = await call("before_platform_user_created", {
          user: {
            email: "empleado@ramaldigroup.com",
            user_metadata: { role: "business_admin" },
          },
        });
        assert.equal(blocked.error.http_code, 403);
        await as("admin");
        const secondHash = "b".repeat(64);
        const invitation = await call(
          "create_membership_invitation",
          "invited-new@example.test",
          secondHash,
        );
        await owner();
        await db.exec("set role supabase_auth_admin");
        assert.deepEqual(
          await call("before_platform_user_created", {
            user: {
              email: "invited-new@example.test",
              user_metadata: { platform_invitation: secondHash },
            },
          }),
          {},
        );
        await as("admin");
        await call("revoke_membership_invitation", invitation);
        await owner();
        await db.exec("set role supabase_auth_admin");
        assert.equal(
          (
            await call("before_platform_user_created", {
              user: {
                email: "invited-new@example.test",
                user_metadata: { platform_invitation: secondHash },
              },
            })
          ).error.http_code,
          403,
        );
      },
    );
    await t.test(
      "una solicitud no admite objetos ni campos de privilegios por RPC directa",
      async () => {
        await as("unverified");
        await assert.rejects(
          call("update_membership_application", { name: { invalid: true } }, 1),
          { code: "22023" },
        );
        await assert.rejects(
          call(
            "update_membership_application",
            { name: "Solicitante", role: "business_admin" },
            1,
          ),
          { code: "22023" },
        );
      },
    );
    await t.test(
      "aprobación empresarial activa la cuenta sin conceder control técnico",
      async () => {
        await as("admin");
        await call(
          "review_organization_member",
          ids.unverified,
          "active",
          "agent",
          "Pertenencia verificada",
          1,
        );
        await as("unverified");
        assert.equal((await call("platform_access")).canWork, true);
        assert.equal((await call("platform_access")).superadmin, false);
        await denied(
          db.query(
            "update organization_members set role='business_admin' where user_id=$1",
            [ids.unverified],
          ),
        );
      },
    );
    let photo;
    await t.test(
      "almacenamiento privado: subida propia, sin reemplazo/borrado ni acceso entre asesores",
      async () => {
        photo = `platform/${org}/${ids.agent}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg`;
        await as("agent");
        await db.query(
          "insert into storage.objects(bucket_id,name) values('platform-media',$1)",
          [photo.slice(9)],
        );
        await denied(
          db.query(
            "insert into storage.objects(bucket_id,name) values('platform-media',$1)",
            [`${org}/${ids.other}/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.jpg`],
          ),
        );
        assert.equal(
          (
            await db.query(
              "update storage.objects set name='reemplazo.jpg' where name=$1 returning id",
              [photo.slice(9)],
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "delete from storage.objects where name=$1 returning id",
              [photo.slice(9)],
            )
          ).rows.length,
          0,
        );
        await as("other");
        assert.equal(
          await call("can_read_enterprise_media", photo.slice(9)),
          false,
        );
        await as();
        assert.equal(
          await call("can_read_enterprise_media", photo.slice(9)),
          false,
        );
      },
    );
    await t.test(
      "perfil privado: borrador, solicitud y aprobación separadas",
      async () => {
        await as("agent");
        await call(
          "save_agent_profile",
          "asesor-prueba",
          {
            name: "Asesor de prueba",
            description: "Descripción de prueba aprobable",
            photo,
            role: "Cargo de prueba",
            phone: "18095550000",
            whatsapp: "18095550000",
            email: "agent@example.test",
            specialties: "Zona de prueba",
            instagram: "",
          },
          0,
          true,
        );
        profileRevision = 1;
        await as("other");
        assert.equal(
          (await db.query("select * from agent_profiles")).rows.length,
          0,
        );
        await denied(
          call("review_agent_profile", ids.agent, "published", "", 1),
        );
        await as();
        assert.equal((await call("public_platform_snapshot")).agents.length, 0);
        await as("admin");
        await call(
          "review_agent_profile",
          ids.agent,
          "published",
          "Contenido verificado",
          profileRevision,
        );
        await as();
        assert.equal((await call("public_platform_snapshot")).agents.length, 1);
        await denied(db.query("select draft from agent_profiles"));
      },
    );
    await t.test(
      "editar un perfil conserva exclusivamente su versión y slug aprobados",
      async () => {
        await as("agent");
        const old = (
          await db.query("select draft from agent_profiles where user_id=$1", [
            ids.agent,
          ])
        ).rows[0].draft;
        await call(
          "save_agent_profile",
          "nuevo-slug-privado",
          { ...old, name: "Nombre todavía no aprobado" },
          2,
          false,
        );
        await as();
        const a = (await call("public_platform_snapshot")).agents[0];
        assert.equal(a.slug, "asesor-prueba");
        assert.equal(a.content.name, "Asesor de prueba");
      },
    );
    await t.test(
      "peticiones RPC directas no admiten privilegios, objetos ni enlaces inseguros en perfiles",
      async () => {
        await as("agent");
        for (const bad of [
          { name: { unsafe: true } },
          { name: "Nombre de prueba", superadmin: "true" },
          { name: "Nombre de prueba", phone: "javascript:alert(1)" },
        ])
          await assert.rejects(
            call("save_agent_profile", "intento-invalido", bad, 3, false),
            { code: "22023" },
          );
      },
    );
    await t.test(
      "un asesor no reactiva un perfil ocultado al guardar otro borrador",
      async () => {
        await as("admin");
        await call(
          "review_agent_profile",
          ids.agent,
          "hidden",
          "Ocultación administrativa",
          3,
        );
        await as("agent");
        const draft = (
          await db.query("select draft from agent_profiles where user_id=$1", [
            ids.agent,
          ])
        ).rows[0].draft;
        await call("save_agent_profile", "perfil-revisado", draft, 4, true);
        await as();
        assert.equal((await call("public_platform_snapshot")).agents.length, 0);
        await as("admin");
        await call(
          "review_agent_profile",
          ids.agent,
          "published",
          "Nueva aprobación explícita",
          5,
        );
        await as();
        assert.equal((await call("public_platform_snapshot")).agents.length, 1);
      },
    );
    const content = {
      title: "Inmueble de prueba aislado",
      slug: "inmueble-prueba",
      reference: "TEST",
      location: "Santiago",
      type: "Apartamento",
      operation: "Venta",
      price: 100,
      price_provisional: false,
      description: "Descripción verificada de prueba",
      images: [],
    };
    await t.test(
      "propiedad nace como borrador propio, ignorando estado/propietario enviados",
      async () => {
        await as("agent");
        property = await call(
          "save_enterprise_property",
          null,
          {
            ...content,
            images: [{ path: photo, alt: "Foto de prueba" }],
            published: true,
            organization_id: "00000000-0000-4000-8000-000000000000",
            agent_id: ids.other,
            workflow_state: "published",
            thony_visible: true,
          },
          0,
        );
        const p = (
          await db.query("select * from properties where id=$1", [property])
        ).rows[0];
        assert.equal(p.published, false);
        assert.equal(p.workflow_state, "draft");
        assert.equal(p.agent_id, ids.agent);
        assert.equal(p.thony_visible, false);
        assert.equal(
          (
            await db.query(
              "update properties set published=true,workflow_state='published' where id=$1 returning id",
              [property],
            )
          ).rows.length,
          0,
        );
        await as();
        assert.equal(
          (await call("public_platform_snapshot")).properties.length,
          0,
        );
      },
    );
    await t.test(
      "otro agente y cuenta pendiente no pueden leer, editar ni apropiarse del inmueble",
      async () => {
        for (const name of ["other", "pending"]) {
          await as(name);
          assert.equal(
            (await db.query("select * from properties where id=$1", [property]))
              .rows.length,
            0,
          );
          await denied(call("save_enterprise_property", property, content, 1));
          await denied(
            call(
              "review_enterprise_property",
              property,
              "published",
              "",
              1,
              false,
            ),
          );
        }
        await as("other");
        await denied(
          call(
            "save_enterprise_property",
            null,
            {
              ...content,
              slug: "otra-ficha",
              images: [{ path: photo, alt: "Ajena" }],
            },
            0,
          ),
        );
      },
    );
    await t.test(
      "solicitar, aprobar y publicar son pasos distintos con control de versión",
      async () => {
        await as("agent");
        await call("submit_enterprise_property", property, 1);
        await denied(
          call(
            "review_enterprise_property",
            property,
            "approved",
            "",
            2,
            false,
          ),
        );
        await as("admin");
        await denied(
          call(
            "review_enterprise_property",
            property,
            "published",
            "",
            2,
            false,
          ),
        );
        await call(
          "review_enterprise_property",
          property,
          "approved",
          "Datos y precio comprobados",
          2,
          false,
        );
        await assert.rejects(
          call(
            "review_enterprise_property",
            property,
            "published",
            "",
            2,
            false,
          ),
          { code: "40001" },
        );
        await call(
          "review_enterprise_property",
          property,
          "published",
          "Aprobada",
          3,
          false,
        );
        await as();
        const snap = await call("public_platform_snapshot");
        assert.equal(snap.properties.length, 1);
        assert.equal(snap.properties[0].agent_id, ids.agent);
        assert.equal(
          await call("can_read_enterprise_media", photo.slice(9)),
          true,
        );
      },
    );
    await t.test(
      "editar lo aprobado retira la publicación y obliga a nueva revisión",
      async () => {
        await as("agent");
        await call(
          "save_enterprise_property",
          property,
          {
            ...content,
            images: [{ path: photo, alt: "Foto" }],
            title: "Modificado",
          },
          4,
        );
        await as();
        assert.equal(
          (await call("public_platform_snapshot")).properties.length,
          0,
        );
        assert.equal(
          await call("can_read_enterprise_media", photo.slice(9)),
          true,
        ); // Sigue referenciada por el perfil aprobado.
        await as("agent");
        await call("withdraw_enterprise_property", property, 5);
        assert.equal(
          (
            await db.query(
              "select workflow_state from properties where id=$1",
              [property],
            )
          ).rows[0].workflow_state,
          "hidden",
        );
      },
    );
    await t.test(
      "documentos privados y planos públicos solo tras nueva aprobación, sin exponer contratos",
      async () => {
        const privatePath = `platform/${org}/${ids.agent}/cccccccc-cccc-4ccc-8ccc-cccccccccccc.pdf`;
        const planPath = `platform/${org}/${ids.agent}/dddddddd-dddd-4ddd-8ddd-dddddddddddd.pdf`;
        await owner();
        await db.query(
          "insert into storage.objects(bucket_id,name) values('platform-media',$1),('platform-media',$2)",
          [privatePath.slice(9), planPath.slice(9)],
        );
        await as("agent");
        const profileForFileTest = (
          await db.query(
            "select draft,revision from agent_profiles where user_id=$1",
            [ids.agent],
          )
        ).rows[0];
        await denied(
          call(
            "save_agent_profile",
            "pdf-no-es-fotografia",
            { ...profileForFileTest.draft, photo: privatePath },
            profileForFileTest.revision,
            true,
          ),
        );
        await call(
          "set_property_document",
          property,
          6,
          privatePath,
          "Documento privado",
          "document",
          false,
          null,
        );
        await call(
          "set_property_document",
          property,
          7,
          planPath,
          "Plano autorizado",
          "plan",
          true,
          null,
        );
        await as("other");
        assert.equal(
          (await db.query("select * from property_documents")).rows.length,
          0,
        );
        await denied(
          call(
            "set_property_document",
            property,
            8,
            planPath,
            "Intento ajeno",
            "plan",
            true,
            null,
          ),
        );
        await as();
        assert.equal(
          await call("can_read_enterprise_media", planPath.slice(9)),
          false,
        );
        await denied(db.query("select * from property_documents"));
        await as("agent");
        await call("submit_enterprise_property", property, 8);
        await as("admin");
        await call(
          "review_enterprise_property",
          property,
          "approved",
          "Planos revisados",
          9,
          false,
        );
        await call(
          "review_enterprise_property",
          property,
          "published",
          "",
          10,
          false,
        );
        await as();
        const snap = await call("public_platform_snapshot");
        assert.deepEqual(snap.properties[0].public_documents, [
          { path: planPath, label: "Plano autorizado" },
        ]);
        assert.equal(
          await call("can_read_enterprise_media", planPath.slice(9)),
          true,
        );
        assert.equal(
          await call("can_read_enterprise_media", privatePath.slice(9)),
          false,
        );
        assert.equal(
          (await db.query("select id from properties")).rows.length,
          1,
        );
      },
    );
    await t.test(
      "ocultar un perfil retira sus inmuebles y un borrador propio no los reactiva",
      async () => {
        await as("admin");
        const profile = (
          await db.query(
            "select draft,revision from agent_profiles where user_id=$1",
            [ids.agent],
          )
        ).rows[0];
        await call(
          "review_agent_profile",
          ids.agent,
          "hidden",
          "Retirada de visibilidad",
          profile.revision,
        );
        await as();
        assert.equal(
          (await call("public_platform_snapshot")).properties.length,
          0,
        );
        await as("agent");
        await call(
          "save_agent_profile",
          "asesor-corregido",
          profile.draft,
          profile.revision + 1,
          true,
        );
        await as();
        assert.equal(
          (await call("public_platform_snapshot")).properties.length,
          0,
        );
        await as("admin");
        await call(
          "review_agent_profile",
          ids.agent,
          "published",
          "Identidad revisada otra vez",
          profile.revision + 2,
        );
        await as();
        assert.equal(
          (await call("public_platform_snapshot")).properties.length,
          1,
        );
      },
    );
    await t.test(
      "políticas restrictivas resisten concesiones permisivas antiguas adicionales",
      async () => {
        await owner();
        await db.exec(
          "create policy fixture_broad_storage on storage.objects for all to authenticated using(true) with check(true);create policy fixture_broad_properties on public.properties for select to authenticated using(true)",
        );
        await as("other");
        const secret = (await db.query("select id from property_documents"))
          .rows;
        assert.deepEqual(secret, []);
        assert.equal(
          (
            await db.query(
              "update storage.objects set name='overwritten' where bucket_id='platform-media' returning id",
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "delete from storage.objects where bucket_id='platform-media' returning id",
            )
          ).rows.length,
          0,
        );
        await denied(
          db.query(
            "insert into storage.objects(bucket_id,name) values('platform-media',$1)",
            [`${org}/${ids.agent}/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.jpg`],
          ),
        );
        await as("pending");
        assert.equal(
          (
            await db.query(
              "select id from properties where organization_id is not null",
            )
          ).rows.length,
          1,
        ); // Solo la ficha ya publicada, nunca borradores.
      },
    );
    await t.test(
      "suspensión retira perfil y archivos públicos sin borrar datos",
      async () => {
        await as("admin");
        await call(
          "review_organization_member",
          ids.agent,
          "suspended",
          "agent",
          "Revisión de cuenta",
          0,
        );
        await as();
        assert.equal((await call("public_platform_snapshot")).agents.length, 0);
        assert.equal(
          await call("can_read_enterprise_media", photo.slice(9)),
          false,
        );
      },
    );
    await t.test(
      "reversión conserva cuentas, propiedades, archivos y ambas configuraciones",
      async () => {
        await as("super");
        await call("change_site_mode", "thony", 1, "CAMBIAR A THONY");
        await as();
        const snapshot = await call("public_platform_snapshot");
        assert.equal(snapshot.mode, "thony");
        assert.equal(snapshot.properties.length, 1);
        assert.equal(snapshot.agents.length, 0);
        assert.equal(snapshot.registrationEnabled, false);
        await owner();
        assert.equal(
          (await db.query("select count(*)::int as n from properties")).rows[0]
            .n,
          2,
        );
        assert.equal(
          (await db.query("select count(*)::int as n from storage.objects"))
            .rows[0].n,
          5,
        );
        assert.equal(
          (await db.query("select count(*)::int as n from mode_change_audit"))
            .rows[0].n,
          2,
        );
        assert.equal(
          (await db.query("select content from site_drafts")).rows[0].content
            .texts.name,
          "Personal intacto",
        );
        await db.exec(sql[2]);
        assert.equal(
          (await db.query("select active_mode from platform_state")).rows[0]
            .active_mode,
          "thony",
        );
      },
    );
  } finally {
    await db.close();
  }
});
