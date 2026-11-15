import type { Property } from "@/data/properties";
import { listingStatus } from "@/data/properties";
import type { SiteSettings } from "./site-settings";

/**
 * Datos estructurados (schema.org). Solo describen información real ya visible
 * en la página: nunca reseñas, valoraciones ni precios provisionales.
 */
export function agentJsonLd(settings: SiteSettings, url: string) {
  const t = settings.texts;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${url}/#asesor`,
    name: `${t.name} · ${t.company}`,
    url,
    description: t.seoDescription,
    telephone: `+${t.phoneInternational}`,
    email: t.email,
    areaServed: { "@type": "Country", name: "República Dominicana" },
    sameAs: [t.instagram],
  };
}

/** Solo fichas reales y disponibles; las demostraciones no se describen. */
export function listingJsonLd(property: Property, url: string) {
  if (listingStatus(property) !== "available") return null;
  const images = property.images
    .map((image) => image.src)
    .filter((src): src is string => typeof src === "string" && /^https:/.test(src));
  const pageUrl = `${url}/propiedades/${property.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": pageUrl,
    url: pageUrl,
    name: property.title,
    description: property.description.slice(0, 500),
    ...(images.length ? { image: images.slice(0, 6) } : {}),
    about: {
      "@type": property.type === "Apartamento" ? "Apartment" : "Residence",
      name: property.title,
      address: {
        "@type": "PostalAddress",
        addressLocality: property.location,
        addressCountry: "DO",
      },
      ...(property.bedrooms != null ? { numberOfBedrooms: property.bedrooms } : {}),
      ...(property.bathrooms != null
        ? { numberOfBathroomsTotal: property.bathrooms }
        : {}),
      ...(property.area != null
        ? {
            floorSize: {
              "@type": "QuantitativeValue",
              value: property.area,
              unitCode: "MTK",
            },
          }
        : {}),
    },
    ...(property.priceProvisional || !(property.price > 0)
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: property.price,
            priceCurrency: property.currency,
            businessFunction:
              property.operation === "Alquiler"
                ? "http://purl.org/goodrelations/v1#LeaseOut"
                : "http://purl.org/goodrelations/v1#Sell",
            url: pageUrl,
          },
        }),
    provider: { "@id": `${url}/#asesor` },
  };
}

export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      // Contenido serializado por el servidor; se escapa «<» para no cerrar la etiqueta.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
