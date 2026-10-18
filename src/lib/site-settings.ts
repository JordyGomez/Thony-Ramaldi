import heroPhoto from "../../public/images/portada.jpg";
import footerPhoto from "../../public/images/villa.jpg";
import portraitPhoto from "../../public/images/thony-paulino.jpg";
import { supabaseUrl } from "./supabase/env";

export const defaultTexts = {
  name: "Thony Paulino",
  company: "Ramaldi",
  role: "Asesor inmobiliario · Ramaldi",
  location: "República Dominicana",
  phone: "829-404-5770",
  phoneInternational: "18294045770",
  whatsapp: "18294045770",
  email: "brokerthonypaulino@ramaldigroup.com",
  instagram: "https://www.instagram.com/thonypaulino_ramaldi/",
  instagramHandle: "@thonypaulino_ramaldi",
  whatsappMessage:
    "Hola Thony, me gustaría recibir asesoría para encontrar una propiedad para vivir o invertir.",
  navHome: "Inicio",
  navProperties: "Propiedades",
  navAbout: "Sobre Thony",
  navContact: "Contacto",
  menuText: "Tu próximo espacio empieza con una conversación.",
  menuCta: "Contactar a Thony",
  heroTitle: "Tu próximo espacio.",
  heroEmphasis: "Tu próxima historia.",
  heroSubtitle: "Asesoría inmobiliaria · República Dominicana",
  heroDiscover: "Descubrir",
  heroCta: "Hablar con Thony",
  heroAlt:
    "Casa moderna blanca entre palmeras al anochecer, fotografía ilustrativa",
  heroNote: "Fotografía ilustrativa",
  intro:
    "Hay un lugar para lo que viene. Encuéntralo con el acompañamiento de Thony Paulino, asesor inmobiliario de Ramaldi en República Dominicana, ya sea para vivir o para invertir. Un espacio para cada nueva etapa, elegido con calma y con alguien a tu lado.",
  introCta: "Conocer a Thony",
  showcaseTitle: "Selección",
  showcaseCta: "Ver catálogo",
  featuredTitle: "Alberobello.",
  featuredEmphasis: "Tu próximo espacio en Santiago.",
  featuredDescription:
    "Conoce el proyecto del apartamento que Thony está ofreciendo en alquiler. Explora sus espacios y consulta los detalles de la unidad.",
  featuredCta: "Ver apartamento",
  heroSignature: "UNA PERSPECTIVA PERSONAL",
  catalogTitle: "Encuentra tu",
  catalogEmphasis: "próximo lugar",
  catalogDescription:
    "Cada búsqueda es personal. Explora, imagina y conversemos sobre lo que estás buscando.",
  emptyTitle: "Pronto publicaremos",
  emptyEmphasis: "nuevas propiedades.",
  emptyDescription:
    "Mientras tanto, cuéntale a Thony qué buscas y te ayudará a encontrar opciones para vivir o invertir.",
  emptyCta: "Escribir a Thony",
  aboutTitle: "Thony Paulino",
  aboutDescription:
    "Elegir dónde vivir o invertir es una decisión personal. Mi propósito es acompañarte en esa búsqueda, entender lo que necesitas y ayudarte a explorar tus opciones con claridad.",
  aboutCta: "Conversemos sobre tu próximo hogar",
  portraitAlt: "Thony Paulino, asesor inmobiliario de Ramaldi",
  contactTitle: "Todo comienza con una buena",
  contactEmphasis: "conversación",
  contactDescription:
    "Cuéntame qué tienes en mente. Demos juntos el próximo paso.",
  contactCta: "Escríbeme por WhatsApp",
  footerWordmark: "THONY PAULINO",
  footerAlt: "Fotografía de una propiedad de Thony Paulino",
  footerNote: "",
  footerDisclaimer:
    "Precios, disponibilidad y condiciones sujetos a confirmación con Thony.",
  entryCaption: "TU PRÓXIMO ESPACIO. TU PRÓXIMA HISTORIA.",
  journeyTitle: "Un espacio que empiece contigo.",
  journeyDescription:
    "Tu próxima historia merece una búsqueda personal. Define lo que imaginas y compártelo directamente con Thony.",
  journeyCta: "Diseñar mi búsqueda",
  journeySend: "Compartir mi búsqueda con Thony",
  seoTitle: "Thony Paulino · Ramaldi | Tu próximo espacio",
  seoDescription:
    "Asesoría inmobiliaria con Thony Paulino, Ramaldi en República Dominicana. Propiedades para vivir o invertir, en venta y alquiler.",
  socialTitle: "Tu próximo espacio. Tu próxima historia.",
  socialDescription:
    "Asesoría inmobiliaria con Thony Paulino. Explora sus propiedades y conversemos sobre tu próximo hogar.",
};
export type TextKey = keyof typeof defaultTexts;
export const sectionNames = {
  intro: "Presentación",
  featured: "Alberobello",
  showcase: "Carrusel de propiedades",
  catalog: "Catálogo",
  journey: "Búsqueda personal",
  about: "Sobre Thony",
  contact: "Contacto",
};
export type SectionId = keyof typeof sectionNames;
export type SiteSettings = {
  texts: Record<TextKey, string>;
  assets: {
    hero: string;
    footer: string;
    portrait: string;
    logo: string;
    social: string;
  };
  theme: { background: string; text: string; accent: string };
  experience: {
    motion: "expressive" | "subtle" | "off";
    entry: boolean;
    floatingContact: boolean;
    footer: boolean;
    indexable: boolean;
  };
  sections: { id: SectionId; visible: boolean }[];
  steps: { title: string; detail: string }[];
};
export const defaultSettings: SiteSettings = {
  texts: defaultTexts,
  assets: {
    hero: "/images/portada.jpg",
    footer: "",
    portrait: "/images/thony-paulino.jpg",
    logo: "",
    social: "",
  },
  theme: { background: "#2B2B2B", text: "#FFFFFF", accent: "#F5E8B3" },
  experience: {
    motion: "expressive",
    entry: true,
    floatingContact: true,
    footer: true,
    indexable: true,
  },
  sections: (Object.keys(sectionNames) as SectionId[]).map((id) => ({
    id,
    visible: true,
  })),
  steps: [
    { title: "Escuchar", detail: "Entender lo que buscas." },
    { title: "Explorar", detail: "Revisar opciones con claridad." },
    { title: "Acompañar", detail: "Estar presente en tu decisión." },
  ],
};

