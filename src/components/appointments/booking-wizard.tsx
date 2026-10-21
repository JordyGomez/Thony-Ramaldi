"use client";
import { useRef, useState } from "react";
import type { BookingProperty } from "@/data/get-booking-properties";
import {
  appointmentKinds,
  appointmentStatuses,
  operationalConsent,
  whatsappConsent,
  rdDate,
  rdTime,
  type AppointmentKind,
  type PublicAgenda,
  type Slot,
  type Booking,
  type AppointmentStatus,
} from "@/lib/appointments/types";
import { parseBooking } from "@/lib/appointments/validation";
import { AppointmentDatePicker } from "./date-picker";
import { BookingCaptcha } from "./captcha";
import styles from "./agenda.module.css";
type Receipt = {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  expiresAt: string;
  managementToken: string;
  message: string;
};
export function BookingWizard({
  config,
  properties,
  initialProperty,
  invalidProperty = false,
  siteKey,
}: {
  config: PublicAgenda;
  properties: BookingProperty[];
  initialProperty?: BookingProperty;
  invalidProperty?: boolean;
  siteKey: string;
}) {
  const [step, setStep] = useState(0),
    [kind, setKind] = useState<AppointmentKind>(
      initialProperty ? "property_visit" : "general",
    ),
    [propertyId, setPropertyId] = useState(initialProperty?.id || ""),
    [modality, setModality] = useState<"presencial" | "virtual">(
      config.modalities[0] || "presencial",
    );
  const [day, setDay] = useState(""),
    [slot, setSlot] = useState<Slot | null>(null),
    [draft, setDraft] = useState({
      name: "",
      phone: "",
      email: "",
      comments: "",
      communicationPreference: "email",
      operationalConsent: false,
      whatsappConsent: false,
    }),
    [booking, setBooking] = useState<Booking | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [captcha, setCaptcha] = useState(""),
    [captchaReset, setCaptchaReset] = useState(0),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [copied, setCopied] = useState(false);
  const operation = useRef(""),
    heading = useRef<HTMLHeadingElement>(null);
  const source = `/api/citas/disponibilidad?type=${kind}&modality=${modality}`;
  const selectedProperty = properties.find((p) => p.id === propertyId);
  const go = (next: number) => {
    setError("");
    setStep(next);
    setTimeout(() => heading.current?.focus(), 0);
  };
  const field = (key: keyof typeof draft, value: string | boolean) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const submit = async () => {
    if (!booking || !captcha || busy) return;
    setBusy(true);
    setError("");
    operation.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: operation.current,
          booking,
          captchaToken: captcha,
          website:
            document.querySelector<HTMLInputElement>('[name="booking_website"]')
              ?.value || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409 && String(data.error).includes("horario")) {
          setSlot(null);
          go(2);
        }
        throw new Error(data.error);
      }
      setReceipt(data);
      go(5);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos enviar la solicitud. Puedes reintentar con los mismos datos sin duplicarla.",
      );
      setCaptcha("");
      setCaptchaReset((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };
  if (!config.enabled)
    return (
      <div className={styles.panel}>
        <h2>Agenda en preparación</h2>
        <p className={styles.subtitle}>
          Todavía no estamos recibiendo solicitudes desde el calendario. Puedes
          coordinar tu visita directamente con Thony.
        </p>
        <a
          className={styles.primary}
          href="https://wa.me/18294045770?text=Hola%20Thony%2C%20quisiera%20coordinar%20una%20cita."
          target="_blank"
          rel="noopener noreferrer"
        >
          Coordinar por WhatsApp
        </a>
        <p className={styles.muted}>
          Se abrirá una conversación; no se ha enviado ningún mensaje ni
          reservado un horario.
        </p>
      </div>
    );
  return (
    <div>
      <ol className={styles.steps} aria-label="Pasos de la solicitud">
        {["Tipo", "Fecha", "Hora", "Tus datos", "Revisión", "Solicitud"].map(
          (label, index) => (
            <li key={label} aria-current={index === step ? "step" : undefined}>
              <span>{index + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      <div className={styles.panel} aria-busy={busy}>
        <h2 ref={heading} tabIndex={-1}>
          {
            [
              "¿En qué podemos ayudarte?",
              "Elige un día disponible",
              "Selecciona tu horario",
              "Cuéntanos cómo contactarte",
              "Revisa tu solicitud",
              receipt?.status === "pending"
                ? "Solicitud recibida"
                : "Estado de tu solicitud",
            ][step]
          }
        </h2>
        {error && (
          <p role="alert" className={`${styles.notice} ${styles.error}`}>
            {error}
          </p>
        )}
        {step === 0 && (
          <div className={styles.stack}>
            {invalidProperty && (
              <p className={styles.notice}>
                La propiedad del enlace no está disponible para solicitar una
                visita. Puedes elegir otra publicada o hacer una consulta
                general.
              </p>
            )}
            <fieldset
              className={styles.choices}
              style={{ border: 0, padding: 0, margin: 0 }}
            >
              <legend className={styles.muted}>Tipo de cita</legend>
              {Object.entries(appointmentKinds).map(([value, label]) => (
                <label key={value} className={styles.choice}>
                  <input
                    type="radio"
                    name="appointment_kind"
                    checked={kind === value}
                    disabled={value === "property_visit" && !properties.length}
                    onChange={() => {
                      setKind(value as AppointmentKind);
                      setDay("");
                      setSlot(null);
                    }}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            {!properties.length && (
              <p className={styles.muted}>
                Las visitas a inmuebles se habilitan cuando exista una propiedad
                publicada y disponible.
              </p>
            )}
            {kind === "property_visit" && (
              <label className={styles.field}>
                Propiedad de interés
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                >
                  <option value="">Selecciona una propiedad</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference} · {p.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.field}>
              Modalidad
              <select
                value={modality}
                onChange={(e) => {
                  setModality(e.target.value as typeof modality);
                  setSlot(null);
                  setDay("");
                }}
              >
                {config.modalities.map((m) => (
                  <option key={m} value={m}>
                    {m === "virtual" ? "Virtual" : "Presencial"}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.muted}>
              Duración estimada: {config.durations[kind]} minutos. El lugar o
              enlace se confirmará al aprobar la cita.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.primary}
                type="button"
                disabled={kind === "property_visit" && !selectedProperty}
                onClick={() => go(1)}
              >
                Elegir fecha
              </button>
            </div>
          </div>
        )}
        {step === 1 && (
          <>
            <AppointmentDatePicker
              source={source}
              day={day}
              onDay={(value) => {
                setDay(value);
                setSlot(null);
              }}
              slot={slot?.startsAt || ""}
              onSlot={setSlot}
              stage="date"
              horizon={config.bookingHorizonDays}
            />
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => go(0)}
              >
                Volver
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={!day}
                onClick={() => go(2)}
              >
                Elegir hora
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <AppointmentDatePicker
              source={source}
              day={day}
              onDay={setDay}
              slot={slot?.startsAt || ""}
              onSlot={setSlot}
              stage="time"
              horizon={config.bookingHorizonDays}
            />
            <p className={styles.muted}>
              La cita dura {config.durations[kind]} minutos. Solo se ofrecen
              intervalos completos y libres.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => go(1)}
              >
                Cambiar fecha
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={!slot}
                onClick={() => go(3)}
              >
                Completar datos
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              try {
                setBooking(
                  parseBooking({
                    ...draft,
                    kind,
                    modality,
                    startsAt: slot?.startsAt,
                    ...(kind === "property_visit" ? { propertyId } : {}),
                  }),
                );
                go(4);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Revisa los datos.");
              }
            }}
          >
            <div className={styles.formGrid}>
              <label className={`${styles.field} ${styles.full}`}>
                Nombre completo
                <input
                  required
                  autoComplete="name"
                  value={draft.name}
                  maxLength={160}
                  onChange={(e) => field("name", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                Teléfono internacional
                <input
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+1 829…"
                  value={draft.phone}
                  maxLength={32}
                  onChange={(e) => field("phone", e.target.value)}
                />
              </label>
              <label className={styles.field}>
                Correo electrónico
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={draft.email}
                  maxLength={254}
                  onChange={(e) => field("email", e.target.value)}
                />
              </label>
              <label className={`${styles.field} ${styles.full}`}>
                Comentarios (opcional)
                <textarea
                  value={draft.comments}
                  maxLength={2000}
                  onChange={(e) => field("comments", e.target.value)}
                />
              </label>
              <label className={`${styles.field} ${styles.full}`}>
                Preferencia de comunicación
                <select
                  value={draft.communicationPreference}
                  onChange={(e) =>
                    field("communicationPreference", e.target.value)
                  }
                >
                  <option value="email">Correo electrónico</option>
                  <option value="whatsapp">
                    Preferir WhatsApp, con respaldo por correo
                  </option>
                  <option value="both">Correo y WhatsApp</option>
                </select>
              </label>
              <label className={`${styles.check} ${styles.full}`}>
                <input
                  type="checkbox"
                  required
                  checked={draft.operationalConsent}
                  onChange={(e) =>
                    field("operationalConsent", e.target.checked)
                  }
                />
                <span>
                  {operationalConsent}{" "}
                  <a
                    href="/citas/privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacidad de las citas
                  </a>
                </span>
              </label>
              <label className={`${styles.check} ${styles.full}`}>
                <input
                  type="checkbox"
                  required={draft.communicationPreference !== "email"}
                  checked={draft.whatsappConsent}
                  onChange={(e) => field("whatsappConsent", e.target.checked)}
                />
                <span>{whatsappConsent}</span>
              </label>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => go(2)}
              >
                Volver
              </button>
              <button className={styles.primary} type="submit">
                Revisar solicitud
              </button>
            </div>
          </form>
        )}
        {step === 4 && booking && (
          <>
            <dl className={styles.summary}>
              {[
                ["Nombre", booking.name],
                ["Tipo", appointmentKinds[kind]],
                [
                  "Propiedad",
                  selectedProperty && kind === "property_visit"
                    ? selectedProperty.reference +
                      " · " +
                      selectedProperty.title
                    : "Consulta general",
                ],
                ["Fecha", rdDate(booking.startsAt)],
                ["Hora", rdTime(booking.startsAt) + " · República Dominicana"],
                ["Duración", config.durations[kind] + " minutos"],
                [
                  "Modalidad",
                  modality === "virtual" ? "Virtual" : "Presencial",
                ],
                ["Contacto", booking.email + " · " + booking.phone],
                ["Estado inicial", "Pendiente de confirmación"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.notice}>
              El envío es una solicitud. Thony debe aprobarla. La reserva
              provisional vence si no recibe respuesta dentro de{" "}
              {config.holdHours} horas, o antes de la cita si se solicitó con
              poca anticipación.
            </p>
            <label className={styles.trap} aria-hidden="true">
              Página web
              <input name="booking_website" tabIndex={-1} autoComplete="off" />
            </label>
            <BookingCaptcha
              siteKey={siteKey}
              onToken={setCaptcha}
              reset={captchaReset}
            />
            <div className={styles.actions}>
              <button
                type="button"
                disabled={busy}
                className={styles.secondary}
                onClick={() => go(3)}
              >
                Editar datos
              </button>
              <button
                type="button"
                className={styles.primary}
                disabled={busy || !captcha}
                onClick={() => void submit()}
              >
                {busy ? "Guardando solicitud…" : "Solicitar cita"}
              </button>
            </div>
          </>
        )}
        {step === 5 && receipt && (
          <>
            <span className={styles.badge} data-state={receipt.status}>
              {appointmentStatuses[receipt.status]}
            </span>
            <p>{receipt.message}</p>
            <p className={styles.muted}>Identificador privado de solicitud</p>
            <code className={styles.receiptId}>{receipt.id}</code>
            <dl className={styles.summary}>
              <div>
                <dt>Fecha solicitada</dt>
                <dd>{rdDate(receipt.startsAt)}</dd>
              </div>
              <div>
                <dt>Hora</dt>
                <dd>{rdTime(receipt.startsAt)} · República Dominicana</dd>
              </div>
            </dl>
            <p className={styles.muted}>
              Guarda tu enlace personal para consultar cambios. Los avisos se
              procesan por los canales habilitados; guardar la solicitud no
              significa que un mensaje ya fue enviado.
            </p>
            <div className={styles.actions}>
              <a
                href={"/citas/seguimiento#" + receipt.managementToken}
                className={styles.primary}
              >
                Ver estado de mi solicitud
              </a>
              <button
                type="button"
                className={styles.secondary}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      location.origin +
                        "/citas/seguimiento#" +
                        receipt.managementToken,
                    );
                    setCopied(true);
                  } catch {
                    setError(
                      "No pudimos copiar el enlace. Puedes abrirlo y guardarlo desde tu navegador.",
                    );
                  }
                }}
              >
                {copied ? "Enlace copiado" : "Copiar enlace privado"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
