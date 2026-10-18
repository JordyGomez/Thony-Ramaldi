"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  motion,
  useAnimationControls,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowDown, ArrowDownRight, ArrowUpRight } from "lucide-react";
import heroImage from "../../public/images/hero.jpg";
import { whatsappUrl } from "@/lib/site";
import { editorialEase, entryEvents } from "@/lib/motion";
import styles from "./hero.module.css";

const desktopQuery = "(min-width: 900px) and (pointer: fine)";
const desktopSnapshot = () => window.matchMedia(desktopQuery).matches;
const serverSnapshot = () => false;
const subscribeDesktop = (callback: () => void) => {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const controls = useAnimationControls();
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    desktopSnapshot,
    serverSnapshot,
  );
  const inView = useInView(section, { margin: "50px" });
  const y = useMotionValue(0);
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    // No se actualiza la imagen fuera de pantalla ni en dispositivos táctiles.
    if (!reduced && desktop && inView)
      y.set(Math.min(1, Math.max(0, progress)) * 42);
  });

  useEffect(() => {
    if (reduced) {
      controls.set("visible");
      return;
    }
    const start = () => controls.set("waiting");
    const reveal = () => {
      void controls.start("visible");
    };
    window.addEventListener(entryEvents.start, start);
    window.addEventListener(entryEvents.reveal, reveal);
    const frame = requestAnimationFrame(() => {
      if (document.documentElement.dataset.thonyEntry !== "opening") reveal();
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(entryEvents.start, start);
      window.removeEventListener(entryEvents.reveal, reveal);
    };
  }, [controls, reduced]);

  const line = {
    waiting: { opacity: 0, y: 34 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.85, delay: index * 0.12, ease: editorialEase },
    }),
  };

  return (
    <section
      ref={section}
      className={`hero ${styles.hero}`}
      id="inicio"
      aria-labelledby="hero-title"
    >
      <div className={`hero-image-frame ${styles.imageFrame}`}>
        <motion.div
          className={styles.photograph}
          style={!reduced && desktop ? { y } : undefined}
        >
          <Image
            src={heroImage}
            alt="Residencia con piscina, fotografía ilustrativa de inspiración"
            fill
            sizes="100vw"
            preload
            className="hero-image"
          />
        </motion.div>
        <div className={`hero-image-shade ${styles.shade}`} />
      </div>
      <div className="hero-overline">
        <span>
          <i /> REAL ESTATE, CON UN ENFOQUE PERSONAL.
        </span>
        <span>
          REPÚBLICA DOMINICANA{" "}
          <span className="tiny-star" aria-hidden="true">
            ✳
          </span>
        </span>
      </div>
      <div className="hero-intro">
        <div className={styles.headingBlock}>
          <span className={styles.kicker}>HAY UN LUGAR PARA LO QUE VIENE.</span>
          <h1 id="hero-title">
            <motion.span
              initial={false}
              animate={controls}
              variants={line}
              custom={0}
            >
              Tu próximo espacio.
            </motion.span>
            <motion.em
              initial={false}
              animate={controls}
              variants={line}
              custom={1}
            >
              Tu próxima historia.
            </motion.em>
          </h1>
        </div>
        <motion.div
          className="hero-copy"
          initial={false}
          animate={controls}
          variants={line}
          custom={2}
        >
          <p>
            Encuentra el lugar para vivir o invertir con el acompañamiento de
            Thony Paulino, asesor inmobiliario de Ramaldi.
          </p>
          <div className={styles.actions}>
            <a href="#propiedades" className={`button ${styles.primary}`}>
              Explorar propiedades <ArrowDownRight size={20} />
            </a>
            <a
              href={whatsappUrl()}
              className={`button ${styles.secondary}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hablar con Thony <ArrowUpRight size={18} />
            </a>
          </div>
        </motion.div>
      </div>
      <div className={styles.bottom}>
        <div className={styles.signature}>
          <span>THONY PAULINO</span>
          <small>ASESOR INMOBILIARIO · RAMALDI</small>
        </div>
        <span className="hero-image-note">FOTOGRAFÍA ILUSTRATIVA</span>
        <a href="#propiedades" className={styles.scroll}>
          DESCUBRE TU PRÓXIMO LUGAR{" "}
          <span>
            <ArrowDown size={18} />
          </span>
        </a>
      </div>
      <div className="hero-bottom">
        <span>ASESORÍA INMOBILIARIA PERSONAL</span>
        <span className="hero-bottom-center">
          Un espacio para cada nueva etapa.
        </span>
        <span>
          REPÚBLICA DOMINICANA <ArrowDown size={14} />
        </span>
      </div>
    </section>
  );
}
