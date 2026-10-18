"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";

const links = [
  { href: "/", title: "Inicio" },
  { href: "/#propiedades", title: "Propiedades" },
  { href: "/#sobre-thony", title: "Sobre Thony" },
  { href: "/#contacto", title: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`site-header${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}
    >
      <Link
        className="brand"
        href="/"
        aria-label="Thony Paulino · Ramaldi, inicio"
        onClick={() => setOpen(false)}
      >
        {site.logo && (
          <Image src={site.logo} alt="Ramaldi" width={100} height={38} />
        )}
        <span className="brand-name">Thony Paulino</span>
        <span className="brand-sub">Ramaldi</span>
      </Link>
      {/* Mismo menú en todos los tamaños, como la referencia minimalista. */}
      <button
        className="menu-toggle"
        ref={toggle}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
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
              </Link>
            ))}
          </nav>
          <div className="menu-footer">
            <p>Tu próximo espacio empieza con una conversación.</p>
            <a
              href={whatsappUrl()}
              className="button"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contactar a Thony <ArrowUpRight size={16} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