const localImages = {
  "/images/portada.jpg": heroPhoto,
  "/images/villa.jpg": footerPhoto,
  "/images/thony-paulino.jpg": portraitPhoto,
};
export function siteImage(path: string) {
  return localImages[path as keyof typeof localImages] || path;
}
export function navigation(settings: SiteSettings) {
  const { texts: t, sections } = settings;
  const visible = (id: SectionId) =>
    sections.some((section) => section.id === id && section.visible);
  return [
    { href: "/", title: t.navHome },
    ...(visible("catalog")
      ? [{ href: "/#propiedades", title: t.navProperties }]
      : []),
    ...(visible("about") ? [{ href: "/#sobre-thony", title: t.navAbout }] : []),
    ...(visible("contact")
      ? [{ href: "/#contacto", title: t.navContact }]
      : []),
  ];
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("La configuración debe ser un objeto.");
  return value as Record<string, unknown>;
}
const luminance = (color: string) => {
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
    .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contrast = (a: string, b: string) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) /
  (Math.min(luminance(a), luminance(b)) + 0.05);

/** Lista cerrada de campos. Nunca se publican HTML, scripts, CSS o enlaces arbitrarios. */
export function parseSiteSettings(value: unknown): SiteSettings {
  const input = record(value);
  const texts = { ...defaultTexts };
  const rawTexts = input.texts === undefined ? {} : record(input.texts);
  for (const key of Object.keys(defaultTexts) as TextKey[]) {
    if (rawTexts[key] === undefined) continue;
    if (
      typeof rawTexts[key] !== "string" ||
      rawTexts[key].length >
        (key === "intro" || key === "aboutDescription" ? 4000 : 600)
    )
      throw new Error(`Revisa el campo «${key}»: el texto es demasiado largo.`);
    texts[key] = (rawTexts[key] as string).trim();
  }
  for (const key of [
    "name",
    "company",
    "heroTitle",
    "heroEmphasis",
    "heroAlt",
    "portraitAlt",
    "seoTitle",
    "seoDescription",
    "navHome",
  ] as TextKey[]) {
    if (!texts[key])
      throw new Error(
        "Completa nombre, marca, títulos, descripciones de imágenes y SEO.",
      );
  }
  if (
    texts.name.length > 60 ||
    texts.footerWordmark.length > 30 ||
    texts.heroTitle.length > 90 ||
    texts.heroEmphasis.length > 90
  )
    throw new Error(
      "Acorta el nombre, la firma o los títulos de portada para que se vean bien en móvil.",
    );
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texts.email))
    throw new Error("Escribe un correo válido.");
  if (
    ![texts.whatsapp, texts.phoneInternational].every((phone) =>
      /^\d{10,15}$/.test(phone),
    )
  )
    throw new Error(
      "Los números internacionales llevan de 10 a 15 dígitos, incluyendo el país, sin + ni espacios.",
    );
  try {
    const instagram = new URL(texts.instagram);
    if (
      instagram.protocol !== "https:" ||
      !["instagram.com", "www.instagram.com"].includes(instagram.hostname) ||
      instagram.username ||
      instagram.password
    )
      throw new Error();
  } catch {
    throw new Error("Instagram debe ser un enlace HTTPS de instagram.com.");
  }
  const assets = { ...defaultSettings.assets };
  const rawAssets = input.assets === undefined ? {} : record(input.assets);
  for (const key of Object.keys(assets) as (keyof typeof assets)[]) {
    if (rawAssets[key] === undefined) continue;
    if (typeof rawAssets[key] !== "string" || rawAssets[key].length > 1000)
      throw new Error("Revisa las imágenes seleccionadas.");
    const path = rawAssets[key] as string;
    const storagePrefix = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/properties/media/`;
    const storedImage =
      path.startsWith(storagePrefix) &&
      /^[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/.test(
        path.slice(storagePrefix.length),
      );
    if (
      path &&
      !/^\/images\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp|avif)$/.test(path) &&
      !storedImage
    )
      throw new Error("Selecciona una imagen de la biblioteca de este sitio.");
    assets[key] = path;
  }
  if (!assets.hero || !assets.portrait)
    throw new Error("Elige las imágenes de portada y retrato.");
  const theme = {
    ...defaultSettings.theme,
    ...(input.theme === undefined ? {} : record(input.theme)),
  };
  if (
    !Object.values(theme).every(
      (color) => typeof color === "string" && /^#[a-fA-F0-9]{6}$/.test(color),
    )
  )
    throw new Error("Los colores deben tener formato #RRGGBB.");
  if (
    luminance(theme.background) > 0.15 ||
    contrast(theme.background, theme.text) < 7 ||
    contrast(theme.background, theme.accent) < 4.5
  )
    throw new Error(
      "Elige un fondo oscuro y texto y acentos claros para mantener la lectura y el contraste.",
    );
  const experience = {
    ...defaultSettings.experience,
    ...(input.experience === undefined ? {} : record(input.experience)),
  };
  if (
    !["expressive", "subtle", "off"].includes(experience.motion) ||
    !["entry", "floatingContact", "footer", "indexable"].every(
      (key) => typeof experience[key as keyof typeof experience] === "boolean",
    )
  )
    throw new Error("Revisa las opciones de la experiencia.");
  const sections = input.sections ?? defaultSettings.sections;
  if (
    !Array.isArray(sections) ||
    sections.length !== Object.keys(sectionNames).length ||
    new Set(sections.map((section) => record(section).id)).size !==
      Object.keys(sectionNames).length ||
    sections.some(
      (section) =>
        !Object.hasOwn(sectionNames, String(record(section).id)) ||
        typeof record(section).visible !== "boolean",
    )
  )
    throw new Error("El orden de las secciones no es válido.");
  const steps = input.steps ?? defaultSettings.steps;
  if (
    !Array.isArray(steps) ||
    steps.length < 1 ||
    steps.length > 6 ||
    steps.some(
      (step) =>
        typeof record(step).title !== "string" ||
        typeof record(step).detail !== "string" ||
        !(record(step).title as string).trim() ||
        (record(step).title as string).length > 80 ||
        (record(step).detail as string).length > 300,
    )
  )
    throw new Error(
      "Añade entre uno y seis pasos, con título y descripción breves.",
    );
  return {
    texts,
    assets,
    theme: {
      background: theme.background,
      text: theme.text,
      accent: theme.accent,
    },
    experience: {
      motion: experience.motion,
      entry: experience.entry,
      floatingContact: experience.floatingContact,
      footer: experience.footer,
      indexable: experience.indexable,
    },
    sections: sections.map((section) => ({
      id: section.id as SectionId,
      visible: section.visible as boolean,
    })),
    steps: steps.map((step) => ({
      title: step.title.trim(),
      detail: step.detail.trim(),
    })),
  };
}
