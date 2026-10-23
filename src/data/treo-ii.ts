import "server-only";
import source from "./treo-ii-source.json";
import { unitDescription, type ProjectUnit } from "@/lib/project-units";
import {
  emptyPropertyInput,
  type PropertyInput,
} from "@/app/admin/property-input";
export const TREO_SLUG = "treo-ii-residences";
export const treoUnits: ProjectUnit[] = source.units.map((u) => ({
  unit: u.unit,
  building: u.buildingGroup,
  area: u.areaValue,
  priceMinorUnits: u.priceMinorUnits,
  bedrooms: u.bedrooms,
  bathrooms: u.bathrooms,
  parking: u.parkingSpaces,
}));
export const treoAssets = [
  [
    "hero",
    "Render exterior de TREO II: vista frontal del conjunto residencial",
  ],
  ["aerial", "Render de TREO II: vista aérea del conjunto"],
  ["entrance", "Render de TREO II: acceso al proyecto"],
  ["pool", "Render de TREO II: piscina y área social"],
  ["terrace", "Render de TREO II: terraza y áreas exteriores"],
  ["dining", "Render interior de TREO II: comedor y cocina"],
  ["kitchen", "Render interior de TREO II: cocina"],
  ["bedroom", "Render interior de TREO II: habitación"],
  ["gym", "Render de TREO II: gimnasio"],
  ["lobby", "Render de TREO II: lobby"],
  ["isometric-a", "Plano isométrico del proyecto TREO II · Tipo A"],
  ["isometric-b", "Plano isométrico del proyecto TREO II · Tipo B"],
  [
    "floorplan",
    "Plano general del proyecto TREO II · distribuciones representadas",
  ],
].map(([key, alt]) => ({ key, alt, src: `/images/treo-ii/${key}.webp` }));
export function treoPropertyInput(): PropertyInput & { price: number } {
  return {
    ...emptyPropertyInput,
    title: "TREO II Residences",
    slug: TREO_SLUG,
    reference: "TREO-II",
    projectName: "TREO II RESIDENCES",
    location: "Santiago",
    neighborhood: "",
    type: "Apartamento",
    operation: "Venta",
    price: Math.min(...treoUnits.map((u) => u.priceMinorUnits)) / 100,
    bedrooms: 3,
    bathrooms: 2,
    area: 119,
    parking: 2,
    featured: true,
    published: true,
    demo: false,
    inPreparation: false,
    imagesAreRenders: true,
    description:
      "Apartamentos en venta en TREO II Residences, Santiago. El listado suministrado presenta unidades de 119 y 122 m², con 3 habitaciones, 2 o 2.5 baños y 2 parqueos. Las imágenes muestran renders exteriores, interiores y planos del proyecto. Consulta con Thony la disponibilidad de cada unidad y las condiciones de compra.",
    amenities: [
      "3 habitaciones",
      "2 parqueos por unidad",
      "Opciones de 119 y 122 m²",
    ],
    projectFacts: [
      "El material facilitado muestra el conjunto residencial, una piscina, terraza, gimnasio y lobby.",
      "Galería de renders del proyecto: no son fotografías de una unidad terminada.",
      "Planos isométricos facilitados de los tipos A y B; su correspondencia con una unidad específica se confirma con Thony.",
    ],
    projectTypologies: treoUnits.map(unitDescription),
    confirmationNote:
      "Precios según el listado recibido el 23 de octubre de 2026. La disponibilidad, el sector exacto, la entrega y las condiciones de compra deben confirmarse con Thony. Los planos y renders representan el proyecto, no acreditan el estado actual de una unidad.",
    brochurePath: null,
    brochureLabel: "",
    sortOrder: 0,
  };
}
