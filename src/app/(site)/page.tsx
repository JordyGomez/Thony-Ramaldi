import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { Catalog } from "@/components/catalog";
import { Preloader } from "@/components/preloader";
import { Reveal } from "@/components/reveal";
import { Showcase } from "@/components/showcase";
import { FeaturedRental } from "@/components/featured-rental";
import { WhatsAppIcon } from "@/components/icons";
import { site, whatsappUrl } from "@/lib/site";
import { propertyImages } from "@/data/properties";
import { getProperties } from "@/data/get-properties";

// Mantener igual a PROPERTIES_REVALIDATE (Next exige un literal aquí).
export const revalidate = 60;

const steps = [
  { number: "01", title: "Escuchar", detail: "Entender lo que buscas." },
  { number: "02", title: "Explorar", detail: "Revisar opciones con claridad." },
  { number: "03", title: "Acompañar", detail: "Estar presente en tu decisión." },
];

export default async function Home() {
  const properties = await getProperties();
  return (
    <main id="contenido">
      <Preloader />
      <section className="hero" aria-labelledby="hero-title">
        <Image
          src={propertyImages.hero}
          alt="Residencia con piscina, fotografía ilustrativa de inspiración"
          fill
          sizes="100vw"
          preload
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <h1 id="hero-title">
            Tu próximo espacio. <strong>Tu próxima historia.</strong>
          </h1>
          <div className="hero-meta">
            <span>Asesoría inmobiliaria · República Dominicana</span>
            <a href="#presentacion" className="link-arrow">
              Descubrir <ArrowDown size={15} strokeWidth={1.25} />
            </a>
            <a href={whatsappUrl()} className="link-arrow" target="_blank" rel="noopener noreferrer">
              Hablar con Thony <ArrowUpRight size={15} strokeWidth={1.25} />
            </a>
          </div>
        </div>
        <span className="photo-note">Fotografía ilustrativa</span>
      </section>

      <section className="intro section-pad" id="presentacion">
        <Reveal>
          <p className="intro-text">
            Hay un lugar para lo que viene. Encuéntralo con el acompañamiento de
            Thony Paulino, asesor inmobiliario de Ramaldi en República
            Dominicana, ya sea para vivir o para invertir. Un espacio para cada
            nueva etapa, elegido con calma y con alguien a tu lado.
          </p>
          <a href="#sobre-thony" className="button">
            Conocer a Thony <ArrowRight size={16} strokeWidth={1.25} />
          </a>
        </Reveal>
      </section>

      <FeaturedRental properties={properties} />
      <Showcase properties={properties} />

      <Catalog properties={properties} />

      <section className="about section-pad" id="sobre-thony">
        <Reveal className="about-copy">
          <h2 className="about-title">Thony Paulino</h2>
          <p className="about-role">Asesor inmobiliario · Ramaldi</p>
          <p>
            Elegir dónde vivir o invertir es una decisión personal. Mi propósito
            es acompañarte en esa búsqueda, entender lo que necesitas y ayudarte
            a explorar tus opciones con claridad.
          </p>
          <dl className="info-table">
            {steps.map((step) => (
              <div key={step.number}>
                <dt>
                  {step.number} · {step.title}
                </dt>
                <dd>{step.detail}</dd>
              </div>
            ))}
          </dl>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="button"
          >
            Conversemos sobre tu próximo hogar{" "}
            <ArrowUpRight size={16} strokeWidth={1.25} />
          </a>
        </Reveal>
        <Reveal className="about-visual">
          <Image
            src={site.portrait || propertyImages.living}
            alt={
              site.portrait
                ? "Thony Paulino, asesor inmobiliario"
                : "Interior residencial ilustrativo; no es una fotografía de Thony"
            }
            fill
            sizes="(max-width: 900px) 92vw, 46vw"
          />
          <span className="photo-note">
            {site.portrait ? "Thony Paulino" : "Imagen de inspiración"}
          </span>
        </Reveal>
      </section>

      <section id="contacto" className="contact-section section-pad">
        <Reveal className="contact-head">
          <h2>
            Todo comienza con una buena <strong>conversación</strong>
          </h2>
          <p>Cuéntame qué tienes en mente. Demos juntos el próximo paso.</p>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-solid"
          >
            <WhatsAppIcon width={18} height={18} /> Escríbeme por WhatsApp
          </a>
        </Reveal>
        <div className="contact-details">
          <a href={site.phoneHref}>
            <small>Teléfono</small>
            <span>{site.phone}</span>
            <ArrowUpRight size={17} strokeWidth={1.25} />
          </a>
          <a href={`mailto:${site.email}`}>
            <small>Correo</small>
            <span>{site.email}</span>
            <ArrowUpRight size={17} strokeWidth={1.25} />
          </a>
          <a href={site.instagram} target="_blank" rel="noopener noreferrer">
            <small>Instagram</small>
            <span>{site.instagramHandle}</span>
            <ArrowUpRight size={17} strokeWidth={1.25} />
          </a>
          {site.facebook ? (
            <a href={site.facebook} target="_blank" rel="noopener noreferrer">
              <small>Facebook</small>
              <span>Thony Paulino</span>
              <ArrowUpRight size={17} strokeWidth={1.25} />
            </a>
          ) : (
            <div className="contact-pending">
              <small>Facebook · Thony Paulino</small>
              <span>Enlace por confirmar</span>
            </div>
          )}
        </div>
      </section>
      <a
        className="floating-whatsapp"
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar con Thony por WhatsApp"
      >
        <WhatsAppIcon width={24} height={24} />
      </a>
    </main>
  );
}
