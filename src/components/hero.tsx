import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";
import { ArchitecturalDoor } from "./architectural-door";
import { DepthPlane } from "./depth-plane";

export function Hero() {
  return (
    <section className="hero cinematic-hero" aria-labelledby="hero-title">
      <div className="hero-blueprint" aria-hidden="true"><span /><span /><span /></div>
      <p className="hero-kicker label">Una nueva perspectiva <span>Ramaldi · Inmobiliaria</span></p>
      <DepthPlane className="hero-architecture">
        <div className="hero-portrait-plane">
          <ArchitecturalDoor variant="hero">
            <Image
              src={site.portrait}
              alt="Retrato oficial de Thony Paulino"
              fill
              sizes="(max-width: 700px) 68vw, (max-width: 1100px) 44vw, 360px"
              preload
              className="hero-image"
            />
          </ArchitecturalDoor>
        </div>
        <p className="hero-advisor"><span>Thony Paulino</span>Asesor inmobiliario · Ramaldi</p>
      </DepthPlane>
      <div className="hero-shade" />
      <div className="hero-content">
        <h1 id="hero-title">
          <span>Tu próximo espacio.</span> <strong>Tu próxima historia.</strong>
        </h1>
        <div className="hero-meta">
          <span>Asesoría inmobiliaria · República Dominicana</span>
          <a href="#presentacion" className="link-arrow">Descubrir <ArrowDown size={15} strokeWidth={1.25} /></a>
          <a href={whatsappUrl()} className="link-arrow" target="_blank" rel="noopener noreferrer">
            Hablar con Thony <ArrowUpRight size={15} strokeWidth={1.25} />
          </a>
        </div>
      </div>
      <span className="hero-index label" aria-hidden="true">01 — Tu próximo capítulo</span>
    </section>
  );
}
