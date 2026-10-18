import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { siteImage, type SiteSettings } from "@/lib/site-settings";
import { whatsappUrl } from "@/lib/site";
import { DepthPlane } from "./depth-plane";

/** Fotografía, escala y composición de Claude; profundidad por capas. */
export function Hero({ settings }: { settings: SiteSettings }) {
  const t = settings.texts;
  const discover = settings.sections.find(
    (section) =>
      section.visible && section.id !== "featured" && section.id !== "showcase",
  );
  const destinations = {
    intro: "presentacion",
    catalog: "propiedades",
    journey: "mi-proximo-espacio",
    about: "sobre-thony",
    contact: "contacto",
    featured: "",
    showcase: "",
  };
  return (
    <section className="hero claude-hero" aria-labelledby="hero-title">
      <DepthPlane className="hero-depth-layer">
        <Image
          src={siteImage(settings.assets.hero)}
          alt={t.heroAlt}
          fill
          sizes="(max-aspect-ratio: 16/9) 192vh, 108vw"
          preload
          className="hero-image"
        />
      </DepthPlane>
      <div className="hero-shade" />
      <div className="hero-content">
        <h1 id="hero-title">
          <span>{t.heroTitle}</span> <strong>{t.heroEmphasis}</strong>
        </h1>
        <div className="hero-meta">
          <span>{t.heroSubtitle}</span>
          {discover && (
            <a href={`#${destinations[discover.id]}`} className="link-arrow">
              {t.heroDiscover} <ArrowDown size={15} strokeWidth={1.25} />
            </a>
          )}
          <a
            href={whatsappUrl(undefined, {
              number: t.whatsapp,
              message: t.whatsappMessage,
              name: t.name,
            })}
            className="link-arrow"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.heroCta} <ArrowUpRight size={15} strokeWidth={1.25} />
          </a>
        </div>
      </div>
      {t.heroNote && <span className="photo-note">{t.heroNote}</span>}
      <span className="hero-signature" aria-hidden="true">
        {t.name
          .split(" ")
          .map((word) => word[0])
          .join("")}{" "}
        <span>{t.heroSignature}</span>
      </span>
    </section>
  );
}
