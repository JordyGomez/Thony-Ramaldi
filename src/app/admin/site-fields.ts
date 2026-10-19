import type { TextKey } from "@/lib/site-settings";
export const textGroups: { title: string; fields: [TextKey, string][] }[] = [
  {
    title: "Propiedad especial",
    fields: [
      ["featuredTitle", "Título de Alberobello"],
      ["featuredEmphasis", "Énfasis del título de Alberobello"],
      ["featuredDescription", "Presentación de Alberobello"],
      ["featuredCta", "Botón para ver Alberobello"],
    ],
  },
  {
    title: "Identidad y contacto",
    fields: [
      ["name", "Nombre"],
      ["company", "Inmobiliaria"],
      ["role", "Cargo o presentación profesional"],
      ["location", "País o ubicación"],
      ["phone", "Teléfono como se muestra"],
      ["phoneInternational", "Teléfono internacional, solo dígitos"],
      ["whatsapp", "WhatsApp internacional, solo dígitos"],
      ["email", "Correo"],
      ["instagram", "Enlace de Instagram"],
      ["instagramHandle", "Usuario de Instagram"],
      ["whatsappMessage", "Mensaje inicial de WhatsApp"],
    ],
  },
  {
    title: "Menú y navegación",
    fields: [
      ["navHome", "Menú: inicio"],
      ["navProperties", "Menú: propiedades"],
      ["navAbout", "Menú: presentación"],
      ["navContact", "Menú: contacto"],
      ["menuText", "Texto al pie del menú"],
      ["menuCta", "Botón de contacto del menú"],
    ],
  },
  {
    title: "Portada",
    fields: [
      ["heroTitle", "Primera línea del título"],
      ["heroEmphasis", "Segunda línea del título"],
      ["heroSubtitle", "Subtítulo de portada"],
      ["heroDiscover", "Enlace para descubrir"],
      ["heroCta", "Botón de contacto de portada"],
      ["heroAlt", "Descripción accesible de la foto de portada"],
      ["heroNote", "Nota de la fotografía de portada"],
      ["heroSignature", "Firma de la experiencia"],
    ],
  },
  {
    title: "Presentación y catálogo",
    fields: [
      ["intro", "Texto de presentación"],
      ["introCta", "Botón de presentación"],
      ["showcaseTitle", "Título del carrusel"],
      ["showcaseCta", "Enlace del carrusel"],
      ["catalogTitle", "Título del catálogo"],
      ["catalogEmphasis", "Énfasis del título del catálogo"],
      ["catalogDescription", "Descripción del catálogo"],
      ["emptyTitle", "Catálogo vacío: título"],
      ["emptyEmphasis", "Catálogo vacío: énfasis"],
      ["emptyDescription", "Catálogo vacío: explicación"],
      ["emptyCta", "Catálogo vacío: botón"],
    ],
  },
  {
    title: "Búsqueda personal",
    fields: [
      ["journeyTitle", "Título de la experiencia personal"],
      ["journeyDescription", "Descripción de la experiencia personal"],
      ["journeyCta", "Botón para empezar la búsqueda"],
      ["journeySend", "Botón para compartir la búsqueda"],
    ],
  },
  {
    title: "Sobre Thony",
    fields: [
      ["aboutTitle", "Título de presentación profesional"],
      ["aboutDescription", "Biografía o presentación"],
      ["aboutCta", "Botón de la presentación profesional"],
      ["portraitAlt", "Descripción accesible del retrato"],
    ],
  },
  {
    title: "Contacto",
    fields: [
      ["contactTitle", "Primera parte del título de contacto"],
      ["contactEmphasis", "Énfasis del título de contacto"],
      ["contactDescription", "Texto de contacto"],
      ["contactCta", "Botón de WhatsApp"],
    ],
  },
  {
    title: "Pie de página",
    fields: [
      ["footerWordmark", "Firma grande del pie"],
      ["footerAlt", "Descripción accesible de la foto del pie"],
      ["footerNote", "Nota de la fotografía del pie"],
      ["footerDisclaimer", "Aviso al pie de la página"],
    ],
  },
  {
    title: "Buscadores y redes sociales",
    fields: [
      ["seoTitle", "Título en buscadores"],
      ["seoDescription", "Descripción en buscadores"],
      ["socialTitle", "Título al compartir"],
      ["socialDescription", "Descripción al compartir"],
    ],
  },
];
