function publicUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

export const site = {
  name: "Thony Paulino",
  company: "Ramaldi",
  phone: "829-404-5770",
  phoneHref: "tel:+18294045770",
  email: "brokerthonypaulino@ramaldigroup.com",
  instagram: "https://www.instagram.com/thonypaulino_ramaldi/",
  instagramHandle: "@thonypaulino_ramaldi",
  facebook: (() => {
    const value = process.env.NEXT_PUBLIC_FACEBOOK_URL;
    try {
      const url = new URL(value || "");
      return url.protocol === "https:" &&
        ["facebook.com", "www.facebook.com"].includes(url.hostname)
        ? url.href
        : undefined;
    } catch {
      return undefined;
    }
  })(),
  url:
    publicUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    publicUrl(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined,
    ) ||
    publicUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ),
  // Referencias del logo recibidas en conversación; falta el archivo local reutilizable.
  logo: null as string | null,
  portrait: null as string | null,
};

export function whatsappUrl(property?: {
  title: string;
  reference: string;
  demo?: boolean;
  priceProvisional?: boolean;
}) {
  const message = property
    ? property.priceProvisional
      ? `Hola Thony, me interesa el apartamento en alquiler en ${property.title} (${property.reference}). Vi que la renta mostrada es provisional. ¿Podrías confirmar el precio, disponibilidad, unidad, nivel, metraje, parqueos y condiciones, y compartir fotos actuales?`
      : `Hola Thony, estoy interesado en ${property.demo ? "la ficha de demostración" : "la propiedad"} ${property.title} (${property.reference}). Me gustaría recibir más información${property.demo ? " sobre opciones reales similares" : ""}.`
    : "Hola Thony, me gustaría recibir asesoría para encontrar una propiedad para vivir o invertir.";
  return `https://wa.me/18294045770?text=${encodeURIComponent(message)}`;
}
