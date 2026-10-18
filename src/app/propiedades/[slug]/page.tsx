import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Bath,
  BedDouble,
  CarFront,
  Check,
  MapPin,
  Phone,
  Scan,
} from "lucide-react";
import { properties, formatPrice } from "@/data/properties";
import { Gallery } from "@/components/gallery";
import { PropertyCard } from "@/components/property-card";
import { Reveal } from "@/components/reveal";
import { WhatsAppIcon } from "@/components/icons";
import { site, whatsappUrl } from "@/lib/site";
import styles from "./property-detail.module.css";

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
  return (
    <main className={`property-page section-pad ${styles.page}`} id="contenido">
      <Link className="back-link" href="/#propiedades">
        <ArrowLeft size={16} />
        Volver a propiedades
      </Link>
      <Reveal className="detail-heading">
        <div>
          <span className="eyebrow">
            {property.type.toUpperCase()} · {property.operation.toUpperCase()}{" "}
            <span className="detail-demo">DEMOSTRACIÓN</span>
          </span>
          <h1>{property.title}</h1>
          <p>
            <MapPin size={16} />
            {property.location}
            <span> / {property.reference}</span>
          </p>
        </div>
        <div className="detail-price">
          <span>
            PRECIO ILUSTRATIVO · USD
            {property.operation === "Alquiler" ? " / MES" : ""}
          </span>
          <p>{formatPrice(property.price)}</p>
        </div>
      </Reveal>
      <div className="demo-alert">
        <span>DEMOSTRACIÓN</span>Esta ficha contiene datos ficticios e imágenes
        ilustrativas. No representa una propiedad disponible ni una oferta
        comercial.
      </div>
      <div className="detail-grid">
        <div>
          <Gallery images={property.images} />
          <Reveal className="detail-specs">
            <div>
              <BedDouble size={23} />
              <strong>{property.bedrooms}</strong>
              <span>Habitaciones</span>
            </div>
            <div>
              <Bath size={23} />
              <strong>{property.bathrooms}</strong>
              <span>Baños</span>
            </div>
            <div>
              <Scan size={23} />
              <strong>{property.area} m²</strong>
              <span>Superficie</span>
            </div>
            <div>
              <CarFront size={23} />
              <strong>{property.parking}</strong>
              <span>Parqueos</span>
            </div>
          </Reveal>
          <section className="detail-description">
            <span className="eyebrow">EL ESPACIO</span>
            <h2>Imagina las posibilidades.</h2>
            <p>{property.description}</p>
            <h3>Características de ejemplo</h3>
            <ul className="amenities">
              {property.amenities.map((amenity) => (
                <li key={amenity}>
                  <Check size={17} />
                  {amenity}
                </li>
              ))}
            </ul>
            <h3>Ubicación de referencia</h3>
            <p>
              <MapPin size={16} /> {property.location}. {property.neighborhood}.
              No se proporciona dirección ni coordenadas porque esta ficha es de
              demostración.
            </p>
          </section>
        </div>
        <aside className="advisor-card" aria-label="Consulta con tu asesor">
          <span className="eyebrow">CONVERSEMOS</span>
          <h2>
            ¿Buscas algo
            <br />
            <em>como esto?</em>
          </h2>
          <p>
            Cuéntame qué te gusta de este espacio y exploremos opciones reales
            para ti.
          </p>
          <div className="advisor-identity">
            <span className="advisor-initials">TP</span>
            <span>
              Thony Paulino<small>Asesor inmobiliario · Ramaldi</small>
            </span>
          </div>
          <a
            className="button button-primary"
            href={whatsappUrl(property)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon width={20} height={20} /> Consultar a Thony{" "}
            <ArrowUpRight size={17} />
          </a>
          <a className="advisor-phone" href={site.phoneHref}>
            <Phone size={16} />
            {site.phone}
          </a>
          <small className="advisor-note">
            La consulta hará referencia a esta ficha de demostración y a
            opciones reales similares.
          </small>
        </aside>
      </div>
      <section className="related-properties">
        <Reveal className="section-heading">
          <h2>
            Más espacios.
            <br />
            <em>Más posibilidades.</em>
          </h2>
          <Link className="text-link" href="/#propiedades">
            Explorar el catálogo <ArrowUpRight size={19} />
          </Link>
        </Reveal>
        <div className="property-grid">
          {properties
            .filter((p) => p.slug !== slug)
            .slice(0, 3)
            .map((p, index) => (
              <PropertyCard key={p.slug} property={p} index={index} />
            ))}
        </div>
      </section>
      <aside
        className={styles.mobileContact}
        aria-label="Consulta rápida de esta ficha"
      >
        <div className={styles.mobileSummary}>
          <span>{property.title}</span>
          <small>
            Demostración · USD {formatPrice(property.price)}
            {property.operation === "Alquiler" ? " / mes" : ""}
          </small>
        </div>
        <a
          href={whatsappUrl(property)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar por WhatsApp sobre ${property.title}, ficha de demostración`}
        >
          <WhatsAppIcon width={18} height={18} aria-hidden="true" /> Hablemos
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </aside>
    </main>
  );
}
