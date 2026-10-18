import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Catalog } from "@/components/catalog";
import { Preloader } from "@/components/preloader";
import { Reveal } from "@/components/reveal";
import { Showcase } from "@/components/showcase";
import { FeaturedRental } from "@/components/featured-rental";
import { WhatsAppIcon } from "@/components/icons";
import { site, whatsappUrl } from "@/lib/site";
import { Hero } from "@/components/hero";
import { DepthPlane } from "@/components/depth-plane";
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
      <Hero />

      <section className="intro section-pad" id="presentacion">
        <Reveal variant="soft">
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
        <Reveal className="about-visual" variant="image">
          <DepthPlane className="about-portrait-plane">
          <Image
            src={site.portrait}
            alt="Thony Paulino, asesor inmobiliario de Ramaldi"
            fill
            sizes="(max-width: 900px) 92vw, 46vw"
            className="about-portrait"
          />
          </DepthPlane>
          <span className="photo-note">Thony Paulino · Ramaldi</span>
          <span className="about-photo-index label" aria-hidden="true">Una búsqueda personal.<br />Un asesor a tu lado.</span>
        </Reveal>
      </section>

      <section id="contacto" className="contact-section section-pad">
        <Reveal className="contact-head" variant="soft">
          <p className="label">El siguiente paso es conversar</p>
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
        <Reveal className="contact-details" variant="image" delay={0.1}>
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
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
            <small>WhatsApp</small>
            <span>{site.phone}</span>
            <ArrowUpRight size={17} strokeWidth={1.25} />
          </a>
        </Reveal>
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
