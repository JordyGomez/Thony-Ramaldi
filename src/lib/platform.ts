export type SiteMode = "thony" | "ramaldi";
export type PlatformAccess = {
  installed: boolean;
  superadmin: boolean;
  legacyAdmin: boolean;
  organizationId: string | null;
  role: "agent" | "business_admin" | null;
  status: "pending" | "active" | "suspended" | "rejected" | null;
  revision: number;
  reviewerNote: string;
  verified: boolean;
  enabled: boolean;
  canReview: boolean;
  canWork: boolean;
};
export const corporateDefaults = {
  navHome: "Inicio",
  navProperties: "Propiedades",
  navAgents: "Nuestros asesores",
  navContact: "Contacto",
  navEmployees: "Acceso de empleados",
  navRegister: "Incorporación con invitación",
  name: "Ramaldi Inmobiliaria",
  headline: "",
  description: "",
  hero: "",
  logo: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  seoTitle: "",
  seoDescription: "",
  services: [] as string[],
  background: "#2B2B2B",
  text: "#FFFFFF",
  accent: "#F5E8B3",
};
export type CorporateSettings = typeof corporateDefaults;
export const profileDefaults = {
  name: "",
  photo: "",
  role: "",
  description: "",
  phone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  specialties: "",
};
export type AgentContent = typeof profileDefaults;
export type PublicAgent = {
  userId: string;
  slug: string;
  content: AgentContent;
};
export const workflowLabels: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente de revisión",
  corrections: "Correcciones solicitadas",
  approved: "Aprobado",
  published: "Publicado",
  hidden: "Oculto",
  rejected: "Rechazado",
  sold: "Vendido",
  rented: "Alquilado",
  visibility: "Visibilidad en modo personal",
};
export function platformMissing(code?: string) {
  return ["PGRST202", "PGRST205", "42P01", "42883"].includes(code || "");
}
export function parseCorporateSettings(value: unknown): CorporateSettings {
  const result = parseFields(value, corporateDefaults);
  for (const key of [
    "navHome",
    "navProperties",
    "navAgents",
    "navContact",
    "navEmployees",
    "navRegister",
  ] as const)
    if (!result[key] || result[key].length > 60)
      throw new Error(
        "Completa los nombres de navegación, con un máximo de 60 caracteres.",
      );
  for (const key of ["background", "text", "accent"] as const)
    if (!/^#[a-f\d]{6}$/i.test(result[key]))
      throw new Error("Usa colores #RRGGBB.");
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  };
  const contrast = (a: string, b: string) =>
    (Math.max(luminance(a), luminance(b)) + 0.05) /
    (Math.min(luminance(a), luminance(b)) + 0.05);
  if (
    luminance(result.background) > 0.15 ||
    contrast(result.background, result.text) < 7 ||
    contrast(result.background, result.accent) < 4.5
  )
    throw new Error("Conserva un fondo oscuro con texto y acentos legibles.");
  validateContacts(result);
  for (const key of ["hero", "logo"] as const) validateFile(result[key]);
  return result;
}
export function parseAgentContent(value: unknown): AgentContent {
  const result = parseFields(value, profileDefaults);
  validateContacts(result);
  validateFile(result.photo);
  if (
    result.instagram &&
    !/^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(
      result.instagram,
    )
  )
    throw new Error("Usa el enlace verificado de Instagram.");
  return result;
}
function parseFields<T extends Record<string, string | string[]>>(
  value: unknown,
  defaults: T,
): T {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Contenido no válido.");
  const record = value as Record<string, unknown>;
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const field = record[String(key)] ?? defaults[key];
    if (Array.isArray(defaults[key])) {
      if (
        !Array.isArray(field) ||
        field.length > 12 ||
        field.some((v) => typeof v !== "string" || v.length > 200)
      )
        throw new Error("Revisa los servicios.");
      result[key] = field
        .map((v) => String(v).trim())
        .filter(Boolean) as T[keyof T];
    } else {
      if (
        typeof field !== "string" ||
        field.length > (key === "description" ? 3000 : 500)
      )
        throw new Error(`Revisa ${String(key)}.`);
      result[key] = field.trim() as T[keyof T];
    }
  }
  return result;
}
function validateContacts(value: {
  email: string;
  phone: string;
  whatsapp: string;
}) {
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))
    throw new Error("Revisa el correo profesional.");
  if ([value.phone, value.whatsapp].some((v) => v && !/^\d{10,15}$/.test(v)))
    throw new Error("Los teléfonos deben incluir país y de 10 a 15 dígitos.");
}
function validateFile(value: string) {
  if (
    value &&
    !/^platform\/[a-f\d-]{36}\/[a-f\d-]{36}\/[a-f\d-]{36}\.(jpg|jpeg|png|webp)$/.test(
      value,
    )
  )
    throw new Error("Selecciona una imagen del almacén empresarial privado.");
}
