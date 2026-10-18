import Link from "next/link";
import { Instagram, Mail, Phone } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";
import { WhatsAppIcon } from "./icons";

const links = [
  { href: "/", title: "Inicio" },
  { href: "/#propiedades", title: "Propiedades" },
  { href: "/#sobre-thony", title: "Sobre Thony" },
  { href: "/#contacto", title: "Contacto" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <nav className="footer-nav" aria-label="Navegación del pie">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.title}
          </Link>
        ))}
      </nav>
      <p className="footer-wordmark" aria-hidden="true">
        THONY PAULINO
      </p>
      <div className="footer-image footer-architecture" aria-hidden="true">
        <span /><span /><span />
        <p>ESPACIOS PARA TU HISTORIA.</p>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Thony Paulino · Ramaldi · República
          Dominicana
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
      <p className="footer-disclaimer">
        Precios, disponibilidad y condiciones sujetos a confirmación con Thony.
      </p>
    </footer>
  );
}
