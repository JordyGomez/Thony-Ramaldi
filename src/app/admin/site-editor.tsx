"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  Monitor,
  Smartphone,
} from "lucide-react";
import {
  parseSiteSettings,
  sectionNames,
  defaultSettings,
  type TextKey,
} from "@/lib/site-settings";
import type { EditorState } from "@/lib/admin-site";
import { textGroups } from "./site-fields";
import { ImageSetting } from "./media-library";
import styles from "./admin.module.css";

export function SiteEditor({ initial }: { initial: EditorState }) {
  const [settings, setSettings] = useState(initial.settings);
  const [saved, setSaved] = useState(JSON.stringify(initial.settings));
  const [revision, setRevision] = useState(initial.revision);
  const [published, setPublished] = useState(initial.publishedRevision);
  const [publishedAt, setPublishedAt] = useState(initial.publishedAt);
  const [history, setHistory] = useState(initial.history);
  const [tab, setTab] = useState("contenido");
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const dirty = JSON.stringify(settings) !== saved;
  const tabs = [
    { id: "contenido", label: "Textos y contacto" },
    { id: "imagenes", label: "Imágenes y logo" },
    { id: "secciones", label: "Secciones y orden" },
    { id: "apariencia", label: "Marca y presentación" },
    { id: "historial", label: "Historial" },
  ];
  const changeText = (key: TextKey, value: string) =>
    setSettings((previous) => ({
      ...previous,
      texts: { ...previous.texts, [key]: value },
    }));
  const sendPreview = () =>
    frame.current?.contentWindow?.postMessage(
      { type: "thony-site-preview", settings },
      window.location.origin,
    );
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        frame.current?.contentWindow?.postMessage(
          { type: "thony-site-preview", settings },
          window.location.origin,
        ),
      150,
    );
    return () => clearTimeout(timer);
  }, [settings, showPreview]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const save = async (publish: boolean) => {
    setError("");
    setMessage("");
    let checked;
    try {
      checked = parseSiteSettings(settings);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Revisa los campos.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: checked, revision, publish }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error);
      if (publish)
        setHistory((previous) =>
          [
            {
              revision: published,
              published_at: publishedAt || new Date().toISOString(),
            },
            ...previous,
          ].slice(0, 10),
        );
      setRevision(result.revision);
      setPublished(result.publishedRevision);
      setPublishedAt(result.publishedAt);
      setSettings(checked);
      setSaved(JSON.stringify(checked));
      setMessage(result.message);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar. Tu edición sigue aquí.",
      );
    } finally {
      setBusy(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(settings, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "thony-contenido.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  const reload = async () => {
    if (
      dirty &&
      !window.confirm(
        "Tienes cambios sin guardar. Descarga una copia antes de reemplazarlos. ¿Recargar la versión guardada?",
      )
    )
      return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/site", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error);
      setSettings(result.settings);
      setSaved(JSON.stringify(result.settings));
      setRevision(result.revision);
      setPublished(result.publishedRevision);
      setPublishedAt(result.publishedAt);
      setHistory(result.history);
      setError("");
      setMessage("Versión guardada cargada.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo recargar.");
    } finally {
      setBusy(false);
    }
  };
  const restore = async (version: number) => {
    if (
      dirty &&
      !window.confirm(
        "Cargar esta versión reemplazará tu edición sin guardar. ¿Continuar?",
      )
    )
      return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/site?revision=${version}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error);
      setSettings(result.settings);
      setMessage(
        `Versión ${version} cargada para revisar. Guárdala o publícala cuando esté lista.`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la versión.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      {!initial.installed && (
        <div className={styles.notice} role="status">
          <strong>Activa el guardado del editor.</strong>
          <p>
            Puedes editar y previsualizar aquí. Para guardar borradores y
            publicar, instala la ampliación del panel desde{" "}
            <Link className={styles.linkButton} href="/admin/configuracion">
              Configuración
            </Link>
            .
          </p>
        </div>
      )}
      <div className={styles.editorToolbar}>
        <div>
          <span className="label">Tu web · versión publicada {published}</span>
          <p>{dirty ? "Tienes cambios sin guardar" : "Borrador al día"}</p>
        </div>
        <div className={styles.editorActions}>
          <button
            type="button"
            className="button"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={16} aria-hidden="true" />
            {showPreview ? "Cerrar vista previa" : "Vista previa en vivo"}
          </button>
          <button
            type="button"
            className="button"
            disabled={busy || uploads > 0 || !initial.installed}
            onClick={() => void save(false)}
          >
            {busy ? "Guardando…" : "Guardar borrador"}
          </button>
          <button
            type="button"
            className="button button-solid"
            disabled={busy || uploads > 0 || !initial.installed}
            onClick={() => void save(true)}
          >
            Publicar cambios
          </button>
        </div>
      </div>
      {error && (
        <p className={`${styles.notice} ${styles.error}`} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className={`${styles.notice} ${styles.success}`} role="status">
          {message}
        </p>
      )}
      {showPreview && (
        <section
          className={styles.previewPanel}
          aria-label="Vista previa de la web"
        >
          <div className={styles.previewToolbar}>
            <span>Vista previa · cambios sin publicar</span>
            <button
              type="button"
              aria-pressed={!mobile}
              onClick={() => setMobile(false)}
            >
              <Monitor size={16} /> Escritorio
            </button>
            <button
              type="button"
              aria-pressed={mobile}
              onClick={() => setMobile(true)}
            >
              <Smartphone size={16} /> Móvil
            </button>
          </div>
          <iframe
            ref={frame}
            src="/admin/vista-previa"
            title="Vista previa privada de la web"
            onLoad={sendPreview}
            style={{ maxWidth: mobile ? 390 : "100%" }}
          />
        </section>
      )}
      <nav className={styles.editorTabs} aria-label="Apartados del editor">
        {tabs.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <fieldset className={styles.editorBody} disabled={busy}>
        {tab === "contenido" && (
          <div className={styles.form}>
            {textGroups.map((group) => (
              <details
                className={styles.editorGroup}
                key={group.title}
                open={group.title === "Portada"}
              >
                <summary>{group.title}</summary>
                <div className={styles.grid2}>
                  {group.fields.map(([key, label]) => (
                    <label className={styles.field} key={key}>
                      {label}
                      {/description|intro$|Message|Text$|Disclaimer/i.test(
                        key,
                      ) ? (
                        <textarea
                          value={settings.texts[key]}
                          maxLength={
                            key === "intro" || key === "aboutDescription"
                              ? 4000
                              : 600
                          }
                          rows={4}
                          onChange={(event) =>
                            changeText(key, event.target.value)
                          }
                        />
                      ) : (
                        <input
                          type={
                            key === "email"
                              ? "email"
                              : key === "instagram"
                                ? "url"
                                : "text"
                          }
                          value={settings.texts[key]}
                          maxLength={600}
                          onChange={(event) =>
                            changeText(key, event.target.value)
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>
              </details>
            ))}
            <fieldset className={styles.fieldset}>
              <legend>Forma de acompañar</legend>
              {settings.steps.map((step, index) => (
                <div className={styles.grid2} key={index}>
                  <label className={styles.field}>
                    Paso {index + 1}: título
                    <input
                      value={step.title}
                      maxLength={80}
                      onChange={(event) =>
                        setSettings((previous) => ({
                          ...previous,
                          steps: previous.steps.map((item, i) =>
                            i === index
                              ? { ...item, title: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                  </label>
                  <label className={styles.field}>
                    Paso {index + 1}: descripción
                    <input
                      value={step.detail}
                      maxLength={300}
                      onChange={(event) =>
                        setSettings((previous) => ({
                          ...previous,
                          steps: previous.steps.map((item, i) =>
                            i === index
                              ? { ...item, detail: event.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.linkButton}
                    disabled={settings.steps.length === 1}
                    onClick={() =>
                      setSettings((previous) => ({
                        ...previous,
                        steps: previous.steps.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Quitar paso {index + 1}
                  </button>
                </div>
              ))}
              <button
                className={styles.linkButton}
                type="button"
                disabled={settings.steps.length >= 6}
                onClick={() =>
                  setSettings((previous) => ({
                    ...previous,
                    steps: [
                      ...previous.steps,
                      { title: "Nuevo paso", detail: "" },
                    ],
                  }))
                }
              >
                Añadir paso
              </button>
            </fieldset>
          </div>
        )}
        {tab === "imagenes" && (
          <div className={styles.form}>
            <p className={styles.hint}>
              La foto del pie aparece cuando hay una propiedad publicada con
              fotografías. Sin una selección propia se usa la primera foto de
              esa propiedad; las demostraciones y los renders se excluyen.
            </p>
            {(
              [
                ["hero", "Foto de portada"],
                ["portrait", "Retrato"],
                ["footer", "Foto del pie"],
                ["logo", "Logo original"],
                ["social", "Imagen al compartir"],
              ] as const
            ).map(([key, label]) => (
              <ImageSetting
                key={key}
                label={label}
                value={settings.assets[key]}
                optional={key === "logo" || key === "social" || key === "footer"}
                onBusyChange={(value) =>
                  setUploads((count) => count + (value ? 1 : -1))
                }
                onChange={(url) =>
                  setSettings((previous) => ({
                    ...previous,
                    assets: { ...previous.assets, [key]: url },
                  }))
                }
              />
            ))}
          </div>
        )}
        {tab === "secciones" && (
          <div className={styles.form}>
            <p className={styles.hint}>
              Activa, oculta y ordena cada bloque. La portada se mantiene al
              principio; el menú se adapta a las secciones visibles. Alberobello
              y el carrusel aparecen cuando tienen propiedades publicadas.
            </p>
            <ol className={styles.sectionOrder}>
              {settings.sections.map((section, index) => (
                <li key={section.id}>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={section.visible}
                      onChange={(event) =>
                        setSettings((previous) => ({
                          ...previous,
                          sections: previous.sections.map((item) =>
                            item.id === section.id
                              ? { ...item, visible: event.target.checked }
                              : item,
                          ),
                        }))
                      }
                    />
                    <span>{sectionNames[section.id]}</span>
                  </label>
                  <div className={styles.photoTools}>
                    {([-1, 1] as const).map((offset) => (
                      <button
                        type="button"
                        key={offset}
                        aria-label={`${offset === -1 ? "Subir" : "Bajar"} ${sectionNames[section.id]}`}
                        disabled={
                          index + offset < 0 ||
                          index + offset >= settings.sections.length
                        }
                        onClick={() =>
                          setSettings((previous) => {
                            const sections = [...previous.sections];
                            [sections[index], sections[index + offset]] = [
                              sections[index + offset],
                              sections[index],
                            ];
                            return { ...previous, sections };
                          })
                        }
                      >
                        {offset === -1 ? (
                          <ArrowUp size={17} />
                        ) : (
                          <ArrowDown size={17} />
                        )}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        {tab === "apariencia" && (
          <div className={styles.form}>
            <fieldset className={styles.fieldset}>
              <legend>Paleta sobre el diseño de Claude</legend>
              <p className={styles.hint}>
                Mantén un fondo oscuro y colores claros para los textos. El
                panel comprueba el contraste al guardar.
              </p>
              <div className={styles.grid2}>
                {(
                  [
                    ["background", "Fondo"],
                    ["text", "Texto"],
                    ["accent", "Acentos de marca"],
                  ] as const
                ).map(([key, label]) => (
                  <label className={styles.field} key={key}>
                    {label}
                    <input
                      type="color"
                      value={settings.theme[key]}
                      onChange={(event) =>
                        setSettings((previous) => ({
                          ...previous,
                          theme: {
                            ...previous.theme,
                            [key]: event.target.value,
                          },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className={styles.fieldset}>
              <legend>Experiencia y publicación</legend>
              <p className={styles.hint}>
                Presentación estática, sin introducción ni efectos de movimiento.
                El menú, los filtros y la galería responden de inmediato.
              </p>
              {(
                [
                  ["floatingContact", "Botón flotante de WhatsApp"],
                  ["footer", "Pie de página"],
                  ["indexable", "Permitir indexación de la web en buscadores"],
                ] as const
              ).map(([key, label]) => (
                <label className={styles.check} key={key}>
                  <input
                    type="checkbox"
                    checked={settings.experience[key]}
                    onChange={(event) =>
                      setSettings((previous) => ({
                        ...previous,
                        experience: {
                          ...previous.experience,
                          [key]: event.target.checked,
                        },
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                if (
                  window.confirm(
                    "¿Cargar la paleta y las animaciones originales? Los textos y las fotos se conservan.",
                  )
                )
                  setSettings((previous) => ({
                    ...previous,
                    theme: defaultSettings.theme,
                    experience: defaultSettings.experience,
                  }));
              }}
            >
              Recuperar paleta y animaciones originales
            </button>
          </div>
        )}
        {tab === "historial" && (
          <div className={styles.form}>
            <p>
              Las publicaciones anteriores se guardan para poder recuperarlas.
              Cargar una versión permite revisarla antes de volver a publicarla.
            </p>
            {history.length ? (
              history.map((item) => (
                <div className={styles.historyRow} key={item.revision}>
                  <span>
                    Versión {item.revision} ·{" "}
                    {new Intl.DateTimeFormat("es-DO", {
                      dateStyle: "medium",
                      timeZone: "America/Santo_Domingo",
                    }).format(new Date(item.published_at))}
                  </span>
                  <button
                    className="button"
                    type="button"
                    onClick={() => void restore(item.revision)}
                  >
                    Cargar versión {item.revision}
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.hint}>
                El historial aparecerá después de publicar cambios.
              </p>
            )}
            <button type="button" className="button" onClick={download}>
              <Download size={16} /> Descargar copia de mi edición
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => void reload()}
            >
              Recargar versión guardada
            </button>
            <a
              href="/admin/vista-previa"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkButton}
            >
              Abrir el borrador guardado en otra pestaña
            </a>
          </div>
        )}
      </fieldset>
    </div>
  );
}
