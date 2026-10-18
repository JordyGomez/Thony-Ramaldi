import Link from "next/link";
import { ArrowUpRight, Instagram, Mail, Phone } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";
import { WhatsAppIcon } from "./icons";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href="/" className="brand">
          <span className="brand-name">
            Thony Paulino<span>ASESOR INMOBILIARIO / RAMALDI</span>
          </span>
        </Link>
        <p>
          Tu próximo espacio.
          <br />
          Tu próxima historia.
        </p>
        <div className="footer-socials">
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Thony Paulino"
          >
            <Instagram size={18} />
          </a>
          <a href={`mailto:${site.email}`} aria-label="Enviar correo a Thony">
            <Mail size={18} />
          </a>
          <a href={site.phoneHref} aria-label="Llamar a Thony">
            <Phone size={17} />
          </a>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir a Thony por WhatsApp"
          >
            <WhatsAppIcon width={20} height={20} />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Thony Paulino · Ramaldi</span>
        <span>República Dominicana</span>
        <Link href="/#contacto">
          Conversemos <ArrowUpRight size={13} />
        </Link>
      </div>
      <p className="footer-disclaimer">
        Versión de demostración. Los inmuebles e imágenes son ilustrativos y no
        constituyen ofertas comerciales.
      </p>
    </footer>
  );
}
