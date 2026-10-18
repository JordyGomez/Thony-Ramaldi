import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Phone } from "lucide-react";
import { formatPrice, listingStatus } from "@/data/properties";
import { getProperties } from "@/data/get-properties";
import { Gallery } from "@/components/gallery";
import { PropertyCard } from "@/components/property-card";
import { WhatsAppIcon } from "@/components/icons";
import { site, whatsappUrl } from "@/lib/site";
import styles from "./property-detail.module.css";

// Mantener igual a PROPERTIES_REVALIDATE (Next exige un literal aquí). Las
// fichas nuevas del panel se generan bajo demanda (dynamicParams por defecto).
export const revalidate = 60;

export async function generateStaticParams() {
  const properties = await getProperties();
  return properties.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const properties = await getProperties();
  const property = properties.find((p) => p.slug === slug);
  const status = property && listingStatus(property);
  const operation = property?.operation.toLowerCase();
  return property
    ? {
        title:
          status === "demo"
            ? `${property.title} · Demostración`
            : status === "preparation"
              ? `${property.title} en ${operation} · Ficha en preparación`
              : `${property.title} en ${operation}`,
        description:
          status === "demo"
            ? `Ficha de demostración de ${property.type.toLowerCase()} en ${property.location}. Datos e imágenes ilustrativos, sin oferta comercial.`
            : status === "preparation"
              ? `${property.type} en ${operation} en ${property.title}, ${property.location}. Ficha en preparación con precio y unidad por confirmar${property.imagesAreRenders ? "; renders del proyecto" : ""}.`
              : `${property.type} en ${operation} en ${property.location}. ${property.neighborhood}.`,
        robots: { index: false, follow: true },
        ...(site.url
          ? {
              alternates: {
                canonical: `${site.url}/propiedades/${property.slug}`,
              },
            }
          : {}),
      }
    : { title: "Propiedad no encontrada", robots: { index: false } };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const properties = await getProperties();
  const property = properties.find((p) => p.slug === slug);
  if (!property) notFound();
  const status = listingStatus(property);
  const isDemo = status === "demo";
  const isRental = property.operation === "Alquiler";
  const details = [
    ["Habitaciones", property.bedrooms],
    ["Baños", property.bathrooms],
    ["Superficie", property.area === null ? null : `${property.area} m²`],
    ["Parqueos", property.parking],
  ];
  return (
    <main className={`property-page ${styles.page}`} id="contenido">
      <Gallery
        images={property.images}
        kind={
          isDemo
            ? "illustrative"
            : property.imagesAreRenders
              ? "project-render"
              : "photo"
        }
        projectName={property.projectName ?? property.title}
      />
      <div className="property-body section-pad">
        <Link className="back-link" href="/#propiedades">
          <ArrowLeft size={16} strokeWidth={1.25} />
          Volver a propiedades
        </Link>
        {(status !== "available" || property.confirmationNote) && (
          <div
            className={isDemo ? "demo-alert" : "preparation-alert"}
            role="note"
          >
            <span>
              {isDemo
                ? "Demostración"
                : status === "preparation"
                  ? "FICHA EN PREPARACIÓN"
                  : "A TENER EN CUENTA"}
            </span>
            {isDemo
              ? "Esta ficha contiene datos ficticios e imágenes ilustrativas. No representa una propiedad disponible ni una oferta comercial."
              : property.confirmationNote}
          </div>
        )}
        <div className="detail-grid">
          <section className="detail-description">
            <h1>
              {property.title}
              {!isDemo && ` en ${property.operation.toLowerCase()}`}
            </h1>
            <p className="detail-location">
              {property.location} · {property.type} ·{" "}
              {isDemo
                ? "Demostración"
                : status === "preparation"
                  ? "Ficha en preparación"
                  : "Disponible"}{" "}
              /{" "}
              {property.reference}
            </p>
            <p>{property.description}</p>
            <h2 className="label">
              {isDemo
                ? "Características de ejemplo"
                : property.projectFacts
                  ? "Características del proyecto según folleto"
                  : "Características"}
            </h2>
            <ul
              className={`amenities${property.projectFacts ? " project-facts" : ""}`}
            >
              {(property.projectFacts ?? property.amenities).map((amenity) => (
                <li key={amenity}>{amenity}</li>
              ))}
            </ul>
            {property.projectTypologies && (
              <>
                <h2 className="label">Tipologías del proyecto</h2>
                {status === "preparation" && (
                  <p>
                    El folleto presenta estas opciones. No identifican la unidad
                    que está {isRental ? "alquilando" : "ofreciendo"} Thony ni
                    confirman su distribución o superficie.
                  </p>
                )}
                <ul className="amenities project-facts">
                  {property.projectTypologies.map((typology) => (
                    <li key={typology}>{typology}</li>
                  ))}
                </ul>
              </>
            )}
            <h2 className="label">
              {isDemo
                ? "Ubicación de referencia"
                : status === "preparation"
                  ? "Ubicación del proyecto"
                  : "Ubicación"}
            </h2>
            <p className="detail-note">
              {property.location}. {property.neighborhood}.{" "}
              {isDemo
                ? "No se proporciona dirección ni coordenadas porque esta ficha es de demostración."
                : status === "preparation"
                  ? "La unidad y el nivel del apartamento se confirmarán con Thony."
                  : null}
            </p>
            {property.brochure && (
              <>
                <a
                  className="link-arrow"
                  href={property.brochure.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {property.brochure.label}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </a>
                <p className="detail-note">
                  Folleto original del promotor; consulta{" "}
                  {isRental ? "el alquiler" : "la compra"} con Thony.
                </p>
              </>
            )}
          </section>
          <div className="detail-side">
            <div className="detail-price">
              <span>
                {property.priceProvisional
                  ? `${isRental ? "Renta" : "Precio"} provisional · por confirmar`
                  : isDemo
                    ? "PRECIO ILUSTRATIVO · USD"
                    : isRental
                      ? "RENTA MENSUAL"
                      : "PRECIO DE VENTA"}
              </span>
              <p>
                {!isDemo && "USD "}
                {formatPrice(property.price)}
                {property.operation === "Alquiler" && <small> / mes</small>}
              </p>
            </div>
            <h2 className="label">Información de la unidad</h2>
            <dl className="info-table detail-specs">
              {details.map(([term, value]) => (
                <div key={String(term)}>
                  <dt>{term}</dt>
                  <dd>
                    <strong
                      className={
                        value === null ? "unconfirmed-value" : undefined
                      }
                    >
                      {value ?? "Por confirmar"}
                    </strong>
                  </dd>
                </div>
              ))}
            </dl>
            <aside className="advisor-card" aria-label="Consulta con tu asesor">
              <h2>
                {isDemo ? (
                  <>
                    ¿Buscas algo <strong>como esto?</strong>
                  </>
                ) : (
                  <>
                    Consulta sobre{" "}
                    <strong>
                      {isRental ? "este alquiler." : "esta propiedad."}
                    </strong>
                  </>
                )}
              </h2>
              <p>
                {isDemo
                  ? "Cuéntame qué te gusta de este espacio y exploremos opciones reales para ti."
                  : status === "preparation"
                    ? isRental
                      ? "Confirma con Thony la disponibilidad, la unidad, la renta mensual y las condiciones del alquiler."
                      : "Confirma con Thony la disponibilidad, la unidad, el precio y las condiciones de compra."
                    : "Pregúntale a Thony por la disponibilidad, las visitas y las condiciones."}
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
                {isDemo
                  ? "La consulta hará referencia a esta ficha de demostración y a opciones reales similares."
                  : status === "preparation"
                    ? `La consulta identifica ${property.projectName ?? property.title} y pide confirmar los datos de la unidad.${property.priceProvisional ? " El importe mostrado es provisional." : ""}`
                    : "La consulta incluirá el nombre y la referencia de esta propiedad."}
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
      <aside
        className={styles.mobileContact}
        aria-label="Consulta rápida de esta ficha"
      >
        <div className={styles.mobileSummary}>
          <span>{property.title}</span>
          <small>
            {property.demo ? "Demostración" : "Renta provisional"} · USD{" "}
            {formatPrice(property.price)}
            {property.operation === "Alquiler" ? " / mes" : ""}
          </small>
        </div>
        <a
          href={whatsappUrl(property)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar por WhatsApp sobre ${property.title}, ${property.demo ? "ficha de demostración" : "alquiler por confirmar"}`}
        >
          <WhatsAppIcon width={18} height={18} aria-hidden="true" /> Hablemos{" "}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </aside>
    </main>
  );
}
