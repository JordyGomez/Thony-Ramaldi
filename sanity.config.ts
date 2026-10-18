"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { propertyType } from "@/sanity/schemaTypes/property";
import { sanityDataset, sanityProjectId } from "@/sanity/env";

// Panel embebido en /admin. Sin Project ID la ruta no monta el Studio.
export default defineConfig({
  name: "thony-ramaldi",
  title: "Thony Paulino · Propiedades",
  basePath: "/admin",
  projectId: sanityProjectId || "pendiente",
  dataset: sanityDataset,
  schema: { types: [propertyType] },
  plugins: [
    structureTool({
      title: "Propiedades",
      structure: (S) =>
        S.list()
          .title("Contenido")
          .items([
            S.listItem()
              .title("Propiedades")
              .child(
                S.documentTypeList("property")
                  .title("Propiedades")
                  .defaultOrdering([
                    { field: "order", direction: "asc" },
                    { field: "title", direction: "asc" },
                  ]),
              ),
          ]),
    }),
  ],
  document: {
    // Solo existe un tipo: el botón "Crear" va directo a Propiedad.
    newDocumentOptions: (prev) =>
      prev.filter((item) => item.templateId === "property"),
  },
});
