import { ArrowUpRight, ArrowDownRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/data/properties";
import { projectUnits, projectPrice } from "@/lib/project-units";
import { Gallery } from "@/components/gallery";
import { ProjectPlans } from "./project-plans";
import { ProjectUnits } from "./project-units";
import styles from "./project.module.css";
export function TreoShowcase({
  property,
  whatsapp,
  advisorName,
  preview = false,
}: {
  property: Property;
  whatsapp: string;
  advisorName: string;
  preview?: boolean;
}) {
  const units = projectUnits(property.projectTypologies),
    cover = property.images[0];
  const values = (
    key: "area" | "bedrooms" | "bathrooms" | "parking",
    fallback: number | null,
  ) =>
    units.length
      ? Array.from(new Set(units.map((u) => u[key])))
          .sort((a, b) => a - b)
          .join(" / ")
      : String(fallback ?? "Por confirmar");
  const highlights = [
    ["Superficies en listado", values("area", property.area) + " m²"],
    ["Habitaciones", values("bedrooms", property.bedrooms)],
    ["Baños", values("bathrooms", property.bathrooms)],
    ["Parqueos por unidad", values("parking", property.parking)],
  ];
  return (
    <main id="contenido" className={styles.page}>
      <section className={styles.hero}>
        <Link href="/#propiedades" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" /> Volver a propiedades
        </Link>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              {property.location} · Apartamentos en venta
            </p>
            <h1>
              {/^TREO II(?: Residences)?$/i.test(property.title.trim()) ? (
                <>
                  <span style={{ color: "inherit" }}>TREO</span> <span>II</span>
                  <small>RESIDENCES</small>
                </>
              ) : (
                property.title
              )}
            </h1>
            <p className={styles.intro}>
              Tu próximo espacio.
              <br />
              Desde otra perspectiva.
            </p>
            <p className={styles.priceLabel}>Desde · según listado</p>
            <p className={styles.heroPrice}>
              {projectPrice(
                units.length
                  ? Math.min(...units.map((u) => u.priceMinorUnits))
                  : Math.round(property.price * 100),
              )}
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primary} href="#unidades">
                Explorar unidades{" "}
                <ArrowDownRight size={16} aria-hidden="true" />
              </a>
              <a className={styles.secondary} href="#planos">
                Ver planos isométricos{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
            <p className={styles.muted}>
              {property.neighborhood
                ? property.neighborhood +
                  " · Disponibilidad por confirmar con Thony."
                : "Sector y disponibilidad por confirmar con Thony."}
            </p>
          </div>
          <div className={styles.heroMedia}>
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="(max-width: 850px) 100vw, 65vw"
              preload
              className={styles.cover}
              unoptimized
            />
            <span className={styles.imageLabel}>RENDER DEL PROYECTO</span>
            <div className={styles.mediaSignature}>
              {property.projectName || property.title}
              <small>Una nueva perspectiva</small>
            </div>
          </div>
        </div>
        <dl className={styles.highlights}>
          {highlights.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Conoce el proyecto</p>
              <h2>Imagina tu próximo capítulo.</h2>
            </div>
            <p>{property.description}</p>
          </div>
          <p className={styles.notice}>
            {property.confirmationNote ||
              "Confirma con Thony la ubicación exacta, la disponibilidad y las condiciones."}
          </p>
        </section>
        <ProjectPlans images={property.images} />
        {units.length > 0 && (
          <ProjectUnits
            units={units}
            slug={property.slug}
            title={property.title}
            whatsapp={whatsapp}
            advisorName={advisorName}
            preview={preview}
          />
        )}
        <section className={styles.section} id="galeria">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Material del proyecto</p>
              <h2>Por dentro. Por fuera.</h2>
            </div>
            <p>
              Renders y planos facilitados. No son fotografías de una unidad
              terminada; los acabados y amenidades se confirman con Thony.
            </p>
          </div>
          <div className={styles.gallery}>
            <Gallery
              images={property.images}
              kind="project-render"
              projectName={property.projectName || property.title}
            />
          </div>
          {property.projectFacts?.length && (
            <ul className={styles.facts}>
              {property.projectFacts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </section>
        <section className={styles.end}>
          <p className={styles.eyebrow}>Asesoría personal · {advisorName}</p>
          <h2>
            La próxima visita
            <br />
            empieza conversando.
          </h2>
          <a className={styles.primary} href="#unidades">
            Elegir una referencia <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <p className={styles.muted}>
            {property.location}
            {property.neighborhood
              ? " · " + property.neighborhood
              : " · Sector por confirmar"}{" "}
            · {property.reference}
          </p>
        </section>
      </div>
    </main>
  );
}
