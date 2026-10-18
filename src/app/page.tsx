import Image from "next/image";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Instagram,
  Mail,
  Phone,
} from "lucide-react";
import { Catalog } from "@/components/catalog";
import { Preloader } from "@/components/preloader";
import { Reveal } from "@/components/reveal";
import { WhatsAppIcon } from "@/components/icons";
import { site, whatsappUrl } from "@/lib/site";

export default function Home() {
  return (
    <main id="contenido">
      <Preloader />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-overline">
          <span>
            <i /> REAL ESTATE, CON UN ENFOQUE PERSONAL.
          </span>
          <span>
            REPÚBLICA DOMINICANA <span className="tiny-star">✳</span>
          </span>
        </div>
        <div className="hero-intro">
          <h1 id="hero-title">
            Tu próximo espacio.
            <br />
            <em>Tu próxima historia.</em>
          </h1>
          <div className="hero-copy">
            <p>
              Hay un lugar para lo que viene.
              <br />
              Encuéntralo con el acompañamiento de Thony Paulino, asesor
              inmobiliario de Ramaldi.
            </p>
            <a href="#propiedades" className="text-link">
              Explorar propiedades <ArrowDownRight size={22} />
            </a>
          </div>
        </div>
        <div className="hero-image-frame">
          <Image
            src="/images/hero.jpg"
            alt="Residencia con piscina, fotografía ilustrativa de inspiración"
            fill
            sizes="100vw"
            preload
            className="hero-image"
          />
          <div className="hero-image-shade" />
          <div className="hero-image-copy">
            <span>UN NUEVO COMIENZO</span>
            <h2>
              Más que un lugar.
              <br />
              Una forma de vivir.
            </h2>
          </div>
          <a
            href={whatsappUrl()}
            className="hero-circle"
            aria-label="Hablar con Thony sobre mi próximo hogar"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowUpRight strokeWidth={1} size={40} />
          </a>
          <span className="hero-image-note">FOTOGRAFÍA ILUSTRATIVA</span>
          <div className="hero-image-caption">
            <span>VIVIR. INVERTIR. PERTENECER.</span>
            <a href="#propiedades">
              DESCUBRIR <ArrowDown size={14} />
            </a>
          </div>
        </div>
        <div className="hero-bottom">
          <span>ASESORÍA INMOBILIARIA PERSONAL</span>
          <span className="hero-bottom-center">
            Un espacio para cada nueva etapa.
          </span>
          <span>
            REPÚBLICA DOMINICANA <ArrowDown size={14} />
          </span>
        </div>
      </section>

      <Catalog />

      <section className="about section-pad" id="sobre-thony">
        <div className="section-eyebrow">
          <span className="gold-line" /> DETRÁS DE CADA BÚSQUEDA{" "}
          <span className="section-number">02 /</span>
        </div>
        <div className="about-grid">
          <Reveal className="about-visual">
            <Image
              src={site.portrait || "/images/living.jpg"}
              alt={
                site.portrait
                  ? "Thony Paulino, asesor inmobiliario"
                  : "Interior residencial ilustrativo; no es una fotografía de Thony"
              }
              fill
              sizes="(max-width: 900px) 92vw, 45vw"
            />
            <div className="about-image-overlay">
              <span>UNA VISIÓN PERSONAL.</span>
              <p>
                Cada espacio,
                <br />
                <em>una posibilidad.</em>
              </p>
            </div>
            <span className="about-image-label">
              {site.portrait ? "THONY PAULINO" : "IMAGEN DE INSPIRACIÓN"}
            </span>
          </Reveal>
          <Reveal className="about-copy">
            <span className="eyebrow">TU ASESOR INMOBILIARIO</span>
            <h2>
              Thony Paulino.
              <br />
              <em>
                Tu próximo paso,
                <br />
                bien acompañado.
              </em>
            </h2>
            <p>
              Elegir dónde vivir o invertir es una decisión personal. Mi
              propósito es acompañarte en esa búsqueda, entender lo que
              necesitas y ayudarte a explorar tus opciones con claridad.
            </p>
            <p className="about-attribution">
              Thony Paulino <span>Asesor inmobiliario · Ramaldi</span>
            </p>
            <div className="service-list">
              <div>
                <span>01</span>
                <p>Escuchar lo que buscas.</p>
                <ArrowUpRight size={16} />
              </div>
              <div>
                <span>02</span>
                <p>Explorar nuevas posibilidades.</p>
                <ArrowUpRight size={16} />
              </div>
              <div>
                <span>03</span>
                <p>Acompañar tu decisión.</p>
                <ArrowUpRight size={16} />
              </div>
            </div>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
            >
              Conversemos sobre tu próximo hogar <ArrowUpRight size={18} />
            </a>
          </Reveal>
        </div>
      </section>

      <section id="contacto" className="contact-section section-pad">
        <div className="section-eyebrow">
          <span className="gold-line" /> HAGAMOS ESPACIO PARA LO QUE VIENE{" "}
          <span className="section-number">03 /</span>
        </div>
        <div className="contact-grid">
          <Reveal>
            <h2>
              Todo comienza
              <br />
              con una buena
              <br />
              <em>conversación.</em>
            </h2>
            <p>
              Cuéntame qué tienes en mente.
              <br />
              Demos juntos el próximo paso.
            </p>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-gold"
            >
              <WhatsAppIcon width={20} height={20} /> Escríbeme por WhatsApp{" "}
              <ArrowUpRight size={18} />
            </a>
          </Reveal>
          <div className="contact-details">
            <a href={site.phoneHref}>
              <Phone size={20} strokeWidth={1.3} />
              <span>
                <small>LLÁMAME</small>
                {site.phone}
              </span>
              <ArrowUpRight size={19} />
            </a>
            <a href={`mailto:${site.email}`}>
              <Mail size={20} strokeWidth={1.3} />
              <span>
                <small>ESCRÍBEME</small>
                {site.email}
              </span>
              <ArrowUpRight size={19} />
            </a>
            <a href={site.instagram} target="_blank" rel="noopener noreferrer">
              <Instagram size={20} strokeWidth={1.3} />
              <span>
                <small>SÍGUEME EN INSTAGRAM</small>
                {site.instagramHandle}
              </span>
              <ArrowUpRight size={19} />
            </a>
            {site.facebook ? (
              <a href={site.facebook} target="_blank" rel="noopener noreferrer">
                <span className="facebook-icon">f</span>
                <span>
                  <small>FACEBOOK</small>Thony Paulino
                </span>
                <ArrowUpRight size={19} />
              </a>
            ) : (
              <div className="contact-pending">
                <span className="facebook-icon">f</span>
                <span>
                  <small>FACEBOOK · THONY PAULINO</small>Enlace por confirmar
                </span>
              </div>
            )}
            <div className="contact-signature">
              <span>THONY PAULINO</span>
              <span>
                RAMALDI <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </div>
      </section>
      <a
        className="floating-whatsapp"
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar con Thony por WhatsApp"
      >
        <WhatsAppIcon width={25} height={25} />
      </a>
    </main>
  );
}
