"use client";
import { useState, type ReactNode, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  corporateDefaults,
  type CorporateSettings,
  type PublicAgent,
} from "@/lib/platform";
import type { PropertyRow } from "@/data/property-row";
import { rowToProperty } from "@/data/property-row";
import { storagePublicUrl } from "@/lib/supabase/env";
import { formatPrice } from "@/data/properties";
import { Gallery } from "./gallery";
import styles from "./corporate-portal.module.css";

export function CorporateFrame({
  settings,
  children,
  registration = false,
  preview = false,
}: {
  settings: CorporateSettings;
  children: ReactNode;
  registration?: boolean;
  preview?: boolean;
}) {
  const link = (href: string) =>
    preview
      ? `/admin/plataforma/vista-previa/contenido${href === "/" ? "" : href}`
      : href;
  return (
    <div
      className={styles.frame}
      data-platform-mode="ramaldi"
      data-motion="off"
      style={
        {
          "--bg": settings.background,
          "--text": settings.text,
          "--accent": settings.accent,
          "--muted": `color-mix(in srgb,${settings.text},${settings.background} 30%)`,
          "--bg-raised": `color-mix(in srgb,${settings.background},white 5%)`,
          "--line": "#ffffff30",
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      {preview && (
        <aside className={styles.preview}>
          Vista previa privada · La identidad pública se gestiona por separado y
          requiere activación autorizada.{" "}
          <Link href="/admin/plataforma">Volver a configuración</Link>
        </aside>
      )}
      <header className={styles.header}>
        <Link className={styles.brand} href={link("/")}>
          {settings.logo && (
            <Image
              unoptimized
              width={110}
              height={45}
              src={storagePublicUrl(settings.logo)}
              alt=""
            />
          )}
          {settings.name}
        </Link>
        <nav className={styles.nav} aria-label="Navegación empresarial">
          <Link href={link("/")}>{settings.navHome}</Link>
          <Link href={`${link("/")}#propiedades`}>
            {settings.navProperties}
          </Link>
          <Link href={link("/asesores")}>{settings.navAgents}</Link>
          <Link href={`${link("/")}#contacto`}>{settings.navContact}</Link>
          {!preview && (
            <>
              <Link href="/admin/login">{settings.navEmployees}</Link>
              {registration && (
                <Link href="/admin/registro">{settings.navRegister}</Link>
              )}
            </>
          )}
        </nav>
      </header>
      {children}
      <footer className={styles.footer}>
        <span>
          © {new Date().getFullYear()} {settings.name}
        </span>
        <span>Precios y disponibilidad sujetos a confirmación.</span>
      </footer>
    </div>
  );
}
export function CorporateHome({
  settings,
  properties,
  agents,
  preview = false,
}: {
  settings: CorporateSettings;
  properties: PropertyRow[];
  agents: PublicAgent[];
  preview?: boolean;
}) {
  return (
    <main id="contenido">
      <section className={styles.hero}>
        {settings.hero && (
          <Image
            unoptimized
            src={storagePublicUrl(settings.hero)}
            alt={
              settings.headline || "Portada empresarial pendiente de aprobación"
            }
            fill
            priority
          />
        )}
        <h1>
          {settings.headline ||
            "Presentación empresarial pendiente de aprobación"}
        </h1>
      </section>
      <section className={styles.section}>
        <h2>{settings.name || corporateDefaults.name}</h2>
        <p>
          {settings.description ||
            "La información corporativa se incorporará después de su revisión y autorización."}
        </p>
        {settings.services.length > 0 && (
          <ul className={styles.contacts}>
            {settings.services.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
      </section>
      <section className={styles.section} id="propiedades">
        <h2>Propiedades</h2>
        <CorporateCatalog
          properties={properties}
          agents={agents}
          preview={preview}
        />
      </section>
      <section className={styles.section}>
        <h2>Nuestros asesores</h2>
        <AgentDirectory agents={agents} preview={preview} />
      </section>
      <section className={styles.section} id="contacto">
        <h2>Contacto</h2>
        <CorporateContact contact={settings} />
        {settings.address && <p>{settings.address}</p>}
      </section>
    </main>
  );
}
function CorporateContact({
  contact,
}: {
  contact: { email: string; phone: string; whatsapp: string };
}) {
  if (!contact.email && !contact.phone && !contact.whatsapp)
    return (
      <p className={styles.empty}>
        Los contactos empresariales están pendientes de aprobación.
      </p>
    );
  return (
    <div className={styles.contacts}>
      {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
      {contact.phone && <a href={`tel:+${contact.phone}`}>+{contact.phone}</a>}
      {contact.whatsapp && (
        <a
          href={`https://wa.me/${contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Consultar por WhatsApp ↗
        </a>
      )}
    </div>
  );
}
export function AgentDirectory({
  agents,
  preview = false,
}: {
  agents: PublicAgent[];
  preview?: boolean;
}) {
  if (!agents.length)
    return (
      <p className={styles.empty}>
        Todavía no hay perfiles profesionales publicados. Aquí aparecerán los
        asesores autorizados cuando sus perfiles sean aprobados.
      </p>
    );
  return (
    <div className={styles.grid}>
      {agents.map((a) => (
        <article className={styles.card} key={a.userId}>
          <Link
            href={`${preview ? "/admin/plataforma/vista-previa/contenido" : ""}/asesores/${a.slug}`}
          >
            <div className={styles.photo}>
              {a.content.photo && (
                <Image
                  unoptimized
                  src={storagePublicUrl(a.content.photo)}
                  alt={a.content.name}
                  fill
                  sizes="400px"
                />
              )}
            </div>
            <h3>{a.content.name}</h3>
          </Link>
          <p className={styles.meta}>{a.content.role}</p>
        </article>
      ))}
    </div>
  );
}
export function CorporateCatalog({
  properties,
  agents,
  preview = false,
}: {
  properties: PropertyRow[];
  agents: PublicAgent[];
  preview?: boolean;
}) {
  const [operation, setOperation] = useState("");
  const [location, setLocation] = useState("");
  const [agent, setAgent] = useState("");
  const rows = properties.filter(
    (p) =>
      (!operation || p.operation === operation) &&
      (!location || p.location === location) &&
      (!agent || p.agent_id === agent),
  );
  if (!properties.length)
    return (
      <p className={styles.empty}>
        El catálogo se publicará cuando existan inmuebles con datos, fotografías
        y aprobación verificadas.
      </p>
    );
  return (
    <>
      <div className={styles.filters}>
        <label>
          Operación
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
          >
            <option value="">Todas</option>
            <option>Venta</option>
            <option>Alquiler</option>
          </select>
        </label>
        <label>
          Ubicación
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Todas</option>
            {[...new Set(properties.map((p) => p.location))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Asesor
          <select value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="">Todos</option>
            {agents.map((a) => (
              <option key={a.userId} value={a.userId}>
                {a.content.name}
              </option>
            ))}
          </select>
        </label>
        <p role="status">{rows.length} resultados</p>
      </div>
      <div className={styles.grid}>
        {rows.map((p) => {
          const advisor = agents.find((a) => a.userId === p.agent_id);
          return (
            <article key={p.id} className={styles.card}>
              <Link
                href={`${preview ? "/admin/plataforma/vista-previa/contenido" : ""}/propiedades/${p.slug}`}
              >
                <div className={styles.photo}>
                  {p.images[0] && (
                    <Image
                      unoptimized
                      src={storagePublicUrl(p.images[0].path)}
                      alt={p.images[0].alt}
                      fill
                      sizes="500px"
                    />
                  )}
                </div>
                <h3>{p.title}</h3>
              </Link>
              <p className={styles.meta}>
                {p.type} · {p.operation} · {p.location}
              </p>
              <p>
                USD {formatPrice(Number(p.price))}
                {p.operation === "Alquiler" ? " / mes" : ""}
              </p>
              {advisor && (
                <Link
                  href={`${preview ? "/admin/plataforma/vista-previa/contenido" : ""}/asesores/${advisor.slug}`}
                >
                  {advisor.content.name} ↗
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
export function CorporateAgent({
  agent,
  properties,
  agents,
  preview = false,
}: {
  agent: PublicAgent;
  properties: PropertyRow[];
  agents: PublicAgent[];
  preview?: boolean;
}) {
  const a = agent.content;
  return (
    <main id="contenido">
      <section className={styles.section}>
        <div className={styles.profile}>
          <div className={styles.photo}>
            {a.photo && (
              <Image
                unoptimized
                fill
                src={storagePublicUrl(a.photo)}
                alt={a.name}
                sizes="320px"
              />
            )}
          </div>
          <div>
            <span className="label">Asesor profesional</span>
            <h1>{a.name}</h1>
            <p>{a.role}</p>
            <p>{a.description}</p>
            {a.specialties && <p>{a.specialties}</p>}
            <CorporateContact contact={a} />
            {a.instagram && (
              <a href={a.instagram} target="_blank" rel="noopener noreferrer">
                Instagram ↗
              </a>
            )}
          </div>
        </div>
      </section>
      <section className={styles.section}>
        <h2>Propiedades de {a.name}</h2>
        <CorporateCatalog
          agents={agents}
          preview={preview}
          properties={properties.filter((p) => p.agent_id === agent.userId)}
        />
      </section>
    </main>
  );
}
export function CorporateProperty({
  property,
  agents,
  settings,
  preview = false,
}: {
  property: PropertyRow;
  agents: PublicAgent[];
  settings: CorporateSettings;
  preview?: boolean;
}) {
  const p = rowToProperty(property);
  const advisor = agents.find((a) => a.userId === property.agent_id);
  return (
    <main id="contenido">
      <Gallery
        images={p.images}
        kind={p.imagesAreRenders ? "project-render" : "photo"}
        projectName={p.projectName || p.title}
      />
      <section className={styles.section}>
        <Link
          href={`${preview ? "/admin/plataforma/vista-previa/contenido" : ""}/#propiedades`}
        >
          ← Volver al catálogo
        </Link>
        <h1>{p.title}</h1>
        <p>
          {p.location} · {p.type} · {p.operation} / {p.reference}
        </p>
        <h2>
          USD {formatPrice(p.price)}
          {p.operation === "Alquiler" ? " / mes" : ""}
        </h2>
        <p>{p.description}</p>
        <dl className={styles.contacts}>
          {[
            ["Habitaciones", p.bedrooms],
            ["Baños", p.bathrooms],
            ["Superficie", p.area === null ? null : `${p.area} m²`],
            ["Parqueos", p.parking],
          ]
            .filter(([, v]) => v !== null)
            .map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        <ul className={styles.contacts}>
          {p.amenities.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        {p.brochure && (
          <a href={p.brochure.href} target="_blank" rel="noopener noreferrer">
            {p.brochure.label} ↗
          </a>
        )}
        {property.public_documents?.map((d) => (
          <p key={d.path}>
            <a
              href={storagePublicUrl(d.path)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {d.label} ↗
            </a>
          </p>
        ))}
      </section>
      <section className={styles.section}>
        <h2>
          {advisor
            ? `Consulta con ${advisor.content.name}`
            : "Consulta profesional"}
        </h2>
        {advisor && (
          <Link
            href={`${preview ? "/admin/plataforma/vista-previa/contenido" : ""}/asesores/${advisor.slug}`}
          >
            Ver perfil profesional ↗
          </Link>
        )}
        <CorporateContact contact={advisor?.content || settings} />
      </section>
    </main>
  );
}
