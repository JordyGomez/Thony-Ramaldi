"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import type { Property } from "@/data/properties";
import { useSite } from "./site-provider";
import { Reveal } from "./reveal";
const formatBudget = (value: string) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

export function PersonalSearch({ properties }: { properties: Property[] }) {
  const { settings, whatsappUrl } = useSite();
  const t = settings.texts;
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState("Vivir");
  const [zone, setZone] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [timing, setTiming] = useState("Estoy explorando");
  const heading = useRef<HTMLHeadingElement>(null);
  const locations = [
    ...new Set(
      properties
        .filter((property) => !property.demo)
        .map((property) => property.location),
    ),
  ];
  const move = (next: number) => {
    setStep(next);
    requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
  };
  const operation = purpose === "Alquilar" ? "Alquiler" : "Venta";
  const matches = properties
    .filter(
      (property) =>
        !property.demo &&
        property.operation === operation &&
        (!zone.trim() ||
          `${property.location} ${property.neighborhood}`
            .toLocaleLowerCase("es")
            .includes(zone.trim().toLocaleLowerCase("es"))) &&
        (!budget ||
          (!property.priceProvisional && property.price <= Number(budget))),
    )
    .slice(0, 3);
  const brief = `Hola ${t.name.split(" ")[0]}, preparé mi búsqueda en tu página.\n\nQuiero: ${purpose.toLowerCase()}.\nZona: ${zone.trim() || "por definir"}.\nPresupuesto: ${budget ? `hasta USD ${formatBudget(budget)}${operation === "Alquiler" ? " al mes" : ""}` : "por conversar"}.\nPlazo: ${timing.toLowerCase()}.\n\nMe gustaría revisar opciones y próximos pasos contigo.`;
  const share = `https://wa.me/${t.whatsapp}?text=${encodeURIComponent(brief)}`;
  return (
    <section
      className="personal-search section-pad"
      id="mi-proximo-espacio"
      aria-labelledby="personal-search-title"
      data-stage={step}
      data-started={started}
    >
      <Reveal className="personal-search-copy">
        <p className="label">{t.name} · Una búsqueda personal</p>
        <h2 id="personal-search-title">{t.journeyTitle}</h2>
        <p>{t.journeyDescription}</p>
        {!started && (
          <button
            className="button"
            type="button"
            onClick={() => {
              setStarted(true);
              move(0);
            }}
          >
            {t.journeyCta} <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        )}
        <noscript>
          <style>{`.personal-search button { display: none; }`}</style>
          <a
            className="button"
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Conversar con Thony <ArrowUpRight size={16} />
          </a>
        </noscript>
      </Reveal>
      <div className="search-scene">
        <div className="search-stack" aria-hidden="true">
          <span />
          <span />
          <div className="search-plan">
            <i />
            <i />
            <i />
            <i />
            <b>
              {t.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </b>
            <small>TU PRÓXIMO CAPÍTULO</small>
          </div>
        </div>
        {started ? (
          <div className="search-card" key={step}>
            <p className="search-progress label" aria-live="polite">
              Tu búsqueda · 0{step + 1} / 03
            </p>
            <h3 ref={heading} tabIndex={-1}>
              {
                [
                  "¿Qué te trae hasta aquí?",
                  "Démosle un lugar a tu idea.",
                  "Tu próximo paso, a tu ritmo.",
                ][step]
              }
            </h3>
            {step === 0 && (
              <fieldset className="search-choices">
                <legend>Quiero encontrar un espacio para</legend>
                {["Vivir", "Invertir", "Alquilar"].map((value, index) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="search-purpose"
                      aria-label={value}
                      value={value}
                      checked={purpose === value}
                      onChange={() => setPurpose(value)}
                    />
                    <span>
                      <small aria-hidden="true">0{index + 1}</small>
                      {value}
                      <Check size={17} aria-hidden="true" />
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {step === 1 && (
              <div className="search-fields">
                <label>
                  Ciudad o zona
                  <input
                    value={zone}
                    maxLength={120}
                    onChange={(event) => setZone(event.target.value)}
                    list="search-zones"
                    placeholder="Podemos definirla juntos"
                  />
                </label>
                <datalist id="search-zones">
                  {locations.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
                <label>
                  Presupuesto máximo en USD
                  {operation === "Alquiler" ? " / mes" : ""}
                  <input
                    type="number"
                    min="0"
                    max="1000000000"
                    inputMode="decimal"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    aria-invalid={Boolean(budgetError)}
                    aria-describedby={
                      budgetError ? "search-budget-error" : undefined
                    }
                    placeholder="Opcional"
                  />
                  {budgetError && (
                    <span id="search-budget-error" role="alert">
                      {budgetError}
                    </span>
                  )}
                </label>
              </div>
            )}
            {step === 2 && (
              <>
                <div className="search-fields">
                  <label>
                    ¿Cuándo te gustaría dar el paso?
                    <select
                      value={timing}
                      onChange={(event) => setTiming(event.target.value)}
                    >
                      {[
                        "Estoy explorando",
                        "Lo antes posible",
                        "En los próximos tres meses",
                        "Más adelante",
                      ].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <dl className="search-summary">
                  <div>
                    <dt>Tu intención</dt>
                    <dd>{purpose}</dd>
                  </div>
                  <div>
                    <dt>Tu lugar</dt>
                    <dd>{zone || "Lo definimos juntos"}</dd>
                  </div>
                  <div>
                    <dt>Tu presupuesto</dt>
                    <dd>
                      {budget
                        ? `USD ${formatBudget(budget)}${operation === "Alquiler" ? " / mes" : ""}`
                        : "Lo conversamos"}
                    </dd>
                  </div>
                </dl>
                <p className="search-privacy">
                  La búsqueda se envía cuando abras WhatsApp y confirmes el
                  mensaje.
                </p>
              </>
            )}
            <div className="search-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="link-arrow"
                  onClick={() => move(step - 1)}
                >
                  <ArrowLeft size={16} aria-hidden="true" /> Atrás
                </button>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    if (
                      step === 1 &&
                      budget &&
                      (!Number.isFinite(Number(budget)) ||
                        Number(budget) < 0 ||
                        Number(budget) > 1000000000)
                    ) {
                      setBudgetError(
                        "Escribe un presupuesto válido o deja este campo vacío.",
                      );
                      return;
                    }
                    setBudgetError("");
                    move(step + 1);
                  }}
                >
                  Continuar <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <a
                  className="button"
                  href={share}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.journeySend} <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              )}
            </div>
            {step === 2 && matches.length > 0 && (
              <div className="search-matches">
                <p className="label">Para empezar a explorar</p>
                {matches.map((property) => (
                  <Link
                    key={property.slug}
                    href={`/propiedades/${property.slug}`}
                  >
                    {property.title}{" "}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="search-card search-invitation" aria-hidden="true">
            <span className="label">Tu idea, el punto de partida.</span>
            <p>
              Una intención.
              <br />
              Un lugar.
              <br />
              <strong>Tu próximo espacio.</strong>
            </p>
            <span>01 — 02 — 03</span>
          </div>
        )}
      </div>
    </section>
  );
}
