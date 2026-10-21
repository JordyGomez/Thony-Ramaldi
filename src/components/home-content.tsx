import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Property } from "@/data/properties";
import {
  siteImage,
  type SiteSettings,
  type SectionId,
} from "@/lib/site-settings";
import { whatsappUrl } from "@/lib/site";
import { Catalog } from "./catalog";
import { Reveal } from "./reveal";
import { Showcase } from "./showcase";
import { FeaturedRental } from "./featured-rental";
import { WhatsAppIcon } from "./icons";
import { Hero } from "./hero";
import { DepthPlane } from "./depth-plane";
import { AppointmentInvitation } from "./appointments/invitation";
import { PersonalSearch } from "./personal-search";

export function HomeContent({
  properties,
  settings,
}: {
  properties: Property[];
  settings: SiteSettings;
  preview?: boolean;
}) {
  const t = settings.texts;
  const wa = whatsappUrl(undefined, {
    number: t.whatsapp,
    message: t.whatsappMessage,
    name: t.name,
  });
  const sections: Record<SectionId, React.ReactNode> = {
    intro: (
      <section className="intro section-pad" id="presentacion">
        <Reveal variant="soft">
          <p className="intro-text">{t.intro}</p>
          {settings.sections.some(
            (section) => section.id === "about" && section.visible,
          ) && (
            <a href="#sobre-thony" className="button">
              {t.introCta} <ArrowRight size={16} strokeWidth={1.25} />
            </a>
          )}
        </Reveal>
      </section>
    ),
    featured: <FeaturedRental properties={properties} />,
    showcase: <Showcase properties={properties} />,
    catalog: <Catalog properties={properties} />,
    journey: <PersonalSearch properties={properties} />,
    about: (
      <section className="about section-pad" id="sobre-thony">
        <Reveal className="about-copy">
          <h2 className="about-title">{t.aboutTitle}</h2>
          <p className="about-role">{t.role}</p>
          <p>{t.aboutDescription}</p>
          <dl className="info-table">
            {settings.steps.map((step, index) => (
              <div key={index}>
                <dt>
                  {String(index + 1).padStart(2, "0")} · {step.title}
                </dt>
                <dd>{step.detail}</dd>
              </div>
            ))}
          </dl>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="button"
          >
            {t.aboutCta} <ArrowUpRight size={16} strokeWidth={1.25} />
          </a>
        </Reveal>
        <Reveal className="about-visual" variant="image">
          <DepthPlane className="about-portrait-plane">
            <Image
              src={siteImage(settings.assets.portrait)}
              alt={t.portraitAlt}
              fill
              sizes="(max-width: 900px) 92vw, 46vw"
              className="about-portrait"
            />
          </DepthPlane>
          <span className="photo-note">
            {t.name} · {t.company}
          </span>
        </Reveal>
      </section>
    ),
    contact: (
      <section id="contacto" className="contact-section section-pad">
        <Reveal className="contact-head">
          <h2>
            {t.contactTitle} <strong>{t.contactEmphasis}</strong>
          </h2>
          <p>{t.contactDescription}</p>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-solid"
          >
            <WhatsAppIcon width={18} height={18} /> {t.contactCta}
          </a>
        </Reveal>
        <Reveal className="contact-details" variant="image">
          <a href={`tel:+${t.phoneInternational}`}>
            <small>Teléfono</small>
            <span>{t.phone}</span>
            <ArrowUpRight size={17} strokeWidth={1.25} />
          </a>
          <a href={`mailto:${t.email}`}>
            <small>Correo</small>
            <span>{t.email}</span>
            <ArrowUpRight size={17} strokeWidth={1.25} />
          </a>
          <a href={t.instagram} target="_blank" rel="noopener noreferrer">
            <small>Instagram</small>
            <span>{t.instagramHandle}</span>
            <ArrowUpRight size={17} strokeWidth={1.25} />
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer">
            <small>WhatsApp</small>
            <span>{t.phone}</span>
            <ArrowUpRight size={17} strokeWidth={1.25} />
          </a>
        </Reveal>
      </section>
    ),
  };
  return (
    <main id="contenido">
      <Hero settings={settings} />
      {settings.sections
        .filter((section) => section.visible)
        .map((section) => (
          <div
            className="home-section"
            key={section.id}
            data-section={section.id}
          >
            {sections[section.id]}
          </div>
        ))}
      <AppointmentInvitation />
      {settings.experience.floatingContact && (
        <a
          className="floating-whatsapp"
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar con ${t.name.split(" ")[0]} por WhatsApp`}
        >
          <WhatsAppIcon width={24} height={24} />
        </a>
      )}
    </main>
  );
}
