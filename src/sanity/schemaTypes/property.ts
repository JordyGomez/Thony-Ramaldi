import { defineArrayMember, defineField, defineType } from "sanity";
import { propertyOperations, propertyTypes } from "@/data/property-options";

// Refleja el tipo Property de src/data/properties.ts. Los textos de ayuda están
// pensados para quien publica, no para desarrolladores.
export const propertyType = defineType({
  name: "property",
  title: "Propiedad",
  type: "document",
  groups: [
    { name: "main", title: "Principal", default: true },
    { name: "details", title: "Características" },
    { name: "media", title: "Fotos y folleto" },
    { name: "extra", title: "Proyecto y notas" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Nombre de la propiedad",
      type: "string",
      group: "main",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "slug",
      title: "Dirección web",
      description:
        "Se genera desde el nombre. Es la parte final del enlace: /propiedades/…",
      type: "slug",
      group: "main",
      options: { source: "title", maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "reference",
      title: "Referencia interna",
      description: "Código corto para identificarla, por ejemplo ALB-002.",
      type: "string",
      group: "main",
      validation: (rule) => rule.required().max(20),
    }),
    defineField({
      name: "operation",
      title: "Operación",
      type: "string",
      group: "main",
      options: { list: [...propertyOperations], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "type",
      title: "Tipo",
      type: "string",
      group: "main",
      options: { list: [...propertyTypes], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Precio en USD",
      description: "Solo el número. En alquiler, el importe mensual.",
      type: "number",
      group: "main",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "priceProvisional",
      title: "Precio provisional",
      description:
        "Marca esta casilla si el precio aún no está confirmado. La web lo indicará.",
      type: "boolean",
      group: "main",
      initialValue: false,
    }),
    defineField({
      name: "location",
      title: "Ciudad o zona",
      description: "Aparece en el filtro de ubicación. Ejemplo: Santiago.",
      type: "string",
      group: "main",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "neighborhood",
      title: "Sector o dirección de referencia",
      type: "string",
      group: "main",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Destacada",
      description: "Aparece primero en el carrusel y en la pestaña Destacadas.",
      type: "boolean",
      group: "main",
      initialValue: false,
    }),
    defineField({
      name: "demo",
      title: "Ficha de demostración",
      description:
        "Solo para ejemplos ficticios. Las propiedades reales deben dejarla desmarcada.",
      type: "boolean",
      group: "main",
      initialValue: false,
    }),
    defineField({
      name: "inPreparation",
      title: "Ficha en preparación",
      description:
        "Marca esta casilla si faltan datos por confirmar (unidad, precio, condiciones). La web lo indicará claramente.",
      type: "boolean",
      group: "main",
      initialValue: false,
      hidden: ({ parent }) => Boolean(parent?.demo),
    }),
    defineField({
      name: "order",
      title: "Orden",
      description: "Número opcional: las de número menor aparecen antes.",
      type: "number",
      group: "main",
    }),
    defineField({
      name: "description",
      title: "Descripción",
      type: "text",
      rows: 5,
      group: "details",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "bedrooms",
      title: "Habitaciones",
      description: "Déjalo vacío si está por confirmar.",
      type: "number",
      group: "details",
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: "bathrooms",
      title: "Baños",
      description: "Admite medios baños, por ejemplo 2.5.",
      type: "number",
      group: "details",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "area",
      title: "Superficie en m²",
      type: "number",
      group: "details",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "parking",
      title: "Parqueos",
      type: "number",
      group: "details",
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: "amenities",
      title: "Características destacadas",
      description: "Escribe cada una y pulsa Enter. Ejemplo: Piscina.",
      type: "array",
      group: "details",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    }),
    defineField({
      name: "images",
      title: "Fotos",
      description:
        "La primera foto es la portada. Arrastra para cambiar el orden. Cada foto necesita una descripción breve.",
      type: "array",
      group: "media",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Descripción de la foto",
              description:
                "Qué se ve, para personas con lector de pantalla. Ejemplo: Sala con vista al jardín.",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "imagesAreRenders",
      title: "Las imágenes son renders",
      description:
        "Marca esta casilla si son imágenes del proyecto (renders o folleto) y no fotos reales de la unidad.",
      type: "boolean",
      group: "media",
      initialValue: false,
    }),
    defineField({
      name: "brochure",
      title: "Folleto en PDF",
      type: "file",
      group: "media",
      options: { accept: "application/pdf" },
    }),
    defineField({
      name: "brochureLabel",
      title: "Texto del enlace al folleto",
      type: "string",
      group: "media",
      initialValue: "Ver folleto del proyecto (PDF)",
      hidden: ({ parent }) => !parent?.brochure,
    }),
    defineField({
      name: "projectName",
      title: "Nombre corto del proyecto",
      description:
        "Opcional. Se usa en avisos como «Render del proyecto · Alberobello».",
      type: "string",
      group: "extra",
    }),
    defineField({
      name: "projectFacts",
      title: "Datos del proyecto",
      type: "array",
      group: "extra",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "projectTypologies",
      title: "Tipologías del proyecto",
      type: "array",
      group: "extra",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "confirmationNote",
      title: "Nota sobre lo pendiente de confirmar",
      type: "text",
      rows: 3,
      group: "extra",
    }),
  ],
  orderings: [
    {
      title: "Orden manual",
      name: "orderAsc",
      by: [
        { field: "order", direction: "asc" },
        { field: "title", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      location: "location",
      operation: "operation",
      demo: "demo",
      inPreparation: "inPreparation",
      media: "images.0",
    },
    prepare: ({ title, location, operation, demo, inPreparation, media }) => ({
      title,
      subtitle: [
        operation,
        location,
        demo ? "Demostración" : inPreparation ? "En preparación" : null,
      ]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
