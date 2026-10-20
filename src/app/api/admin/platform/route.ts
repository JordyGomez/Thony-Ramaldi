import { randomBytes, createHash } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  AdminError,
  adminFailure,
  adminJson,
  checkOrigin,
} from "@/lib/admin-access";
import { requirePlatform } from "@/lib/platform-access";
import { parseCorporateSettings, parseAgentContent } from "@/lib/platform";
import { readCorporateEditor } from "@/lib/platform-editor";

export async function GET(request: Request) {
  try {
    const { supabase, user, access } = await requirePlatform("session");
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind === "editor") {
      if (!access.canReview)
        throw new AdminError("Permiso empresarial requerido.", 403);
      return adminJson({ ok: true, ...(await readCorporateEditor(supabase)) });
    }
    if (kind === "impact") {
      if (!access.superadmin)
        throw new AdminError(
          "Solo SUPERADMIN puede revisar el cambio de identidad.",
          403,
        );
      const target = new URL(request.url).searchParams.get("target");
      if (!["thony", "ramaldi"].includes(target || ""))
        throw new AdminError("Selecciona una modalidad.");
      const { data, error } = await supabase.rpc("platform_mode_impact", {
        p_target: target,
      });
      if (error)
        throw new AdminError(
          "No se pudo comprobar el impacto del cambio.",
          503,
        );
      return adminJson({ ok: true, ...data });
    }
    const result: Record<string, unknown> = { ok: true, access };
    if (access.canWork) {
      let properties = supabase
        .from("properties")
        .select("*")
        .eq("organization_id", access.organizationId)
        .order("updated_at", { ascending: false });
      if (!access.canReview) properties = properties.eq("agent_id", user.id);
      const rows = await properties;
      if (rows.error)
        throw new AdminError(
          "No se pudo cargar el inventario autorizado.",
          503,
        );
      result.properties = rows.data;
      if (rows.data?.length) {
        const ids = rows.data.map((p) => p.id);
        const [approvals, documents] = await Promise.all([
          supabase
            .from("publication_approvals")
            .select("property_id,action,note,created_at,property_version")
            .in("property_id", ids)
            .order("id", { ascending: false })
            .limit(200),
          supabase
            .from("property_documents")
            .select("id,property_id,path,label,kind,public_on_publication")
            .eq("organization_id", access.organizationId)
            .in("property_id", ids)
            .is("removed_at", null),
        ]);
        if (approvals.error || documents.error)
          throw new AdminError(
            "No se pudieron cargar las observaciones y documentos.",
            503,
          );
        result.approvals = approvals.data;
        result.documents = documents.data;
      }
      let profiles = supabase
        .from("agent_profiles")
        .select("*")
        .eq("organization_id", access.organizationId);
      if (!access.canReview) profiles = profiles.eq("user_id", user.id);
      const profile = await profiles;
      if (profile.error)
        throw new AdminError("No se pudieron cargar los perfiles.", 503);
      result.profiles = profile.data;
    }
    if (access.canReview) {
      const [members, settings, history, audit] = await Promise.all([
        supabase
          .from("organization_members")
          .select("user_id,role,status,application,reviewer_note,revision")
          .eq("organization_id", access.organizationId),
        supabase
          .from("site_mode_settings")
          .select("draft,published_content,revision,published_revision")
          .eq("mode", "ramaldi")
          .single(),
        supabase
          .from("site_mode_revisions")
          .select("revision,content,published_at")
          .eq("mode", "ramaldi")
          .order("revision", { ascending: false })
          .limit(10),
        supabase
          .from("platform_audit")
          .select("event,actor_id,subject_id,details,created_at")
          .eq("organization_id", access.organizationId)
          .order("id", { ascending: false })
          .limit(50),
      ]);
      if ([members, settings, history, audit].some((r) => r.error))
        throw new AdminError(
          "No se pudo cargar la administración empresarial.",
          503,
        );
      Object.assign(result, {
        members: members.data,
        settings: settings.data,
        history: history.data,
        audit: audit.data,
      });
      const invitations = await supabase
        .from("membership_invitations")
        .select("id,email,expires_at,accepted_at,revoked_at,created_at")
        .eq("organization_id", access.organizationId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (invitations.error)
        throw new AdminError("No se pudieron cargar las invitaciones.", 503);
      result.invitations = invitations.data;
    }
    if (access.superadmin) {
      const modeAudit = await supabase
        .from("mode_change_audit")
        .select(
          "previous_mode,new_mode,revision,actor_id,created_at,property_count",
        )
        .order("id", { ascending: false })
        .limit(20);
      if (modeAudit.error)
        throw new AdminError(
          "No se pudo cargar el historial de modalidades.",
          503,
        );
      result.modeAudit = modeAudit.data;
    }
    return adminJson(result);
  } catch (error) {
    return adminFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (Number(request.headers.get("content-length")) > 40000)
      throw new AdminError("Contenido demasiado grande.", 413);
    const body = await request.text();
    if (Buffer.byteLength(body) > 40000)
      throw new AdminError("Contenido demasiado grande.", 413);
    const input = JSON.parse(body);
    const { supabase, access } = await requirePlatform("session");
    const version = (value: unknown) => {
      if (!Number.isSafeInteger(value) || Number(value) < 0)
        throw new AdminError("Recarga la versión guardada antes de continuar.");
      return value;
    };
    const text = (value: unknown, max = 2000) => {
      if (typeof value !== "string" || value.length > max)
        throw new AdminError("Revisa los campos enviados.");
      return value.trim();
    };
    const validated = <T>(parse: () => T): T => {
      try {
        return parse();
      } catch (error) {
        throw new AdminError(
          error instanceof Error
            ? error.message
            : "Revisa los datos de la configuración.",
        );
      }
    };
    let rpc: string;
    let args: Record<string, unknown>;
    let invitationToken: string | undefined;
    switch (input.action) {
      case "mode":
        if (!access.superadmin)
          throw new AdminError(
            "Solo SUPERADMIN puede cambiar la identidad.",
            403,
          );
        rpc = "change_site_mode";
        args = {
          p_target: text(input.target, 10),
          p_revision: version(input.revision),
          p_confirmation: text(input.confirmation, 30),
        };
        break;
      case "authorization":
        if (!access.superadmin)
          throw new AdminError(
            "Solo SUPERADMIN registra la autorización empresarial.",
            403,
          );
        if (input.confirm !== true || typeof input.registration !== "boolean")
          throw new AdminError(
            "Confirma la autorización y las condiciones de incorporación.",
          );
        rpc = "set_corporate_authorization";
        args = {
          p_reference: text(input.reference, 500),
          p_confirm: true,
          p_registration: input.registration,
        };
        break;
      case "settings":
        if (!access.canReview)
          throw new AdminError("Permiso empresarial requerido.", 403);
        if (typeof input.publish !== "boolean")
          throw new AdminError(
            "Indica si guardas borrador o publicas la configuración.",
          );
        rpc = "save_enterprise_settings";
        args = {
          p_content: validated(() => parseCorporateSettings(input.content)),
          p_revision: version(input.revision),
          p_publish: input.publish,
        };
        break;
      case "invite":
        if (!access.canReview)
          throw new AdminError("Permiso empresarial requerido.", 403);
        invitationToken = randomBytes(32).toString("hex");
        rpc = "create_membership_invitation";
        args = {
          p_email: text(input.email, 254),
          p_token_hash: createHash("sha256")
            .update(invitationToken)
            .digest("hex"),
        };
        break;
      case "member":
        if (!access.canReview)
          throw new AdminError("Permiso empresarial requerido.", 403);
        rpc = "review_organization_member";
        args = {
          p_user: text(input.userId, 36),
          p_status: text(input.status, 20),
          p_role: text(input.role, 20),
          p_note: text(input.note),
          p_revision: version(input.revision),
        };
        break;
      case "revokeInvitation":
        if (!access.canReview)
          throw new AdminError("Permiso empresarial requerido.", 403);
        rpc = "revoke_membership_invitation";
        args = { p_id: text(input.id, 36) };
        break;
      case "document":
        if (!access.canWork)
          throw new AdminError("Permiso empresarial requerido.", 403);
        if (typeof input.public !== "boolean")
          throw new AdminError("Revisa la visibilidad del documento.");
        rpc = "set_property_document";
        args = {
          p_property: text(input.id, 36),
          p_version: version(input.version),
          p_path: text(input.path || "", 500),
          p_label: text(input.label || "", 160),
          p_kind: text(input.kind || "document", 20),
          p_public: input.public,
          p_remove: input.remove ? text(input.remove, 36) : null,
        };
        break;
      case "application":
        rpc = "update_membership_application";
        args = {
          p_application: {
            name: text(input.name, 80),
            description: text(input.description, 2000),
          },
          p_revision: version(input.revision),
        };
        break;
      case "profile":
        if (!access.canWork)
          throw new AdminError("Tu cuenta no puede editar perfiles.", 403);
        if (typeof input.submit !== "boolean")
          throw new AdminError("Indica el estado del perfil.");
        rpc = "save_agent_profile";
        args = {
          p_slug: text(input.slug, 80),
          p_content: validated(() => parseAgentContent(input.content)),
          p_revision: version(input.revision),
          p_submit: input.submit,
        };
        break;
      case "profileReview":
        if (!access.canReview)
          throw new AdminError("Permiso empresarial requerido.", 403);
        rpc = "review_agent_profile";
        args = {
          p_user: text(input.userId, 36),
          p_action: text(input.status, 20),
          p_note: text(input.note),
          p_revision: version(input.revision),
        };
        break;
      case "propertyReview":
        if (!access.canReview)
          throw new AdminError("Permiso empresarial requerido.", 403);
        if (typeof input.thonyVisible !== "boolean")
          throw new AdminError("Revisa la visibilidad de la propiedad.");
        rpc = "review_enterprise_property";
        args = {
          p_id: text(input.id, 36),
          p_action: text(input.status, 20),
          p_note: text(input.note),
          p_version: version(input.version),
          p_thony_visible: input.thonyVisible,
        };
        break;
      case "submitProperty":
      case "withdrawProperty":
        if (!access.canWork)
          throw new AdminError(
            "Tu cuenta no puede gestionar propiedades.",
            403,
          );
        rpc =
          input.action === "submitProperty"
            ? "submit_enterprise_property"
            : "withdraw_enterprise_property";
        args = { p_id: text(input.id, 36), p_version: version(input.version) };
        break;
      default:
        throw new AdminError("Operación no válida.");
    }
    const { data, error } = await supabase.rpc(rpc, args);
    if (error)
      throw new AdminError(
        error.code === "40001"
          ? "Otra sesión cambió este registro. Conserva tu edición y recarga para comparar."
          : error.code === "42501"
            ? "La operación no está autorizada. Comprueba el modo, los permisos y las aprobaciones."
            : error.code === "22023"
              ? error.message
              : "No se completó la operación. Revisa el estado y los datos.",
        error.code === "40001" ? 409 : error.code === "42501" ? 403 : 400,
      );
    revalidateTag("properties", { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
    revalidatePath("/opengraph-image");
    return adminJson({
      ok: true,
      result: data,
      ...(invitationToken
        ? { invitationPath: `/admin/registro#invitacion=${invitationToken}` }
        : {}),
    });
  } catch (error) {
    return adminFailure(
      error instanceof SyntaxError
        ? new AdminError("Solicitud no válida.")
        : error,
    );
  }
}
