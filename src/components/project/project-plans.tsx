"use client";
import Image from "next/image";
import { useState } from "react";
import type { Property } from "@/data/properties";
import styles from "./project.module.css";
export function ProjectPlans({ images }: { images: Property["images"] }) {
  const plans = images.filter((i) => /plano (isométrico|general)/i.test(i.alt));
  const [selected, setSelected] = useState(0),
    [angle, setAngle] = useState(-5);
  if (!plans.length) return null;
  const active = plans[Math.min(selected, plans.length - 1)];
  return (
    <section
      className={styles.section}
      id="planos"
      aria-labelledby="plans-title"
    >
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Otra forma de verlo</p>
          <h2 id="plans-title">El espacio, en perspectiva.</h2>
        </div>
        <p>
          Explora los planos facilitados del proyecto. Thony confirma la
          distribución que corresponde a cada unidad.
        </p>
      </div>
      <div className={styles.planLayout}>
        <div className={styles.planSurface}>
          <div
            className={styles.planBoard}
            style={{ transform: `rotateX(4deg) rotateY(${angle}deg)` }}
          >
            <Image
              src={active.src}
              alt={active.alt}
              fill
              sizes="(max-width: 800px) 94vw, 70vw"
              className={styles.planImage}
              unoptimized
            />
          </div>
          <span className={styles.planCaption}>
            RENDER DEL PROYECTO · VISTA ISOMÉTRICA / PLANO
          </span>
        </div>
        <div className={styles.planTools}>
          <p className={styles.eyebrow}>Explorar planos</p>
          <div className={styles.planTabs} aria-label="Planos del proyecto">
            {plans.map((p, i) => (
              <button
                type="button"
                key={p.alt}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                {p.alt.includes("Tipo A")
                  ? "Isométrico A"
                  : p.alt.includes("Tipo B")
                    ? "Isométrico B"
                    : "Plano general"}
              </button>
            ))}
          </div>
          <label className={styles.range}>
            Perspectiva del plano
            <input
              type="range"
              min={-8}
              max={8}
              step={1}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => setAngle(0)}
          >
            Vista frontal
          </button>
          <p className={styles.muted}>
            Es una presentación de los renders originales. No es un recorrido
            virtual ni un modelo 3D navegable del inmueble.
          </p>
        </div>
      </div>
    </section>
  );
}
