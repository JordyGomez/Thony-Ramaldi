"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  corporateDefaults,
  parseCorporateSettings,
  parseAgentContent,
  profileDefaults,
  workflowLabels,
  type CorporateSettings,
  type AgentContent,
  type PlatformAccess,
} from "@/lib/platform";
import type { PropertyRow } from "@/data/property-row";
import { MediaUploader } from "../media-uploader";
import styles from "../admin.module.css";

type Profile = {
  user_id: string;
  slug: string;
  draft: AgentContent;
  published_content: AgentContent | null;
  status: string;
  revision: number;
  reviewer_note: string;
};
type Member = {
  user_id: string;
  role: string;
  status: string;
  revision: number;
  application: { name?: string; description?: string };
  reviewer_note: string;
};
type Document = {
  id: string;
  property_id: string;
  path: string;
  label: string;
  kind: string;
  public_on_publication: boolean;
};
type State = {
  documents?: Document[];
  approvals?: {
    property_id: string;
    action: string;
    note: string;
    created_at: string;
  }[];
  invitations?: {
    id: string;
    email: string;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
  }[];
  properties?: PropertyRow[];
  profiles?: Profile[];
  members?: Member[];
  settings?: {
    draft: CorporateSettings;
    published_content: CorporateSettings | null;
    revision: number;
    published_revision: number;
  };
  history?: {
    revision: number;
    content: CorporateSettings;
    published_at: string;
  }[];
  audit?: {
    event: string;
    actor_id: string;
    subject_id: string;
    created_at: string;
    details: unknown;
  }[];
};
export async function platformRequest(input: Record<string, unknown>) {
  const response = await fetch("/api/admin/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok || !result.ok)
    throw new Error(result.error || "No se pudo completar la operación.");
  return result;
}
export function EnterpriseWorkspace({
  access: initialAccess,
  userId,
}: {
  access: PlatformAccess;
  userId: string;
}) {
  const [access, setAccess] = useState(initialAccess);
  const [state, setState] = useState<State | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/platform", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (live) {
          setState(data);
          setAccess(data.access);
        }
      })
      .catch((e) => {
        if (live) setNotice(e.message);
      });
    return () => {
      live = false;
    };
  }, [generation]);
  const run = async (input: Record<string, unknown>) => {
    setNotice("");
    setBusy(true);
    try {
      const result = await platformRequest(input);
      setNotice("Cambios guardados.");
      setGeneration((g) => g + 1);
      return result;
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  };
  if (!access.canWork)
    return (
      <section className={styles.form}>
        <p className={styles.notice}>
          Estado: {access.status || "sin pertenencia autorizada"}.{" "}
          {access.reviewerNote}{" "}
          {!access.enabled &&
            "El modo empresarial está desactivado; las herramientas de asesores no están habilitadas."}
        </p>
        {access.status === "pending" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run({
                action: "application",
                name: f.get("name"),
                description: f.get("description"),
                revision: access.revision,
              });
            }}
          >
            <label className={styles.field}>
              Nombre profesional
              <input name="name" required maxLength={80} />
            </label>
            <label className={styles.field}>
              Información para revisar tu incorporación
              <textarea name="description" maxLength={2000} />
            </label>
            <button className="button" disabled={busy}>
              Completar solicitud
            </button>
          </form>
        )}
        {notice && <p role="status">{notice}</p>}
      </section>
    );
  return (
    <div className={styles.form}>
      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      {!state ? (
        <p>Cargando registros autorizados…</p>
      ) : (
        <>
          <section className={styles.fieldset}>
            <h2>Propiedades</h2>
            {access.status === "active" && (
              <Link className="button" href="/admin/empresa/nueva">
                Nueva propiedad empresarial
              </Link>
            )}
            {!state.properties?.length && (
              <p>No hay propiedades empresariales en este espacio.</p>
            )}
            {state.properties?.map((p) => (
              <article className={styles.fieldset} key={`${p.id}-${p.version}`}>
                <h3>{p.title}</h3>
                <p>
                  {workflowLabels[p.workflow_state || "draft"]} · {p.reference}{" "}
                  · Versión {p.version}
                </p>
                {p.agent_id === userId && (
                  <div className={styles.emptyActions}>
                    <Link
                      className="button"
                      href={`/admin/empresa/propiedades/${p.id}`}
                    >
                      Editar borrador
                    </Link>
                    {["draft", "corrections", "hidden", "rejected"].includes(
                      p.workflow_state || "",
                    ) && (
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() =>
                          void run({
                            action: "submitProperty",
                            id: p.id,
                            version: p.version,
                          })
                        }
                      >
                        Solicitar publicación
                      </button>
                    )}
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() =>
                        void run({
                          action: "withdrawProperty",
                          id: p.id,
                          version: p.version,
                        })
                      }
                    >
                      Retirar sin borrar
                    </button>
                  </div>
                )}
                {access.canReview && (
                  <ReviewControls
                    key={p.version}
                    label="Revisar propiedad"
                    options={[
                      "corrections",
                      "approved",
                      "published",
                      "hidden",
                      "rejected",
                      "sold",
                      "rented",
                      ...(access.superadmin ? ["visibility"] : []),
                    ]}
                    disabled={busy}
                    onReview={(status, note, thonyVisible) =>
                      run({
                        action: "propertyReview",
                        id: p.id,
                        status,
                        note,
                        version: p.version,
                        thonyVisible: access.superadmin
                          ? thonyVisible
                          : !!p.thony_visible,
                      })
                    }
                    visibility={access.superadmin}
                    visible={!!p.thony_visible}
                  />
                )}
                {access.canReview && (
                  <details>
                    <summary>Datos de la ficha</summary>
                    <p>{p.description}</p>
                    <p>
                      {p.location} · {p.type} · {p.operation} · USD {p.price}
                      {p.price_provisional ? " — precio provisional" : ""}
                    </p>
                    {p.images?.map((i) => (
                      <p key={i.path}>
                        <a
                          href={`/api/platform/media/${i.path.slice(9)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {i.alt || "Revisar fotografía"}
                        </a>
                      </p>
                    ))}
                    <p>Responsable: {p.agent_id}</p>
                  </details>
                )}
                {state.approvals
                  ?.filter((a) => a.property_id === p.id)
                  .slice(0, 5)
                  .map((a, i) => (
                    <p key={i}>
                      Revisión: {workflowLabels[a.action]} · {a.note} ·{" "}
                      {a.created_at}
                    </p>
                  ))}
                {state.documents
                  ?.filter((d) => d.property_id === p.id)
                  .map((d) => (
                    <p key={d.id}>
                      <a
                        href={`/api/platform/media/${d.path.slice(9)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {d.label}
                      </a>{" "}
                      ·{" "}
                      {d.public_on_publication
                        ? "Plano público tras aprobación"
                        : "Documento privado"}
                      {p.agent_id === userId && (
                        <button
                          className="button"
                          disabled={busy}
                          onClick={() =>
                            void run({
                              action: "document",
                              id: p.id,
                              version: p.version,
                              remove: d.id,
                              public: false,
                            })
                          }
                        >
                          Retirar documento
                        </button>
                      )}
                    </p>
                  ))}
                {p.agent_id === userId && (
                  <DocumentControls property={p} busy={busy} run={run} />
                )}
              </article>
            ))}
          </section>
          {access.status === "active" && (
            <ProfileEditor
              key={
                state.profiles?.find((p) => p.user_id === userId)?.revision || 0
              }
              profile={state.profiles?.find((p) => p.user_id === userId)}
              busy={busy}
              run={run}
            />
          )}
          {access.canReview && (
            <>
              <section className={styles.fieldset}>
                <h2>Empleados y solicitudes</h2>
                <InvitationForm busy={busy} run={run} />
                {state.invitations?.map((i) => (
                  <p key={i.id}>
                    {i.email} · Vence {i.expires_at} ·{" "}
                    {i.accepted_at
                      ? "Utilizada"
                      : i.revoked_at
                        ? "Revocada"
                        : "Pendiente"}
                    {!i.accepted_at && !i.revoked_at && (
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() =>
                          void run({ action: "revokeInvitation", id: i.id })
                        }
                      >
                        Revocar invitación
                      </button>
                    )}
                  </p>
                ))}
                {!state.members?.length && (
                  <p>
                    No existen solicitudes ni empleados en esta organización.
                  </p>
                )}
                {state.members?.map((m) => (
                  <MemberReview
                    key={`${m.user_id}-${m.revision}`}
                    member={m}
                    superadmin={access.superadmin}
                    busy={busy}
                    run={run}
                  />
                ))}
              </section>
              <section className={styles.fieldset}>
                <h2>Perfiles en revisión</h2>
                {!state.profiles?.length && (
                  <p>No hay perfiles profesionales.</p>
                )}
                {state.profiles?.map((p) => (
                  <article
                    key={`${p.user_id}-${p.revision}`}
                    className={styles.fieldset}
                  >
                    <h3>{p.draft.name || p.slug}</h3>
                    <p>
                      {workflowLabels[p.status]} · {p.draft.role}
                    </p>
                    <p>{p.draft.description}</p>
                    <p>{p.draft.specialties}</p>
                    {p.draft.photo && (
                      <a
                        href={`/api/platform/media/${p.draft.photo.slice(9)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Revisar fotografía
                      </a>
                    )}
                    <p>
                      {p.draft.email} · {p.draft.phone} · {p.draft.instagram}
                    </p>
                    <ReviewControls
                      label="Revisar perfil"
                      options={[
                        "published",
                        "corrections",
                        "hidden",
                        "rejected",
                      ]}
                      disabled={busy}
                      onReview={(status, note) =>
                        run({
                          action: "profileReview",
                          userId: p.user_id,
                          status,
                          note,
                          revision: p.revision,
                        })
                      }
                    />
                  </article>
                ))}
              </section>
              {state.settings && (
                <CorporateEditor
                  key={state.settings.revision}
                  initial={state.settings.draft}
                  revision={state.settings.revision}
                  history={state.history || []}
                  busy={busy}
                  run={run}
                />
              )}
              <section className={styles.fieldset}>
                <h2>Auditoría empresarial</h2>
                {!state.audit?.length && <p>No hay eventos registrados.</p>}
                {state.audit?.map((a, i) => (
                  <details key={i}>
                    <summary>
                      {a.created_at} · {a.event}
                    </summary>
                    <p>
                      Cuenta: {a.actor_id} · Registro: {a.subject_id}
                    </p>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {JSON.stringify(a.details, null, 2)}
                    </pre>
                  </details>
                ))}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
type Run = (
  input: Record<string, unknown>,
) => Promise<{ invitationPath?: string } | null>;
function InvitationForm({ busy, run }: { busy: boolean; run: Run }) {
  const [path, setPath] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await run({ action: "invite", email: f.get("email") });
        if (r?.invitationPath) setPath(`${location.origin}${r.invitationPath}`);
      }}
    >
      <p>
        La invitación no concede un rol. La persona verifica su correo y espera
        aprobación. Su uso permanece cerrado mientras el modo o el registro
        estén desactivados.
      </p>
      <label className={styles.field}>
        Correo del empleado
        <input type="email" name="email" required />
      </label>
      <button className="button" disabled={busy}>
        Crear invitación privada
      </button>
      {path && (
        <label className={styles.field}>
          Enlace de invitación — se muestra una vez
          <input
            readOnly
            value={path}
            onFocus={(e) => e.currentTarget.select()}
          />
          <small>
            Compártelo únicamente con la persona invitada. No se envía
            automáticamente.
          </small>
        </label>
      )}
    </form>
  );
}
function MemberReview({
  member: m,
  superadmin,
  busy,
  run,
}: {
  member: Member;
  superadmin: boolean;
  busy: boolean;
  run: Run;
}) {
  const [status, setStatus] = useState("active");
  const [role, setRole] = useState(m.role);
  const [note, setNote] = useState("");
  return (
    <article className={styles.fieldset}>
      <h3>{m.application.name || "Solicitud de incorporación"}</h3>
      <p>
        {m.user_id} · {m.role} · {m.status}
      </p>
      <p>{m.application.description}</p>
      <label className={styles.field}>
        Estado de la cuenta
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Aprobar / activar</option>
          <option value="suspended">Suspender</option>
          <option value="rejected">Rechazar</option>
        </select>
      </label>
      {superadmin && (
        <label className={styles.field}>
          Permiso empresarial
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="agent">Asesor</option>
            <option value="business_admin">Administrador empresarial</option>
          </select>
        </label>
      )}
      <label className={styles.field}>
        Observaciones de incorporación
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
        />
      </label>
      <button
        className="button"
        disabled={busy}
        onClick={() =>
          void run({
            action: "member",
            userId: m.user_id,
            status,
            role,
            note,
            revision: m.revision,
          })
        }
      >
        Guardar revisión de cuenta
      </button>
    </article>
  );
}
function ReviewControls({
  label,
  options,
  onReview,
  disabled,
  visibility = false,
  visible = false,
}: {
  label: string;
  options: string[];
  onReview: (status: string, note: string, thony: boolean) => unknown;
  disabled: boolean;
  visibility?: boolean;
  visible?: boolean;
}) {
  const [status, setStatus] = useState(options[0]);
  const [note, setNote] = useState("");
  const [thony, setThony] = useState(visible);
  return (
    <div className={styles.form}>
      <label className={styles.field}>
        {label}
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {options.map((s) => (
            <option value={s} key={s}>
              {workflowLabels[s]}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        Observaciones del revisor
        <textarea
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {visibility && (
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={thony}
            onChange={(e) => setThony(e.target.checked)}
          />
          Autorizar también para el catálogo de Thony
        </label>
      )}
      <button
        className="button"
        disabled={disabled}
        onClick={() => onReview(status, note, thony)}
      >
        Guardar revisión
      </button>
    </div>
  );
}
function ProfileEditor({
  profile,
  busy,
  run,
}: {
  profile?: Profile;
  busy: boolean;
  run: Run;
}) {
  const [content, setContent] = useState(() =>
    profile ? parseAgentContent(profile.draft) : profileDefaults,
  );
  const [slug, setSlug] = useState(profile?.slug || "");
  const [uploading, setUploading] = useState(false);
  const labels: Record<keyof AgentContent, string> = {
    name: "Nombre profesional",
    photo: "Fotografía real autorizada",
    role: "Cargo por verificar",
    description: "Descripción profesional",
    phone: "Teléfono profesional",
    whatsapp: "WhatsApp profesional",
    email: "Correo profesional",
    instagram: "Instagram verificado",
    specialties: "Áreas de especialización",
  };
  return (
    <section className={styles.fieldset}>
      <h2>Mi perfil profesional</h2>
      <p>
        Estado: {workflowLabels[profile?.status || "draft"]}.{" "}
        {profile?.reviewer_note} Los cambios necesitan aprobación antes de
        hacerse públicos.
      </p>
      <label className={styles.field}>
        Dirección web del perfil
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          maxLength={80}
        />
      </label>
      {(Object.keys(labels) as (keyof AgentContent)[])
        .filter((k) => k !== "photo")
        .map((k) => (
          <label className={styles.field} key={k}>
            {labels[k]}
            {k === "description" ? (
              <textarea
                value={content[k]}
                maxLength={3000}
                onChange={(e) =>
                  setContent((c) => ({ ...c, [k]: e.target.value }))
                }
              />
            ) : (
              <input
                value={content[k]}
                maxLength={500}
                onChange={(e) =>
                  setContent((c) => ({ ...c, [k]: e.target.value }))
                }
              />
            )}
          </label>
        ))}
      <MediaUploader
        enterprise
        multiple={false}
        label={labels.photo}
        onBusyChange={setUploading}
        onUploaded={(m) => setContent((c) => ({ ...c, photo: m.path }))}
      />
      {content.photo && (
        <p>
          Fotografía seleccionada:{" "}
          <a
            href={`/api/platform/media/${content.photo.slice(9)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Revisar
          </a>
        </p>
      )}
      <div className={styles.emptyActions}>
        <button
          className="button"
          disabled={busy || uploading}
          onClick={() =>
            void run({
              action: "profile",
              slug,
              content,
              revision: profile?.revision || 0,
              submit: false,
            })
          }
        >
          Guardar perfil en borrador
        </button>
        <button
          className="button"
          disabled={busy || uploading}
          onClick={() =>
            void run({
              action: "profile",
              slug,
              content,
              revision: profile?.revision || 0,
              submit: true,
            })
          }
        >
          Solicitar aprobación del perfil
        </button>
      </div>
    </section>
  );
}
export function CorporateEditor({
  initial,
  revision,
  history,
  busy,
  run,
}: {
  initial: CorporateSettings;
  revision: number;
  history: {
    revision: number;
    content: CorporateSettings;
    published_at: string;
  }[];
  busy: boolean;
  run: Run;
}) {
  const [content, setContent] = useState(() =>
    parseCorporateSettings(initial || corporateDefaults),
  );
  const [uploading, setUploading] = useState(0);
  const labels: Partial<Record<keyof CorporateSettings, string>> = {
    navHome: "Navegación · Inicio",
    navProperties: "Navegación · Propiedades",
    navAgents: "Navegación · Asesores",
    navContact: "Navegación · Contacto",
    navEmployees: "Navegación · Acceso de empleados",
    navRegister: "Navegación · Incorporación",
    name: "Nombre empresarial autorizado",
    headline: "Título de portada empresarial",
    description: "Presentación corporativa aprobada",
    email: "Correo empresarial",
    phone: "Teléfono empresarial",
    whatsapp: "WhatsApp empresarial",
    address: "Dirección empresarial autorizada",
    seoTitle: "Título SEO empresarial",
    seoDescription: "Descripción SEO empresarial",
    background: "Fondo",
    text: "Texto",
    accent: "Acento",
  };
  return (
    <section className={styles.fieldset}>
      <h2>Identidad y contenido de Ramaldi</h2>
      <p>
        Configuración independiente del editor de Thony. Los datos desconocidos
        quedan vacíos. Publicar esta configuración no activa la identidad
        empresarial.
      </p>
      {(Object.keys(labels) as (keyof CorporateSettings)[]).map((k) => (
        <label className={styles.field} key={k}>
          {labels[k]}
          <input
            value={String(content[k])}
            maxLength={k === "description" ? 3000 : 500}
            onChange={(e) => setContent((c) => ({ ...c, [k]: e.target.value }))}
          />
        </label>
      ))}
      {(["hero", "logo"] as const).map((k) => (
        <div className={styles.field} key={k}>
          <MediaUploader
            enterprise
            multiple={false}
            label={
              k === "hero"
                ? "Portada empresarial autorizada"
                : "Logo oficial autorizado"
            }
            onBusyChange={(b) => setUploading((n) => n + (b ? 1 : -1))}
            onUploaded={(m) => setContent((c) => ({ ...c, [k]: m.path }))}
          />
          {content[k] && (
            <a
              href={`/api/platform/media/${content[k].slice(9)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Revisar imagen seleccionada
            </a>
          )}
        </div>
      ))}
      <label className={styles.field}>
        Servicios autorizados — uno por línea
        <textarea
          value={content.services.join("\n")}
          onChange={(e) =>
            setContent((c) => ({ ...c, services: e.target.value.split("\n") }))
          }
        />
      </label>
      <div className={styles.emptyActions}>
        <button
          className="button"
          disabled={busy || uploading > 0}
          onClick={() =>
            void run({ action: "settings", content, revision, publish: false })
          }
        >
          Guardar borrador empresarial
        </button>
        <button
          className="button"
          disabled={busy || uploading > 0}
          onClick={() =>
            void run({ action: "settings", content, revision, publish: true })
          }
        >
          Publicar configuración empresarial
        </button>
        <button
          className="button"
          onClick={() => {
            const a = document.createElement("a");
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(content, null, 2)], {
                type: "application/json",
              }),
            );
            a.href = url;
            a.download = "borrador-ramaldi.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Descargar mi edición
        </button>
      </div>
      <details>
        <summary>Historial empresarial</summary>
        {!history.length && <p>No hay versiones anteriores.</p>}
        {history.map((h) => (
          <p key={h.revision}>
            Versión {h.revision} · {h.published_at}{" "}
            <button
              type="button"
              onClick={() => setContent(parseCorporateSettings(h.content))}
            >
              Cargar como borrador local
            </button>
          </p>
        ))}
      </details>
    </section>
  );
}

function DocumentControls({
  property: p,
  busy,
  run,
}: {
  property: PropertyRow;
  busy: boolean;
  run: Run;
}) {
  const [path, setPath] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState("document");
  const [isPublic, setPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  return (
    <details>
      <summary>Planos y documentación</summary>
      <p>
        Los documentos son privados. Solo los planos autorizados pueden hacerse
        públicos después de revisar la ficha. Añadir o retirar documentación
        devuelve la ficha a borrador y conserva el archivo.
      </p>
      <MediaUploader
        enterprise
        pdf
        multiple={false}
        label="Subir plano o documento PDF"
        onBusyChange={setUploading}
        onUploaded={(m) => setPath(m.path)}
      />
      <label className={styles.field}>
        Nombre del documento
        <input
          maxLength={160}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        Tipo de documento
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPublic(false);
          }}
        >
          <option value="document">Documento privado</option>
          <option value="plan">Plano autorizado</option>
        </select>
      </label>
      {kind === "plan" && (
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setPublic(e.target.checked)}
          />
          Publicar este plano solo cuando la ficha sea aprobada y publicada
        </label>
      )}
      <button
        className="button"
        disabled={busy || uploading || !path || label.trim().length < 3}
        onClick={() =>
          void run({
            action: "document",
            id: p.id,
            version: p.version,
            path,
            label,
            kind,
            public: isPublic,
          })
        }
      >
        Adjuntar al borrador
      </button>
    </details>
  );
}
