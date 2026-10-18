export type Property = {
  slug: string;
  reference: string;
  title: string;
  location: string;
  neighborhood: string;
  type: "Apartamento" | "Villa" | "Penthouse";
  operation: "Venta" | "Alquiler";
  price: number;
  currency: "USD";
  bedrooms: number;
  bathrooms: number;
  area: number;
  parking: number;
  images: { src: string; alt: string }[];
  description: string;
  amenities: string[];
  featured: boolean;
  demo: true;
  virtualTour?: {
    modelUrl: string;
    format: "glb" | "gltf";
    provenance: "captured" | "ai-generated";
  };
};

const image = (name: string, alt: string) => ({
  src: `/images/${name}.jpg`,
  alt,
});

export const properties: Property[] = [
  {
    slug: "residencia-patio",
    reference: "DEMO-001",
    title: "Residencia Patio",
    location: "Punta Cana",
    neighborhood: "Entorno residencial · ubicación ilustrativa",
    type: "Villa",
    operation: "Venta",
    price: 485000,
    currency: "USD",
    bedrooms: 3,
    bathrooms: 3.5,
    area: 320,
    parking: 2,
    images: [
      image("hero", "Residencia de referencia con piscina"),
      image("living", "Sala amplia de inspiración contemporánea"),
      image("kitchen", "Sala de referencia con sofá oscuro"),
    ],
    description:
      "Una propuesta de vida abierta, donde la luz y los espacios exteriores son protagonistas. Esta ficha ficticia permite explorar cómo se presentarán las propiedades: distribución, acabados y espacios para compartir. Las imágenes son ilustrativas y no corresponden a una oferta disponible.",
    amenities: [
      "Terraza privada",
      "Jardín",
      "Cocina abierta",
      "Piscina",
      "Estacionamiento",
    ],
    featured: true,
    demo: true,
  },
  {
    slug: "apartamento-brisa",
    reference: "DEMO-002",
    title: "Apartamento Brisa",
    location: "Santo Domingo",
    neighborhood: "Distrito Nacional · ubicación ilustrativa",
    type: "Apartamento",
    operation: "Venta",
    price: 245000,
    currency: "USD",
    bedrooms: 2,
    bathrooms: 2,
    area: 145,
    parking: 2,
    images: [
      image("living", "Sala luminosa con muebles en tonos naturales"),
      image("bedroom", "Dormitorio de referencia con luz natural"),
      image("kitchen", "Sala ilustrativa con muebles en tonos oscuros"),
    ],
    description:
      "Líneas limpias, tonos cálidos y espacios pensados para el día a día. Una ficha de ejemplo para imaginar un hogar en la ciudad. Sus características y precio son ficticios; consulta a Thony por opciones reales que se ajusten a tus necesidades.",
    amenities: ["Balcón", "Ascensor", "Área social", "Cocina integrada"],
    featured: true,
    demo: true,
  },
  {
    slug: "penthouse-horizonte",
    reference: "DEMO-003",
    title: "Penthouse Horizonte",
    location: "Santiago",
    neighborhood: "Zona urbana · ubicación ilustrativa",
    type: "Penthouse",
    operation: "Venta",
    price: 395000,
    currency: "USD",
    bedrooms: 3,
    bathrooms: 3,
    area: 260,
    parking: 2,
    images: [
      image("villa", "Fachada residencial de referencia con jardín"),
      image("living", "Sala de referencia"),
      image("bedroom", "Dormitorio ilustrativo"),
    ],
    description:
      "Una composición de espacios amplios y rincones para hacer una pausa. Este penthouse de demostración muestra la estructura de una futura publicación, sin representar un inmueble real ni una disponibilidad confirmada.",
    amenities: ["Terraza", "Sala familiar", "Ascensor", "Vestidor"],
    featured: true,
    demo: true,
  },
  {
    slug: "villa-serena",
    reference: "DEMO-004",
    title: "Villa Serena",
    location: "Punta Cana",
    neighborhood: "Entorno tropical · ubicación ilustrativa",
    type: "Villa",
    operation: "Alquiler",
    price: 3200,
    currency: "USD",
    bedrooms: 4,
    bathrooms: 4,
    area: 380,
    parking: 2,
    images: [
      image("pool", "Balcón de referencia con vegetación tropical"),
      image("hero", "Residencia con piscina, fotografía ilustrativa"),
      image("kitchen", "Sala de referencia con sofá oscuro"),
    ],
    description:
      "Una alternativa conceptual de alquiler mensual con espacios para disfrutar al aire libre. Precio, servicios y ubicación son ejemplos de demostración. Consulta con Thony la disponibilidad y condiciones de propiedades reales.",
    amenities: ["Piscina", "Terraza", "Jardín", "Área de lavado"],
    featured: false,
    demo: true,
  },
  {
    slug: "apartamento-luz",
    reference: "DEMO-005",
    title: "Apartamento Luz",
    location: "Santo Domingo",
    neighborhood: "Distrito Nacional · ubicación ilustrativa",
    type: "Apartamento",
    operation: "Alquiler",
    price: 1500,
    currency: "USD",
    bedrooms: 1,
    bathrooms: 1.5,
    area: 85,
    parking: 1,
    images: [
      image("bedroom", "Interior residencial ilustrativo en tonos cálidos"),
      image("living", "Sala de referencia"),
      image("kitchen", "Sala ilustrativa en tonos oscuros"),
    ],
    description:
      "Un ejemplo de espacio compacto y funcional para una vida urbana. Esta ficha es exclusivamente demostrativa: no existe una oferta de alquiler asociada a las imágenes o a los datos mostrados.",
    amenities: ["Balcón", "Cocina integrada", "Área de lavado", "Ascensor"],
    featured: false,
    demo: true,
  },
  {
    slug: "residencia-olivo",
    reference: "DEMO-006",
    title: "Residencia Olivo",
    location: "Santiago",
    neighborhood: "Entorno residencial · ubicación ilustrativa",
    type: "Villa",
    operation: "Venta",
    price: 325000,
    currency: "USD",
    bedrooms: 3,
    bathrooms: 2.5,
    area: 240,
    parking: 2,
    images: [
      image("kitchen", "Sala residencial ilustrativa con sofá oscuro"),
      image("hero", "Fachada ilustrativa"),
      image("bedroom", "Dormitorio ilustrativo"),
    ],
    description:
      "Una vivienda conceptual que reúne espacios sociales y áreas privadas en una propuesta serena. Datos, ubicación y fotografías se utilizan únicamente para demostrar el catálogo. No constituye una publicación inmobiliaria real.",
    amenities: ["Patio", "Cocina abierta", "Estudio", "Estacionamiento"],
    featured: false,
    demo: true,
  },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export type PropertyFilters = {
  type: string;
  operation: string;
  location: string;
  price: string;
  bedrooms: string;
};
export const emptyFilters: PropertyFilters = {
  type: "",
  operation: "",
  location: "",
  price: "",
  bedrooms: "",
};

export function filterProperties(filters: PropertyFilters) {
  return properties.filter(
    (p) =>
      (!filters.type || p.type === filters.type) &&
      (!filters.operation || p.operation === filters.operation) &&
      (!filters.location || p.location === filters.location) &&
      (!filters.price || p.price <= Number(filters.price)) &&
      (!filters.bedrooms || p.bedrooms >= Number(filters.bedrooms)),
  );
}
