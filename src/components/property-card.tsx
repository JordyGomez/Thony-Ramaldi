import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, type Property } from "@/data/properties";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="property-card">
      <Link
        href={`/propiedades/${property.slug}`}
        className="property-image-link"
        aria-label={`Ver ${property.title}, demostración`}
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
          <span className="demo-badge">Demostración</span>
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
          {property.bedrooms} hab. · {property.bathrooms} baños ·{" "}
          {property.area} m²
        </p>
        <div className="property-bottom">
          <p className="property-price">
            <span>USD</span> {formatPrice(property.price)}
            {property.operation === "Alquiler" && <small> / mes</small>}
          </p>
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
