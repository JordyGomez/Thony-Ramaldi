import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
const secret = "isolated-appointments-server-secret-2026-only-tests";
const calendar = "10000000-0000-4000-8000-000000000001";
const users = {
  owner: "11111111-1111-4111-8111-111111111111",
  super: "22222222-2222-4222-8222-222222222222",
  legacy: "33333333-3333-4333-8333-333333333333",
  agent: "44444444-4444-4444-8444-444444444444",
  limited: "55555555-5555-4555-8555-555555555555",
  unverified: "66666666-6666-4666-8666-666666666666",
};
const sql = await Promise.all(
  [
    "schema.sql",
    "migrations/20261018_site_editor.sql",
    "migrations/20261020_dual_mode_platform.sql",
    "migrations/20261021_appointments_crm.sql",
  ].map((p) => readFile(new URL("../supabase/" + p, import.meta.url), "utf8")),
);
const key = () => crypto.randomUUID();
test("agenda y CRM: PostgreSQL real, exclusión temporal, estados y privacidad", async (t) => {
  const db = new PGlite({ extensions: { btree_gist } });
  const call = async (fn, ...values) => {
    if (fn === "appointment_public_slots") {
      fn = "appointment_public_availability";
      values = [secret, values[1], values[2] || "presencial", values[0], null];
    }
    return (
      await db.query(
        `select public.${fn}(${values.map((_, i) => "$" + (i + 1)).join(",")}) result`,
        values,
      )
    ).rows[0].result;
  };
  const owner = () => db.exec("reset role");
  const as = async (name) => {
    await owner();
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify(
        name ? { sub: users[name], email: name + "@example.test" } : {},
      ),
    ]);
    await db.exec("set role " + (name ? "authenticated" : "anon"));
  };
  const row = async (id) =>
    (await db.query("select * from appointments where id=$1", [id])).rows[0];
  let day, day2, starts, prop;
  const payload = (start = starts, extra = {}) => ({
    name: "Persona de prueba aislada",
    email: "client@example.test",
    phone: "+18095550123",
    kind: "general",
    modality: "presencial",
    startsAt: start,
    comments: "Prueba sin envíos externos",
    communicationPreference: "email",
    operationalConsent: true,
    whatsappConsent: false,
    ...extra,
  });
  const request = (data = payload(), id = key()) =>
    call("appointment_request", secret, id, data);
  const admin = async (id, action, data = {}) => {
    await as("owner");
    const a = await row(id);
    return call("appointment_admin_action", id, action, a.version, data);
  };
  const resetAgenda = async () => {
    await owner();
    await db.exec(
      "update appointment_reservations set active=false;update appointments set status='cancelled_thony';update notification_jobs set status='cancelled';delete from appointment_blackouts;update appointment_settings set enabled=true,owner_whatsapp_opt_in=false,owner_whatsapp_opt_in_at=null,reminder_24h=true,reminder_day=true,reminder_time='07:00',buffer_minutes=30,durations='{\"property_visit\":120,\"buy\":120,\"rent\":120,\"invest\":120,\"general\":120}',max_daily_appointments=24,minimum_notice_minutes=30,modalities='{presencial,virtual}';update appointment_runtime set last_worker_at=now(),scheduler_enabled_at=now();",
    );
    await as();
  };
  const fails = (p, code) =>
    assert.rejects(p, (e) => e.code === code, `Debe rechazar con ${code}`);
  try {
    await db.exec(`create role anon;create role authenticated;create role supabase_auth_admin;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
 grant usage on schema auth,storage to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;`);
    for (const [name, id] of Object.entries(users))
      await db.query("insert into auth.users values($1,$2,$3)", [
        id,
        name + "@example.test",
        name === "unverified" ? null : "2026-10-01",
      ]);
    for (const migration of sql) await db.exec(migration);
    await t.test(
      "instalación repetible: Thony, reservas cerradas, sin horarios o permisos inventados",
      async () => {
        await db.exec(sql[3]);
        assert.equal((await call("appointment_public_config")).enabled, false);
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from appointment_access_grants",
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from appointment_availability_rules",
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (await db.query("select active_mode from platform_state")).rows[0]
            .active_mode,
          "thony",
        );
      },
    );
    await db.query(
      "update appointment_settings set owner_user_id=$1,email='owner@example.test',whatsapp='+18095550100',enabled=true,max_daily_appointments=24",
      [users.owner],
    );
    for (const [name, kind] of [
      ["owner", "owner"],
      ["limited", "technical"],
    ])
      await db.query(
        "insert into appointment_access_grants(calendar_id,user_id,kind,can_manage,can_read_leads,can_export,can_manage_permissions,can_view_notifications) values($1,$2,$3,true,$4,$4,$4,true)",
        [calendar, users[name], kind, name === "owner"],
      );
    for (const name of ["super", "limited"])
      await db.query("insert into platform_superadmins(user_id) values($1)", [
        users[name],
      ]);
    await db.query("insert into admin_users values('legacy@example.test')");
    await db.query(
      "update appointment_runtime set server_secret_hash=encode(sha256(convert_to($1,'UTF8')),'hex'),last_worker_at=now(),scheduler_enabled_at=now()",
      [secret],
    );
    for (let n = 0; n < 7; n++)
      await db.query(
        "insert into appointment_availability_rules(calendar_id,weekday,starts_at,ends_at) values($1,$2,'08:00','20:00')",
        [calendar, n],
      );
    day = (
      await db.query(
        "select ((now() at time zone 'America/Santo_Domingo')::date+3)::text d",
      )
    ).rows[0].d;
    day2 = (
      await db.query(
        "select ((now() at time zone 'America/Santo_Domingo')::date+4)::text d",
      )
    ).rows[0].d;
    starts = day + "T08:00:00-04:00";
    prop = (
      await db.query(
        "insert into properties(slug,reference,title,location,type,operation,price,images) values('isolated-test','ISOLATED','Propiedad exclusivamente de pruebas','Ubicación ficticia','Apartamento','Venta',100,'[]') returning id",
      )
    ).rows[0].id;
    await t.test(
      "anónimo solo ve disponibilidad, sin clientes, motivos de bloqueos ni ayudantes privilegiados",
      async () => {
        await as();
        const slots = await call(
          "appointment_public_slots",
          day,
          "general",
          "presencial",
        );
        assert.ok(slots.length > 0);
        assert.equal(
          slots[0].startsAt,
          new Date(starts).toISOString().replace(".000Z", "+00:00"),
        );
        for (const table of [
          "leads",
          "appointments",
          "appointment_blackouts",
          "notification_jobs",
          "appointment_customer_grants",
        ])
          await fails(db.query("select * from " + table), "42501");
        await fails(
          call("appointment_propose", key(), starts, "thony"),
          "42501",
        );
        await fails(
          call("appointment_request", "wrong-server-secret", key(), payload()),
          "42501",
        );
      },
    );
    await t.test(
      "admins legados, agentes y SUPERADMIN sin concesión específica no acceden al CRM",
      async () => {
        for (const user of ["legacy", "agent", "super", "unverified"]) {
          await as(user);
          assert.equal((await call("appointment_access")).manage, false);
          await fails(call("appointment_workspace", "leads"), "42501");
          await fails(call("appointment_admin_slots", day), "42501");
          assert.equal((await db.query("select * from leads")).rows.length, 0);
        }
        await as("limited");
        assert.equal((await call("appointment_access")).manage, true);
        assert.equal((await call("appointment_access")).leads, false);
        await fails(call("appointment_workspace", "leads"), "42501");
        await fails(call("appointment_export"), "42501");
        await fails(db.query("select payload from notification_jobs"), "42501");
      },
    );
    await t.test(
      "reserva válida: pendiente, ID impredecible, margen completo y cero entregas ficticias",
      async () => {
        await as();
        const r = await request();
        assert.equal(r.status, "pending");
        assert.match(r.id, /^[a-f0-9-]{36}$/);
        assert.ok(r.grant.nonce);
        await owner();
        const a = await row(r.id);
        assert.equal(
          (new Date(a.ends_at) - new Date(a.starts_at)) / 60000,
          120,
        );
        const held = (
          await db.query(
            "select upper(occupied) until from appointment_reservations where appointment_id=$1",
            [r.id],
          )
        ).rows[0].until;
        assert.equal((new Date(held) - new Date(a.starts_at)) / 60000, 150);
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from notification_jobs where status in('sent','delivered')",
            )
          ).rows[0].n,
          0,
        );
        await as();
        const slots = await call("appointment_public_slots", day, "general");
        assert.ok(
          !slots.some(
            (s) => new Date(s.startsAt) < new Date(day + "T10:30:00-04:00"),
          ),
        );
      },
    );
    await t.test(
      "dos solicitudes simultáneas solo pueden conservar un intervalo",
      async () => {
        await resetAgenda();
        const settled = await Promise.allSettled([
          request(payload(starts, { email: "a@example.test" })),
          request(payload(starts, { email: "b@example.test" })),
        ]);
        assert.equal(settled.filter((s) => s.status === "fulfilled").length, 1);
        assert.equal(
          settled.find((s) => s.status === "rejected").reason.code,
          "23P01",
        );
      },
    );
    await t.test(
      "idempotencia conserva una solicitud y rechaza reutilizar su clave con otros datos",
      async () => {
        await resetAgenda();
        const id = key(),
          one = await request(payload(), id),
          two = await request(payload(), id);
        assert.equal(one.id, two.id);
        await fails(
          request(payload(starts, { name: "Otra persona" }), id),
          "23505",
        );
      },
    );
    await t.test(
      "exclusión GiST impide solapamientos incluso saltándose la RPC en una conexión propietaria aislada",
      async () => {
        await resetAgenda();
        const a = await request();
        const b = await request(payload(day2 + "T08:00:00-04:00"));
        await owner();
        await fails(
          db.query(
            "insert into appointment_reservations(calendar_id,appointment_id,kind,occupied) values($1,$2,'proposal',tstzrange($3::timestamptz,$3::timestamptz+interval '2 hours','[)'))",
            [calendar, b.id, starts],
          ),
          "23P01",
        );
        assert.ok(a.id);
      },
    );
    await t.test(
      "duración 60, 90, 120 y personalizada, margen y final de jornada se calculan en intervalos",
      async () => {
        await resetAgenda();
        await owner();
        for (const duration of [60, 90, 120, 180]) {
          await db.query(
            "update appointment_settings set durations=jsonb_set(durations,'{general}',to_jsonb($1::int))",
            [duration],
          );
          const slots = await call("appointment_public_slots", day, "general");
          assert.equal(
            (new Date(slots[0].endsAt) - new Date(slots[0].startsAt)) / 60000,
            duration,
          );
          assert.ok(
            slots.every(
              (s) =>
                new Date(s.endsAt).getTime() + 30 * 60000 <=
                new Date(day + "T20:00:00-04:00").getTime(),
            ),
          );
        }
        await as();
        assert.deepEqual(
          await call("appointment_public_slots", "2020-01-01", "general"),
          [],
        );
      },
    );
    await t.test(
      "bloqueo de día completo, ausencia y clase recurrente nunca exponen motivos privados",
      async () => {
        await resetAgenda();
        await owner();
        await db.query(
          "insert into appointment_blackouts(calendar_id,label,starts_at,ends_at) values($1,'Examen privado',($2::date::timestamp at time zone 'America/Santo_Domingo'),(($2::date+1)::timestamp at time zone 'America/Santo_Domingo'))",
          [calendar, day],
        );
        await as();
        assert.deepEqual(
          await call("appointment_public_slots", day, "general"),
          [],
        );
        await owner();
        await db.exec("delete from appointment_blackouts");
        await db.query(
          "insert into appointment_blackouts(calendar_id,label,weekday,start_time,end_time,valid_from,valid_until) values($1,'Clase privada',extract(dow from $2::date),'08:00','11:00',$2::date,$2::date+30)",
          [calendar, day],
        );
        await as();
        const slots = await call("appointment_public_slots", day, "general");
        assert.ok(slots.length > 0);
        assert.ok(
          slots.every(
            (s) => new Date(s.startsAt) >= new Date(day + "T11:00:00-04:00"),
          ),
        );
        assert.ok(!JSON.stringify(slots).includes("Clase"));
      },
    );
    await t.test(
      "rechaza datos, privilegios enviados, consentimiento ausente y propiedades inexistentes o demo",
      async () => {
        await resetAgenda();
        for (const extra of [
          { status: "confirmed" },
          { operationalConsent: false },
          { email: "invalid" },
          { phone: "123" },
          { name: { admin: true } },
          { communicationPreference: "whatsapp", whatsappConsent: false },
          { kind: "property_visit", propertyId: key() },
        ])
          await assert.rejects(request(payload(starts, extra)));
        const r = await request(
          payload(starts, { kind: "property_visit", propertyId: prop }),
        );
        assert.ok(r.id);
      },
    );
    await t.test(
      "las pendientes vencen, liberan intervalo y no admiten confirmación tardía",
      async () => {
        await resetAgenda();
        const r = await request();
        await owner();
        await db.query(
          "update appointments set hold_expires_at=now()-interval '1 second' where id=$1",
          [r.id],
        );
        await as();
        assert.ok(
          (await call("appointment_public_slots", day, "general")).some(
            (s) =>
              new Date(s.startsAt).getTime() === new Date(starts).getTime(),
          ),
        );
        await as("owner");
        const a = await row(r.id);
        assert.equal(a.status, "expired");
        await fails(
          call("appointment_admin_action", r.id, "confirm", a.version, {
            instructions: "Lugar de prueba",
          }),
          "55000",
        );
        const next = await request();
        assert.notEqual(next.id, r.id);
      },
    );
    await t.test(
      "confirmación manual mantiene el intervalo y crea recordatorios 24h y 7am correctos",
      async () => {
        await resetAgenda();
        const r = await request();
        await admin(r.id, "confirm", {
          instructions: "Oficina de prueba autorizada",
        });
        await owner();
        const a = await row(r.id);
        assert.equal(a.status, "confirmed");
        const jobs = (
          await db.query(
            "select event,scheduled_at from notification_jobs where appointment_id=$1 and event like 'reminder_%'",
            [r.id],
          )
        ).rows;
        assert.ok(jobs.length >= 4);
        for (const job of jobs) {
          const expected =
            job.event === "reminder_24h"
              ? new Date(new Date(starts) - 86400000)
              : new Date(day + "T07:00:00-04:00");
          assert.equal(
            new Date(job.scheduled_at).getTime(),
            expected.getTime(),
          );
        }
      },
    );
    await t.test(
      "cancelar o rechazar libera horarios e invalida recordatorios anteriores",
      async () => {
        await resetAgenda();
        const r = await request();
        await admin(r.id, "confirm", { instructions: "Lugar verificado" });
        await admin(r.id, "cancel", { note: "Nota privada" });
        await owner();
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from notification_jobs where appointment_id=$1 and event like 'reminder_%' and status<>'cancelled'",
              [r.id],
            )
          ).rows[0].n,
          0,
        );
        await as();
        const next = await request();
        await admin(next.id, "reject", { note: "Motivo personal privado" });
        await as();
        assert.ok(
          (await call("appointment_public_slots", day, "general")).length > 0,
        );
      },
    );
    await t.test(
      "propuesta preserva cita confirmada y solo la otra parte puede aceptarla",
      async () => {
        await resetAgenda();
        const r = await request();
        await admin(r.id, "confirm", { instructions: "Lugar aprobado" });
        await admin(r.id, "propose", {
          startsAt: day2 + "T08:00:00-04:00",
          instructions: "Lugar aprobado",
        });
        await owner();
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from appointment_reservations where appointment_id=$1 and active",
              [r.id],
            )
          ).rows[0].n,
          2,
        );
        await as("owner");
        const a = await row(r.id);
        await fails(
          call(
            "appointment_admin_action",
            r.id,
            "accept_proposal",
            a.version,
            {},
          ),
          "42501",
        );
        await as();
        await call(
          "appointment_customer",
          secret,
          r.grant,
          "accept_proposal",
          {},
        );
        await owner();
        const final = await row(r.id);
        assert.equal(final.status, "confirmed");
        assert.equal(final.schedule_version, 1);
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from appointment_reservations where appointment_id=$1 and active",
              [r.id],
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "propuesta vencida restaura la cita original sin perder su reserva",
      async () => {
        await resetAgenda();
        const r = await request();
        await admin(r.id, "confirm", { instructions: "Lugar aprobado" });
        await admin(r.id, "propose", { startsAt: day2 + "T08:00:00-04:00" });
        await owner();
        await db.query(
          "update appointment_proposals set expires_at=now()-interval '1 second' where appointment_id=$1",
          [r.id],
        );
        await as();
        await call("appointment_public_slots", day2, "general");
        await owner();
        assert.equal((await row(r.id)).status, "confirmed");
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from appointment_reservations where appointment_id=$1 and active",
              [r.id],
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "cliente solicita reprogramación y Thony acepta sin soltar antes el original",
      async () => {
        await resetAgenda();
        const r = await request();
        await admin(r.id, "confirm", { instructions: "Lugar aprobado" });
        await as();
        await call("appointment_customer", secret, r.grant, "propose", {
          startsAt: day2 + "T08:00:00-04:00",
        });
        await owner();
        assert.equal((await row(r.id)).status, "reschedule_requested");
        await admin(r.id, "accept_proposal");
        await owner();
        assert.equal((await row(r.id)).status, "confirmed");
      },
    );
    await t.test(
      "cliente A no puede cambiar el alcance de su capacidad por el ID del cliente B",
      async () => {
        await resetAgenda();
        const a = await request(),
          b = await request(
            payload(day2 + "T08:00:00-04:00", { email: "b@example.test" }),
          );
        await as();
        const own = await call(
          "appointment_customer",
          secret,
          a.grant,
          "read",
          {},
        );
        assert.equal(own.id, a.id);
        await fails(
          call(
            "appointment_customer",
            secret,
            { ...a.grant, id: b.grant.id },
            "read",
            {},
          ),
          "42501",
        );
        await fails(
          call(
            "appointment_customer",
            secret,
            { ...a.grant, expiresAt: a.grant.expiresAt + 1000 },
            "read",
            {},
          ),
          "42501",
        );
        assert.ok(!JSON.stringify(own).includes("b@example.test"));
      },
    );
    await t.test(
      "una cita terminal no vuelve a pendiente ni recibe recordatorios",
      async () => {
        await resetAgenda();
        const r = await request();
        await admin(r.id, "reject", { note: "Privado" });
        await admin(r.id, "confirm", { instructions: "Prueba" }).then(
          () => assert.fail("No debe confirmar"),
          (e) => assert.equal(e.code, "55000"),
        );
        await as();
        await fails(
          call("appointment_customer", secret, r.grant, "propose", {
            startsAt: day2 + "T08:00:00-04:00",
          }),
          "55000",
        );
      },
    );
    await t.test(
      "bloquear un horario ocupado falla atómicamente; versiones evitan sobrescribir configuración",
      async () => {
        await resetAgenda();
        await request();
        await as("owner");
        const c = (await db.query("select * from appointment_settings"))
          .rows[0];
        await fails(
          call(
            "appointment_configure",
            "blackout_save",
            {
              label: "Clase",
              starts_at: starts,
              ends_at: day + "T11:00:00-04:00",
            },
            c.revision,
          ),
          "23P01",
        );
        assert.equal(
          (await db.query("select * from appointment_blackouts")).rows.length,
          0,
        );
        await fails(
          call(
            "appointment_configure",
            "settings",
            { buffer_minutes: 0 },
            c.revision + 10,
          ),
          "40001",
        );
      },
    );
    await t.test(
      "CRM conserva posibles duplicados sin fusionar y estados comerciales explícitos",
      async () => {
        await resetAgenda();
        const a = await request(),
          b = await request(payload(day2 + "T08:00:00-04:00"));
        await as("owner");
        const workspace = await call("appointment_workspace", "leads");
        assert.ok(workspace.leads.length >= 2);
        const lead = workspace.leads.find(
          (l) =>
            l.id === workspace.appointments.find((x) => x.id === a.id).lead_id,
        );
        assert.ok(lead.duplicateCandidates.length > 0);
        await call(
          "appointment_lead_action",
          lead.id,
          "note",
          { body: "Seguimiento interno" },
          lead.version,
        );
        const current = (
          await db.query("select * from leads where id=$1", [lead.id])
        ).rows[0];
        await call(
          "appointment_lead_action",
          lead.id,
          "status",
          { status: "negotiation" },
          current.version,
        );
        assert.notEqual((await row(a.id)).lead_id, (await row(b.id)).lead_id);
      },
    );
    await t.test(
      "procesamiento concurrente, trabajos idempotentes y proveedor desactivado no equivalen a enviado",
      async () => {
        await resetAgenda();
        const r = await request();
        await as();
        const [one, two] = await Promise.all([
          call("appointment_worker_claim", secret, 2),
          call("appointment_worker_claim", secret, 2),
        ]);
        assert.equal(
          new Set([...one, ...two].map((j) => j.id)).size,
          one.length + two.length,
        );
        const job = [...one, ...two].find((j) => j.appointment_id === r.id);
        assert.ok(job);
        await call(
          "appointment_worker_finish",
          secret,
          job.id,
          job.claim_token,
          "blocked",
          null,
          null,
          "provider_not_configured",
        );
        await owner();
        const j = (
          await db.query("select * from notification_jobs where id=$1", [
            job.id,
          ])
        ).rows[0];
        assert.equal(j.status, "blocked");
        assert.equal(j.attempts, 0);
        assert.equal(j.sent_at, null);
      },
    );
    await t.test(
      "entrega solo mediante evento autenticado; replays y eventos tardíos no degradan entregado",
      async () => {
        await resetAgenda();
        await request();
        await as();
        const jobs = await call("appointment_worker_claim", secret, 10);
        const j = jobs.find((j) => j.channel === "email");
        await call(
          "appointment_worker_finish",
          secret,
          j.id,
          j.claim_token,
          "sent",
          "resend",
          "isolated-provider-id",
          null,
        );
        await fails(
          call(
            "appointment_delivery",
            "bad-secret",
            "resend",
            "isolated-event",
            "isolated-provider-id",
            "delivered",
          ),
          "42501",
        );
        await call(
          "appointment_delivery",
          secret,
          "resend",
          "isolated-event",
          "isolated-provider-id",
          "delivered",
        );
        await call(
          "appointment_delivery",
          secret,
          "resend",
          "isolated-event",
          "isolated-provider-id",
          "delivered",
        );
        await call(
          "appointment_delivery",
          secret,
          "resend",
          "isolated-event-late",
          "isolated-provider-id",
          "sent",
        );
        await owner();
        assert.equal(
          (
            await db.query("select status from notification_jobs where id=$1", [
              j.id,
            ])
          ).rows[0].status,
          "delivered",
        );
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from notification_delivery_events where event_id='isolated-event'",
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "Meta interrumpido queda incierto para evitar reenvío ciego; Resend reintenta con la misma clave",
      async () => {
        await resetAgenda();
        await owner();
        await db.exec(
          "update appointment_settings set owner_whatsapp_opt_in=true",
        );
        await as();
        await request();
        const jobs = await call("appointment_worker_claim", secret, 20);
        await owner();
        await db.exec(
          "update notification_jobs set lease_until=now()-interval '1 second' where status='processing'",
        );
        await as();
        const retry = await call("appointment_worker_claim", secret, 20);
        await owner();
        const metas = (
          await db.query(
            "select status from notification_jobs where id=any($1::uuid[]) and channel='whatsapp'",
            [jobs.map((j) => j.id)],
          )
        ).rows;
        assert.ok(metas.length > 0);
        assert.ok(metas.every((j) => j.status === "uncertain"));
        assert.ok(retry.some((j) => j.channel === "email"));
      },
    );
    await t.test(
      "límites persistentes, grant de técnico y exportación se autorizan por UID",
      async () => {
        await as();
        for (let n = 0; n < 4; n++)
          assert.equal(
            await call(
              "appointment_rate_gate",
              secret,
              "a".repeat(64),
              "booking_contact",
            ),
            true,
          );
        assert.equal(
          await call(
            "appointment_rate_gate",
            secret,
            "a".repeat(64),
            "booking_contact",
          ),
          false,
        );
        await as("super");
        await fails(
          call("appointment_grant_action", users.super, false, {
            manage: true,
          }),
          "42501",
        );
        await as("owner");
        await call("appointment_grant_action", users.super, false, {
          manage: true,
          leads: true,
        });
        await as("super");
        assert.equal((await call("appointment_access")).leads, true);
        await fails(call("appointment_export"), "42501");
        await as("owner");
        assert.ok(Array.isArray(await call("appointment_export")));
      },
    );
    await t.test(
      "anonimización elimina PII, notas, payloads y capacidades sin perder historia de estados",
      async () => {
        await resetAgenda();
        const r = await request();
        await admin(r.id, "reject", { note: "Razón privada" });
        await as("owner");
        const a = await row(r.id);
        const lead = (
          await db.query("select * from leads where id=$1", [a.lead_id])
        ).rows[0];
        await call(
          "appointment_lead_action",
          lead.id,
          "anonymize",
          { confirmation: "ELIMINAR DATOS PERSONALES" },
          lead.version,
        );
        assert.equal(
          (await db.query("select email from leads where id=$1", [lead.id]))
            .rows[0].email,
          null,
        );
        await as();
        await fails(
          call("appointment_customer", secret, r.grant, "read", {}),
          "42501",
        );
        await owner();
        assert.ok(
          (
            await db.query(
              "select * from appointment_history where appointment_id=$1",
              [r.id],
            )
          ).rows.length > 0,
        );
      },
    );

    await t.test(
      "los ayudantes SQL de disponibilidad y escritura no permiten saltarse el servidor",
      async () => {
        await resetAgenda();
        await as();
        await fails(
          db.query("select appointment_public_slots($1::date,$2)", [
            day,
            "general",
          ]),
          "42501",
        );
        await fails(
          call("appointment_public_month", day.slice(0, 7) + "-01", "general"),
          "42501",
        );
        await fails(call("appointment_queue_event", key(), "confirm"), "42501");
        await fails(
          call(
            "appointment_public_availability",
            "bad-secret",
            "general",
            "presencial",
            day,
            null,
          ),
          "42501",
        );
      },
    );
    await t.test(
      "citas tempranas adelantan el aviso del día y una confirmación tardía no crea 24h retroactivas",
      async () => {
        await resetAgenda();
        await owner();
        await db.exec(
          "update appointment_availability_rules set starts_at='05:00'",
        );
        const early = day + "T06:00:00-04:00";
        await as();
        const r = await request(payload(early));
        await admin(r.id, "confirm", { instructions: "Lugar de prueba" });
        await owner();
        const due = (
          await db.query(
            "select scheduled_at from notification_jobs where appointment_id=$1 and event='reminder_day'",
            [r.id],
          )
        ).rows;
        assert.equal(due.length, 2);
        assert.ok(
          due.every(
            (j) =>
              new Date(j.scheduled_at).getTime() ===
              new Date(day + "T05:00:00-04:00").getTime(),
          ),
        );
        await resetAgenda();
        const a = await request();
        await owner();
        await db.query(
          "update appointments set starts_at=now()+interval '6 hours',ends_at=now()+interval '8 hours' where id=$1",
          [a.id],
        );
        await db.query(
          "update appointment_reservations set occupied=(select tstzrange(starts_at,ends_at+make_interval(mins=>buffer_minutes),'[)') from appointments where id=$1) where appointment_id=$1 and active",
          [a.id],
        );
        await admin(a.id, "confirm", { instructions: "Lugar real de pruebas" });
        await owner();
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from notification_jobs where appointment_id=$1 and event='reminder_24h'",
              [a.id],
            )
          ).rows[0].n,
          0,
        );
        await db.exec(
          "update appointment_availability_rules set starts_at='08:00'",
        );
      },
    );
    await t.test(
      "retirar WhatsApp invalida envíos pendientes y volver a consentir recupera solo recordatorios futuros",
      async () => {
        await resetAgenda();
        const a = await request(
          payload(starts, {
            whatsappConsent: true,
            communicationPreference: "both",
          }),
        );
        await admin(a.id, "confirm", { instructions: "Lugar de pruebas" });
        await as();
        await call("appointment_customer", secret, a.grant, "preferences", {
          whatsappConsent: false,
          communicationPreference: "email",
        });
        await owner();
        assert.equal(
          (
            await db.query(
              "select count(*)::int n from notification_jobs where appointment_id=$1 and recipient='client' and channel='whatsapp' and status<>'cancelled'",
              [a.id],
            )
          ).rows[0].n,
          0,
        );
        await as();
        await fails(
          call("appointment_customer", secret, a.grant, "preferences", {
            communicationPreference: "email",
          }),
          "22023",
        );
        await call("appointment_customer", secret, a.grant, "preferences", {
          whatsappConsent: true,
          communicationPreference: "both",
        });
        await owner();
        const jobs = (
          await db.query(
            "select * from notification_jobs where appointment_id=$1 and recipient='client' and channel='whatsapp' and status='pending'",
            [a.id],
          )
        ).rows;
        assert.equal(jobs.length, 2);
        assert.ok(
          jobs.every(
            (j) =>
              j.event.startsWith("reminder_") &&
              new Date(j.scheduled_at) > new Date(),
          ),
        );
      },
    );
    await t.test(
      "cambiar reglas de recordatorio invalida generaciones anteriores sin repetir avisos ya aceptados",
      async () => {
        await resetAgenda();
        const a = await request();
        await admin(a.id, "confirm", {
          instructions: "Prueba de configuración",
        });
        await as("owner");
        let c = (await db.query("select * from appointment_settings")).rows[0];
        await call(
          "appointment_configure",
          "settings",
          { reminder_time: "06:30" },
          c.revision,
        );
        await owner();
        let jobs = (
          await db.query(
            "select * from notification_jobs where appointment_id=$1 and event='reminder_day'",
            [a.id],
          )
        ).rows;
        assert.equal(jobs.filter((j) => j.status === "pending").length, 2);
        assert.ok(
          jobs
            .filter((j) => j.status === "pending")
            .every(
              (j) =>
                new Date(j.scheduled_at).getTime() ===
                new Date(day + "T06:30:00-04:00").getTime(),
            ),
        );
        await db.query(
          "update notification_jobs set status='sent',provider='resend',provider_id='isolated-reminder-'||id::text,sent_at=now() where appointment_id=$1 and event='reminder_day' and channel='email' and recipient='client' and status='pending'",
          [a.id],
        );
        await as("owner");
        c = (await db.query("select * from appointment_settings")).rows[0];
        await call(
          "appointment_configure",
          "settings",
          { reminder_time: "07:00" },
          c.revision,
        );
        await owner();
        jobs = (
          await db.query(
            "select * from notification_jobs where appointment_id=$1 and event='reminder_day' and channel='email'",
            [a.id],
          )
        ).rows;
        assert.equal(jobs.filter((j) => j.status === "pending").length, 1);
        assert.equal(
          jobs.find((j) => j.status === "pending").recipient,
          "owner",
        );
        assert.equal(jobs.filter((j) => j.status === "sent").length, 1);
      },
    );
    await t.test(
      "relacionar una cita finalizada revoca el enlace anterior y no fusiona notas ni identidades",
      async () => {
        await resetAgenda();
        const a = await request(),
          b = await request(
            payload(day2 + "T08:00:00-04:00", {
              name: "Otra persona",
              email: "other@example.test",
            }),
          );
        await admin(a.id, "reject", { note: "Prueba finalizada" });
        await as("owner");
        const first = await row(a.id),
          second = await row(b.id);
        const lead = (
          await db.query("select * from leads where id=$1", [first.lead_id])
        ).rows[0];
        await call(
          "appointment_lead_action",
          lead.id,
          "link_appointment",
          { appointmentId: a.id, targetLeadId: second.lead_id },
          lead.version,
        );
        await as();
        await fails(
          call("appointment_customer", secret, a.grant, "read", {}),
          "42501",
        );
        const own = await call(
          "appointment_customer",
          secret,
          b.grant,
          "read",
          {},
        );
        assert.equal(own.id, b.id);
        await owner();
        assert.equal((await row(a.id)).lead_id, second.lead_id);
        assert.ok(
          (await db.query("select * from leads where id=$1", [lead.id]))
            .rows[0],
        );
      },
    );
    await t.test(
      "quitar SUPERADMIN revoca acceso inmediatamente y permite retirar su concesión técnica",
      async () => {
        await as("owner");
        await call("appointment_grant_action", users.super, false, {
          manage: true,
          leads: true,
        });
        await owner();
        await db.query("delete from platform_superadmins where user_id=$1", [
          users.super,
        ]);
        await as("super");
        assert.equal((await call("appointment_access")).manage, false);
        await fails(call("appointment_search_leads"), "42501");
        await as("owner");
        await call("appointment_grant_action", users.super, true, {});
        await owner();
        assert.ok(
          (
            await db.query(
              "select revoked_at from appointment_access_grants where user_id=$1",
              [users.super],
            )
          ).rows[0].revoked_at,
        );
      },
    );
    await t.test(
      "retención suprime solo fichas inactivas sin citas vigentes y conserva el historial mínimo",
      async () => {
        await resetAgenda();
        const a = await request(),
          b = await request(payload(day2 + "T08:00:00-04:00"));
        await admin(a.id, "reject", { note: "Prueba de retención" });
        await owner();
        const first = await row(a.id),
          second = await row(b.id);
        await db.query(
          "update leads set last_interaction_at=now()-interval '400 days' where id=any($1::uuid[])",
          [[first.lead_id, second.lead_id]],
        );
        await as();
        assert.ok((await call("appointment_worker_cleanup", secret)) >= 1);
        await owner();
        const rows = (
          await db.query(
            "select id,email,anonymized_at from leads where id=any($1::uuid[])",
            [[first.lead_id, second.lead_id]],
          )
        ).rows;
        assert.equal(rows.find((l) => l.id === first.lead_id).email, null);
        assert.equal(
          rows.find((l) => l.id === second.lead_id).anonymized_at,
          null,
        );
      },
    );
    await t.test(
      "scripts Cron/Vault y pausa son ejecutables en SQL aislado sin exponer el secreto",
      async () => {
        await resetAgenda();
        await owner();
        await db.exec(`create schema vault;create schema net;create schema cron;
        create table vault.decrypted_secrets(name text,decrypted_secret text);
        create table net.http_request_queue(id bigint generated always as identity, url text,headers jsonb,body jsonb);
        create table cron.job(jobid bigint generated always as identity,jobname text unique,schedule text,active boolean default true,command text);
        create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) returns bigint language sql as $$insert into net.http_request_queue(url,headers,body) values(url,headers,body) returning id$$;
        create function cron.schedule(job_name text,schedule text,command text) returns bigint language sql as $$insert into cron.job(jobname,schedule,command) values(job_name,schedule,command) on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command,active=true returning jobid$$;
        create function cron.unschedule(job_id bigint) returns boolean language sql as $$update cron.job set active=false where jobid=job_id returning true$$;`);
        await db.query("insert into vault.decrypted_secrets values($1,$2)", [
          "thony_appointments_server_secret",
          secret,
        ]);
        const cronSql = await readFile(
          new URL("../supabase/ops/appointments-cron.sql", import.meta.url),
          "utf8",
        );
        await db.exec(cronSql);
        await db.exec(cronSql);
        assert.equal(
          (await db.query("select count(*)::int n from cron.job")).rows[0].n,
          1,
        );
        await as();
        await fails(call("appointment_cron_tick"), "42501");
        await fails(db.query("select * from vault.decrypted_secrets"), "42501");
        await owner();
        await call("appointment_cron_tick");
        const outbound = (
          await db.query("select * from net.http_request_queue")
        ).rows[0];
        assert.equal(
          outbound.url,
          "https://thony-ramaldi.vercel.app/api/internal/appointments/process",
        );
        assert.equal(outbound.headers.Authorization, "Bearer " + secret);
        const before = (
          await db.query("select count(*)::int n from appointments")
        ).rows[0].n;
        await db.exec(
          await readFile(
            new URL("../supabase/ops/appointments-pause.sql", import.meta.url),
            "utf8",
          ),
        );
        assert.equal((await call("appointment_public_config")).enabled, false);
        assert.equal(
          (await db.query("select active from cron.job")).rows[0].active,
          false,
        );
        assert.equal(
          (await db.query("select count(*)::int n from appointments")).rows[0]
            .n,
          before,
        );
      },
    );
    await t.test(
      "sin cron saludable o con modo Ramaldi el registro de citas queda cerrado",
      async () => {
        await resetAgenda();
        await owner();
        await db.exec(
          "update appointment_runtime set last_worker_at=now()-interval '6 minutes'",
        );
        assert.equal((await call("appointment_public_config")).enabled, false);
        await db.exec(
          "update appointment_runtime set last_worker_at=now();update platform_state set active_mode='ramaldi'",
        );
        assert.equal((await call("appointment_public_config")).enabled, false);
        await as();
        await fails(request(), "55000");
      },
    );
  } finally {
    await db.close();
  }
});
