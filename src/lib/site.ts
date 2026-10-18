import { defaultTexts } from "./site-settings";
import thonyPortrait from "../../public/images/thony-paulino.jpg";

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
  name: defaultTexts.name,
  company: defaultTexts.company,
  phone: defaultTexts.phone,
  phoneHref: `tel:+${defaultTexts.phoneInternational}`,
  email: defaultTexts.email,
  instagram: defaultTexts.instagram,
  instagramHandle: defaultTexts.instagramHandle,
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
  // Retrato entregado por el propietario el 2026-10-18.
  portrait: thonyPortrait,
};

export function whatsappUrl(
  property?: {
    title: string;
    reference: string;
    demo?: boolean;
    priceProvisional?: boolean;
    type?: string;
    operation?: string;
  },
  contact = {
    number: defaultTexts.whatsapp,
    message: defaultTexts.whatsappMessage,
    name: defaultTexts.name,
  },
) {
  const rentalApartment =
    property?.operation === "Alquiler" && property.type === "Apartamento";
  const message = property
    ? property.priceProvisional
      ? rentalApartment
        ? `Hola Thony, me interesa el apartamento en alquiler en ${property.title} (${property.reference}). Vi que la renta mostrada es provisional. ¿Podrías confirmar el precio, disponibilidad, unidad, nivel, metraje, parqueos y condiciones, y compartir fotos actuales?`
        : `Hola Thony, me interesa la propiedad ${property.title} (${property.reference}). Vi que el precio mostrado es provisional. ¿Podrías confirmar el precio, disponibilidad y condiciones, y compartir fotos actuales?`
      : `Hola Thony, estoy interesado en ${property.demo ? "la ficha de demostración" : "la propiedad"} ${property.title} (${property.reference}). Me gustaría recibir más información${property.demo ? " sobre opciones reales similares" : ""}.`
    : contact.message;
  return `https://wa.me/${contact.number}?text=${encodeURIComponent(property ? message.replace(/^Hola Thony,/, `Hola ${contact.name.split(" ")[0]},`) : message)}`;
}
