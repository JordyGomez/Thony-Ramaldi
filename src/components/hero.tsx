import Image from "next/image";
import { siteImage, type SiteSettings } from "@/lib/site-settings";
import { DepthPlane } from "./depth-plane";

/** Fotografía, escala y composición de Claude; profundidad por capas. */
export function Hero({ settings }: { settings: SiteSettings }) {
  const t = settings.texts;
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
      </div>
    </section>
  );
}
