"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";

const links = [
  { href: "/", title: "Inicio" },
  { href: "/#propiedades", title: "Propiedades" },
  { href: "/#sobre-thony", title: "Sobre Thony" },
  { href: "/#contacto", title: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = menu.current?.querySelector<HTMLAnchorElement>("a");
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (event.key === "Tab") {
        const items = [
          toggle.current,
          ...Array.from(
            menu.current?.querySelectorAll<HTMLAnchorElement>("a") || [],
          ),
        ].filter(Boolean) as HTMLElement[];
        const index = items.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index === 0) {
          event.preventDefault();
          items.at(-1)?.focus();
        }
        if (!event.shiftKey && index === items.length - 1) {
          event.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const media = window.matchMedia("(min-width: 900px)");
    const closeOnDesktop = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <header className="site-header">
      <Link
        className="brand"
        href="/"
        aria-label="Thony Paulino · Ramaldi, inicio"
        onClick={() => setOpen(false)}
      >
        {site.logo && (
          <Image src={site.logo} alt="Ramaldi" width={100} height={38} />
        )}
        <span className="brand-name">
          Thony Paulino
          <span>
            ASESOR INMOBILIARIO <span className="brand-divider">/</span> RAMALDI
          </span>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="Navegación principal">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.title}
          </Link>
        ))}
      </nav>
      <a
        className="header-contact"
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
      >
        Hablemos <ArrowUpRight size={17} />
      </a>
      <button
        className="menu-toggle"
        ref={toggle}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <div ref={menu} id="mobile-navigation" className="mobile-navigation">
          <nav aria-label="Navegación móvil">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                <span>0{i + 1}</span>
                {link.title}
                <ArrowUpRight size={24} />
              </Link>
            ))}
          </nav>
          <p>Tu próximo espacio empieza con una conversación.</p>
          <a
            href={whatsappUrl()}
            className="button button-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contactar a Thony <ArrowUpRight size={18} />
          </a>
        </div>
      )}
    </header>
  );
}
