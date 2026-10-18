import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Bath, BedDouble, MapPin, Scan } from "lucide-react";
import { formatPrice, type Property } from "@/data/properties";

export function PropertyCard({
  property,
  index = 0,
}: {
  property: Property;
  index?: number;
}) {
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
          sizes="(max-width: 620px) 94vw, (max-width: 900px) 47vw, 32vw"
          className="property-image"
        />
        <div className="property-badges">
          <span>{property.operation}</span>
          <span className="demo-badge">Demostración</span>
        </div>
        <span className="image-action">
          <ArrowUpRight size={21} />
        </span>
        <span className="image-index">0{index + 1} /</span>
      </Link>
      <div className="property-info">
        <div className="property-location">
          <MapPin size={13} />
          {property.location}
          <span>{property.type}</span>
        </div>
        <Link href={`/propiedades/${property.slug}`}>
          <h3>{property.title}</h3>
        </Link>
        <div className="property-specs">
          <span>
            <BedDouble />
            {property.bedrooms} hab.
          </span>
          <span>
            <Bath />
            {property.bathrooms} baños
          </span>
          <span>
            <Scan />
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
            Ver detalles <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
