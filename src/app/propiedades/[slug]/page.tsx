import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";
import { properties, formatPrice } from "@/data/properties";
import { Gallery } from "@/components/gallery";
import { PropertyCard } from "@/components/property-card";
import { WhatsAppIcon } from "@/components/icons";
import { site, whatsappUrl } from "@/lib/site";

export function generateStaticParams() {
  return properties.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = properties.find((p) => p.slug === slug);
  return property
    ? {
        title: `${property.title} · Demostración`,
        description: `Ficha de demostración de ${property.type.toLowerCase()} en ${property.location}. Datos e imágenes ilustrativos, sin oferta comercial.`,
        robots: { index: false, follow: true },
      }
    : { title: "Propiedad no encontrada", robots: { index: false } };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = properties.find((p) => p.slug === slug);
  if (!property) notFound();
  const details = [
    ["Referencia", property.reference],
    ["Tipo", property.type],
    ["Operación", property.operation],
    [
      "Precio ilustrativo",
      `USD ${formatPrice(property.price)}${property.operation === "Alquiler" ? " / mes" : ""}`,
    ],
    ["Habitaciones", String(property.bedrooms)],
    ["Baños", String(property.bathrooms)],
    ["Superficie", `${property.area} m²`],
    ["Parqueos", String(property.parking)],
    ["Ubicación", `${property.location} · ${property.neighborhood}`],
  ];
  return (
    <main className="property-page" id="contenido">
      <Gallery images={property.images} />
      <div className="property-body section-pad">
        <Link className="back-link" href="/#propiedades">
          <ArrowLeft size={16} strokeWidth={1.25} />
          Volver a propiedades
        </Link>
        <div className="demo-alert">
          <span>Demostración</span>Esta ficha contiene datos ficticios e
          imágenes ilustrativas. No representa una propiedad disponible ni una
          oferta comercial.
        </div>
        <div className="detail-grid">
          <section className="detail-description">
            <h1>{property.title}</h1>
            <p className="detail-location">
              {property.location} · {property.type} · Demostración
            </p>
            <p>{property.description}</p>
            <h2 className="label">Características de ejemplo</h2>
            <ul className="amenities">
              {property.amenities.map((amenity) => (
                <li key={amenity}>{amenity}</li>
              ))}
            </ul>
            <p className="detail-note">
              No se proporciona dirección ni coordenadas porque esta ficha es de
              demostración.
            </p>
          </section>
          <div className="detail-side">
            <h2 className="label">Información</h2>
            <dl className="info-table">
              {details.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <aside className="advisor-card" aria-label="Contacto con el asesor">
              <h2>
                ¿Buscas algo <strong>como esto?</strong>
              </h2>
              <p>
                Cuéntame qué te gusta de este espacio y exploremos opciones
                reales para ti.
              </p>
              <a
                className="button button-solid"
                href={whatsappUrl(property)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon width={18} height={18} /> Consultar a Thony
              </a>
              <a className="advisor-phone" href={site.phoneHref}>
                <Phone size={15} strokeWidth={1.25} />
                {site.phone}
              </a>
              <small className="advisor-note">
                La consulta hará referencia a esta ficha de demostración y a
                opciones reales similares.
              </small>
            </aside>
          </div>
        </div>
        <section className="related-properties">
          <div className="related-head">
            <h2 className="label">Más espacios</h2>
            <Link className="link-arrow" href="/#propiedades">
              Explorar el catálogo <ArrowRight size={16} strokeWidth={1.25} />
            </Link>
          </div>
          <div className="property-grid">
            {properties
              .filter((p) => p.slug !== slug)
              .slice(0, 3)
              .map((p) => (
                <PropertyCard key={p.slug} property={p} />
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
