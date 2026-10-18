import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FileText, MapPin } from "lucide-react";
import { properties, formatPrice } from "@/data/properties";
import { Reveal } from "./reveal";
import styles from "./featured-rental.module.css";

export function FeaturedRental() {
  const property = properties.find((item) => !item.demo);
  if (!property) return null;

  return (
    <section
      className={`section-pad ${styles.feature}`}
      aria-labelledby="rental-title"
    >
      <Reveal className={styles.image} variant="image">
        <Image
          src={property.images[0].src}
          alt={property.images[0].alt}
          fill
          sizes="(max-width: 900px) 90vw, 50vw"
        />
        <span>RENDER DEL PROYECTO · FOLLETO ORIGINAL</span>
      </Reveal>
      <Reveal className={styles.copy} delay={0.1}>
        <span className="label">ALQUILER · FICHA EN PREPARACIÓN</span>
        <h2 id="rental-title">
          Alberobello.
          <br />
          <strong>Tu próximo espacio en Santiago.</strong>
        </h2>
        <p className={styles.location}>
          <MapPin size={16} aria-hidden="true" /> La Vereda, Don Pedro ·
          Santiago
        </p>
        <p>
          Conoce el proyecto del apartamento que Thony está ofreciendo en
          alquiler. Explora sus espacios y consulta los detalles de la unidad.
        </p>
        <div className={styles.price}>
          <span>RENTA PROVISIONAL · POR CONFIRMAR</span>
          <strong>
            USD {formatPrice(property.price)} <small>/ mes</small>
          </strong>
          <p>
            Importe de maqueta para revisión. La renta y las condiciones
            definitivas se confirman con Thony.
          </p>
        </div>
        <div className={styles.actions}>
          <Link
            className="button button-solid"
            href={`/propiedades/${property.slug}`}
          >
            Ver apartamento <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          {property.brochure && (
            <a
              className="link-arrow"
              href={property.brochure.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText size={17} aria-hidden="true" /> Folleto del proyecto
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
