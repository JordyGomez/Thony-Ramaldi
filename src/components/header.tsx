"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { site, whatsappUrl } from "@/lib/site";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from "motion/react";
import { editorialEase, motionTiming } from "@/lib/motion";
import styles from "./header.module.css";

const scrollSnapshot = () => window.scrollY > 24;
const serverSnapshot = () => false;
const subscribeScroll = (callback: () => void) => {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
};

const links = [
  { href: "/", title: "Inicio" },
  { href: "/#propiedades", title: "Propiedades" },
  { href: "/#sobre-thony", title: "Sobre Thony" },
  { href: "/#contacto", title: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    scrollSnapshot,
    serverSnapshot,
  );
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = Array.from(
      document.querySelectorAll<HTMLElement>("main, footer"),
    ).map((element) => ({ element, inert: element.inert }));
    background.forEach(({ element }) => {
      element.inert = true;
    });
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
      background.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  return (
    <header
      className={`site-header ${styles.header} ${scrolled ? styles.scrolled : ""}`}
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
      <AnimatePresence initial={false}>
        {open && (
          <MobileMenu
            menuRef={menu}
            reduced={!!reduced}
            onNavigate={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <noscript className={styles.fallback}>
        <style>{`@media(max-width:899px){.site-header>noscript{display:contents}.site-header{height:auto!important;min-height:76px;flex-wrap:wrap;padding-top:16px;padding-bottom:12px}.menu-toggle{display:none!important}}`}</style>
        <nav
          className={styles.fallbackNav}
          aria-label="Navegación sin JavaScript"
        >
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.title}
            </a>
          ))}
        </nav>
      </noscript>
    </header>
  );
}

function MobileMenu({
  menuRef,
  reduced,
  onNavigate,
}: {
  menuRef: React.Ref<HTMLDivElement>;
  reduced: boolean;
  onNavigate: () => void;
}) {
  const present = useIsPresent();
  return (
    <motion.div
      ref={menuRef}
      id="mobile-navigation"
      className={`mobile-navigation ${styles.menu}`}
      inert={!present}
      aria-hidden={!present ? true : undefined}
      style={{ pointerEvents: present ? "auto" : "none" }}
      initial={reduced ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8 }}
      transition={{
        duration: reduced ? 0 : motionTiming.normal,
        ease: editorialEase,
      }}
    >
      <span className={styles.menuEyebrow}>UN ESPACIO PARA LO QUE VIENE.</span>
      <nav aria-label="Navegación móvil">
        {links.map((link, i) => (
          <motion.div
            key={link.href}
            initial={reduced ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: reduced ? 0 : 0.08 + i * 0.06,
              duration: reduced ? 0 : motionTiming.normal,
              ease: editorialEase,
            }}
          >
            <Link key={link.href} href={link.href} onClick={onNavigate}>
              <span>0{i + 1}</span>
              {link.title}
              <ArrowUpRight size={24} />
            </Link>
          </motion.div>
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
    </motion.div>
  );
}
