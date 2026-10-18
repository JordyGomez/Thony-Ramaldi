import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, type Property } from "@/data/properties";

export function PropertyCard({
  property,
}: {
  property: Property;
  index?: number;
}) {
  const known = [property.bedrooms, property.bathrooms, property.area].every(
    (value) => value !== null,
  );
  return (
    <article
      className="property-card"
      data-listing-kind={property.demo ? "demo" : "real"}
    >
      <Link
        href={`/propiedades/${property.slug}`}
        className="property-image-link"
        aria-label={`Ver ${property.title}, ${property.demo ? "demostración" : "ficha en preparación"}`}
      >
        <Image
          src={property.images[0].src}
          alt={property.images[0].alt}
          fill
          sizes="(max-width: 620px) 92vw, (max-width: 1100px) 46vw, 31vw"
          className="property-image"
        />
        <span className="property-badges">
          <span>{property.operation}</span>
          <span className={property.demo ? "demo-badge" : "preparation-badge"}>
            {property.demo ? "Demostración" : "Ficha en preparación"}
          </span>
        </span>
      </Link>
      <div className="property-info">
        <Link href={`/propiedades/${property.slug}`}>
          <h3>{property.title}</h3>
        </Link>
        <p className="property-location">
          {property.location} · {property.type}
        </p>
        <p className="property-specs">
          {known
            ? `${property.bedrooms} hab. · ${property.bathrooms} baños · ${property.area} m²`
            : "Unidad por confirmar"}
        </p>
        <div className="property-bottom">
          <div>
            <p className="property-price">
              <span>USD</span> {formatPrice(property.price)}
              {property.operation === "Alquiler" && <small> / mes</small>}
            </p>
            {property.priceProvisional && (
              <small className="provisional-price-note">
                Renta provisional · por confirmar
              </small>
            )}
          </div>
          <Link
            href={`/propiedades/${property.slug}`}
            aria-label={`Detalles de ${property.title}`}
            className="link-arrow"
          >
            Ver detalles <ArrowUpRight size={15} strokeWidth={1.25} />
          </Link>
        </div>
      </div>
    </article>
  );
}
