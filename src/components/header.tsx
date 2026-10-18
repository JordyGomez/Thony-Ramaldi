"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useSite, useExperienceReducedMotion } from "./site-provider";
import { navigation } from "@/lib/site-settings";
import { editorialEase, motionTiming } from "@/lib/motion";
import styles from "./header.module.css";

const subscribeScroll = (callback: () => void) => {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
};
const scrollSnapshot = () => window.scrollY > 40;
const serverSnapshot = () => false;

function MenuPanel({
  menu,
  close,
}: {
  menu: React.RefObject<HTMLDivElement | null>;
  close: () => void;
}) {
  const { settings, whatsappUrl } = useSite();
  const links = navigation(settings);
  const present = useIsPresent();
  const reduced = useExperienceReducedMotion();
  return (
    <motion.div
      ref={menu}
      id="mobile-navigation"
      className="mobile-navigation"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: editorialEase }}
      inert={!present}
      aria-hidden={present ? undefined : true}
    >
      <motion.nav
        aria-label="Navegación móvil"
        initial={reduced ? false : "closed"}
        animate="open"
        variants={{
          open: { transition: { staggerChildren: motionTiming.stagger } },
          closed: {},
        }}
      >
        {links.map((link, i) => (
          <motion.div
            key={link.href}
            variants={{
              closed: {
                opacity: 0,
                y: 24,
                rotateX: -28,
                transformPerspective: 1000,
              },
              open: {
                opacity: 1,
                y: 0,
                rotateX: 0,
                transformPerspective: 1000,
              },
            }}
            transition={{
              duration: reduced ? 0 : motionTiming.normal,
              ease: editorialEase,
            }}
          >
            <Link href={link.href} onClick={close}>
              <span>0{i + 1}</span>
              {link.title}
            </Link>
          </motion.div>
        ))}
      </motion.nav>
      <div className="menu-footer">
        <p>{settings.texts.menuText}</p>
        <a
          href={whatsappUrl()}
          className="button"
          target="_blank"
          rel="noopener noreferrer"
        >
          {settings.texts.menuCta} <ArrowUpRight size={16} strokeWidth={1.5} />
        </a>
      </div>
    </motion.div>
  );
}

export function Header() {
  const { settings, contact: site } = useSite();
  const links = navigation(settings);
  const [open, setOpen] = useState(false);
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
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
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
      background.forEach(({ element, inert }) => {
        element.inert = inert;
      });
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
        aria-label={`${site.name} ${site.company}, inicio`}
        onClick={() => setOpen(false)}
      >
        {site.logo && (
          <Image src={site.logo} alt="Ramaldi" width={100} height={38} />
        )}
        <span className="brand-name">{site.name}</span>{" "}
        <span className="brand-sub">{site.company}</span>
      </Link>
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
      <AnimatePresence>
        {open && <MenuPanel menu={menu} close={() => setOpen(false)} />}
      </AnimatePresence>
      <noscript className={styles.fallback}>
        <style>{`.site-header > noscript { display: contents; } .site-header { position: absolute; height: auto; min-height: var(--header-h); flex-wrap: wrap; gap: 16px; padding-block: 24px; background: var(--bg-deep); } .site-header .menu-toggle { display: none; }`}</style>
        <nav className={styles.plainNav} aria-label="Navegación sin JavaScript">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.title}
            </Link>
          ))}
        </nav>
      </noscript>
    </header>
  );
}
