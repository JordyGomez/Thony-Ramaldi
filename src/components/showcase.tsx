"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { listingStatus, type Property } from "@/data/properties";

export function Showcase({ properties }: { properties: Property[] }) {
  // Destacadas primero; el carrusel se desplaza también sin JavaScript.
  const ordered = [...properties].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  );
  const track = useRef<HTMLUListElement>(null);
  const move = (direction: 1 | -1) => {
    const element = track.current;
    if (!element) return;
    const card = element.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 20 : 400;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    element.scrollBy({
      left: step * direction,
      behavior: reduced.matches ? "auto" : "smooth",
    });
  };
  return (
    <section className="showcase" aria-labelledby="showcase-title">
      <div className="showcase-head">
        <h2 id="showcase-title" className="label">
          Selección
        </h2>
        <div className="showcase-controls">
          <button
            onClick={() => move(-1)}
            aria-label="Propiedades anteriores"
          >
            <ArrowLeft size={18} strokeWidth={1.25} />
          </button>
          <button onClick={() => move(1)} aria-label="Más propiedades">
            <ArrowRight size={18} strokeWidth={1.25} />
          </button>
          <Link href="#propiedades" className="link-arrow">
            Ver catálogo <ArrowRight size={16} strokeWidth={1.25} />
          </Link>
        </div>
      </div>
      <noscript><style>{`.showcase-controls button { display: none; }`}</style></noscript>
      <ul className="showcase-track" ref={track} tabIndex={0} aria-label="Carrusel de propiedades">
        {ordered.map((property) => (
          <li key={property.slug} className="showcase-card">
            <Link href={`/propiedades/${property.slug}`}>
              <span className="showcase-image">
                <Image
                  src={property.images[0].src}
                  alt={property.images[0].alt}
                  fill
                  sizes="(max-width: 620px) 78vw, (max-width: 1100px) 42vw, 26vw"
                />
              </span>
              <span className="showcase-title">{property.title}</span>
              <span className="showcase-meta">
                {property.location} ·{" "}
                {
                  {
                    demo: "Demostración",
                    preparation: `${property.operation} en preparación`,
                    available: `En ${property.operation.toLowerCase()}`,
                  }[listingStatus(property)]
                }
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
