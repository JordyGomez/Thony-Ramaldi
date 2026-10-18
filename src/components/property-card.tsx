import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Bath, BedDouble, MapPin, Scan } from "lucide-react";
import { formatPrice, type Property } from "@/data/properties";
import styles from "./property-card.module.css";

export function PropertyCard({
  property,
  index = 0,
}: {
  property: Property;
  index?: number;
}) {
  return (
    <article className={`property-card ${styles.card}`}>
      <Link
        href={`/propiedades/${property.slug}`}
        className={`property-image-link ${styles.imageLink}`}
        aria-label={`Ver ${property.title}, demostración`}
      >
        <Image
          src={property.images[0].src}
          alt={property.images[0].alt}
          fill
          sizes="(max-width: 620px) 94vw, (max-width: 900px) 47vw, 32vw"
          className={`property-image ${styles.image}`}
        />
        <div className="property-badges">
          <span
            className={property.operation === "Alquiler" ? styles.rental : styles.sale}
          >
            {property.operation}
          </span>
          <span className="demo-badge">Demostración</span>
        </div>
        <span className="image-action">
          <ArrowUpRight size={21} aria-hidden="true" />
        </span>
        <span className="image-index">0{index + 1} /</span>
      </Link>
      <div className="property-info">
        <div className="property-location">
          <MapPin size={14} aria-hidden="true" />
          {property.location}
          <span>{property.type}</span>
        </div>
        <Link href={`/propiedades/${property.slug}`}>
          <h3>{property.title}</h3>
        </Link>
        <div className="property-specs">
          <span>
            <BedDouble aria-hidden="true" />
            {property.bedrooms} hab.
          </span>
          <span>
            <Bath aria-hidden="true" />
            {property.bathrooms} baños
          </span>
          <span>
            <Scan aria-hidden="true" />
            {property.area} m²
          </span>
        </div>
        <div className="property-bottom">
          <p>
            <span>USD</span> {formatPrice(property.price)}
            {property.operation === "Alquiler" && <small> / mes</small>}
          </p>
          <Link
            href={`/propiedades/${property.slug}`}
            aria-label={`Detalles de ${property.title}`}
          >
            Ver detalles <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
