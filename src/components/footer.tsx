"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Instagram, Mail, Phone } from "lucide-react";
import { useSite } from "./site-provider";
import { navigation, siteImage } from "@/lib/site-settings";
import type { FooterPropertyImage } from "@/lib/footer-property-image";
import { WhatsAppIcon } from "./icons";

export function Footer({ image }: { image?: FooterPropertyImage }) {
  const { settings, contact: site, whatsappUrl } = useSite();
  const links = navigation(settings);
  // Ignorar también el recurso fijo de configuraciones guardadas anteriormente.
  const customPhoto =
    settings.assets.footer && settings.assets.footer !== "/images/villa.jpg";
  const signature = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    // La firma original conserva la medida exacta de Claude. Otras firmas se ajustan.
    const element = signature.current;
    if (!element || settings.texts.footerWordmark === "THONY PAULINO") return;
    let active = true;
    document.fonts.ready.then(() => {
      if (!active) return;
      const context = document.createElement("canvas").getContext("2d");
      if (!context) return;
      context.font = `500 100px ${getComputedStyle(element).fontFamily}`;
      const width =
        context.measureText(settings.texts.footerWordmark).width / 100 -
        Math.max(0, settings.texts.footerWordmark.length - 1) * 0.045;
      element.style.setProperty(
        "--signature-ratio",
        String(Math.max(3, width + 0.05)),
      );
    });
    return () => {
      active = false;
      element.style.removeProperty("--signature-ratio");
    };
  }, [settings.texts.footerWordmark]);
  return (
    <footer className="site-footer">
      <nav className="footer-nav" aria-label="Navegación del pie">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.title}
          </Link>
        ))}
      </nav>
      <p ref={signature} className="footer-wordmark" aria-hidden="true">
        {settings.texts.footerWordmark}
      </p>
      {image && (
        <div className="footer-image">
          <Image
            src={customPhoto ? siteImage(settings.assets.footer) : image.src}
            alt={customPhoto ? settings.texts.footerAlt : image.alt || image.title}
            fill
            sizes="110vw"
            className="footer-photo"
          />
          {(customPhoto ? settings.texts.footerNote : image.title) && (
            <span className="photo-note">
              {customPhoto ? settings.texts.footerNote : image.title}
            </span>
          )}
        </div>
      )}
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {site.name} · {site.company} ·{" "}
          {settings.texts.location}
        </span>
        <div className="footer-socials">
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Thony Paulino"
          >
            <Instagram size={17} strokeWidth={1.5} />
          </a>
          <a href={`mailto:${site.email}`} aria-label="Enviar correo a Thony">
            <Mail size={17} strokeWidth={1.5} />
          </a>
          <a href={site.phoneHref} aria-label="Llamar a Thony">
            <Phone size={16} strokeWidth={1.5} />
          </a>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir a Thony por WhatsApp"
          >
            <WhatsAppIcon width={18} height={18} />
          </a>
        </div>
      </div>
      <p className="footer-disclaimer">{settings.texts.footerDisclaimer}</p>
    </footer>
  );
}
