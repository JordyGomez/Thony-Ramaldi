"use client";
import { useState } from "react";
import Link from "next/link";
import { platformRequest } from "../empresa/workspace";
import styles from "../admin.module.css";
type Impact = {
  currentMode: string;
  targetMode: string;
  revision: number;
  currentProperties: number;
  targetProperties: number;
  affectedProperties: number;
  authorized: boolean;
  authorizationReference: string | null;
  registrationEnabled: boolean;
  ready: boolean;
};
type Audit = {
  revision: number;
  previous_mode: string;
  new_mode: string;
  actor_id: string;
  created_at: string;
  property_count: number;
};
export function PlatformSettings({
  initialImpact,
  initialAudit,
}: {
  initialImpact: Impact;
  initialAudit: Audit[];
}) {
  const [target, setTarget] = useState("ramaldi");
  const [impact, setImpact] = useState<Impact | null>(initialImpact);
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [corporateConfirmed, setCorporateConfirmed] = useState(false);
  const [registration, setRegistration] = useState(false);
  const [audit, setAudit] = useState<Audit[]>(initialAudit);
  const load = async (mode: string) => {
    try {
      const r = await fetch(`/api/admin/platform?kind=impact&target=${mode}`, {
        cache: "no-store",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setImpact(data);
      const a = await fetch("/api/admin/platform", { cache: "no-store" });
      if (a.ok) setAudit((await a.json()).modeAudit || []);
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "No se pudo comprobar el modo.",
      );
    } finally {
      setBusy(false);
    }
  };
  const change = async () => {
    setBusy(true);
    setNotice("");
    try {
      await platformRequest({
        action: "mode",
        target,
        revision: impact?.revision,
        confirmation,
      });
      setConfirmation("");
      await load(target);
      setNotice(
        "Modalidad actualizada y registrada. La información de ambas identidades se conserva.",
      );
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "No se pudo cambiar la modalidad.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={styles.form}>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      <section className={styles.fieldset}>
        <h2>Modo de operación</h2>
        <label className={styles.field}>
          Nueva modalidad
          <select
            value={target}
            disabled={busy}
            onChange={(e) => {
              setBusy(true);
              setNotice("");
              setTarget(e.target.value);
              setImpact(null);
              setConfirmation("");
              void load(e.target.value);
            }}
          >
            <option value="thony">Thony Paulino · Ramaldi</option>
            <option value="ramaldi">Ramaldi Inmobiliaria</option>
          </select>
        </label>
        {impact && (
          <>
            <p>
              Modo público actual:{" "}
              <strong>
                {impact.currentMode === "thony"
                  ? "Thony Paulino · Ramaldi"
                  : "Ramaldi Inmobiliaria"}
              </strong>
            </p>
            <p>
              Nuevo modo:{" "}
              <strong>
                {target === "thony"
                  ? "Thony Paulino · Ramaldi"
                  : "Ramaldi Inmobiliaria"}
              </strong>
            </p>
            <p>
              Propiedades visibles actualmente: {impact.currentProperties}.
              Propiedades visibles después del cambio: {impact.targetProperties}
              .
            </p>
            <p>
              Propiedades cuya visibilidad cambiará: {impact.affectedProperties}
              .
            </p>
            <p>
              {target === "ramaldi"
                ? "Se mostrarán el catálogo empresarial aprobado, los asesores activos y sus contactos publicados. El contenido personal se conserva."
                : "Se recuperarán la presentación, contactos, contenido y catálogo de Thony. Los perfiles y propiedades empresariales permanecerán guardados."}
            </p>
            <p className={styles.notice}>
              El cambio modifica títulos, SEO, navegación, contactos y
              visibilidad. Las páginas se actualizan sin redeploy. No borra
              usuarios, fotografías, propiedades, permisos ni borradores.
            </p>
            <p>
              Autorización empresarial:{" "}
              {impact.authorized ? "registrada" : "pendiente"}. Configuración
              publicada: {impact.ready ? "preparada" : "incompleta"}. Registro
              con invitación:{" "}
              {impact.registrationEnabled ? "autorizado" : "cerrado"}.
            </p>
            <label className={styles.field}>
              Para confirmar, escribe CAMBIAR A {target.toUpperCase()}
              <input
                autoComplete="off"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <button
              className="button"
              disabled={
                busy ||
                impact.currentMode === target ||
                confirmation !== `CAMBIAR A ${target.toUpperCase()}` ||
                (target === "ramaldi" && (!impact.authorized || !impact.ready))
              }
              onClick={() => void change()}
            >
              Confirmar cambio público
            </button>
          </>
        )}
        <div className={styles.emptyActions}>
          <Link className="button" href="/admin/plataforma/vista-previa">
            Vista previa empresarial privada
          </Link>
          <Link className="button" href="/admin/empresa">
            Revisar configuración, empleados y contenido
          </Link>
        </div>
      </section>
      <section className={styles.fieldset}>
        <h2>Autorización de identidad empresarial</h2>
        <p>
          La autorización del portafolio personal de Thony no autoriza un portal
          oficial de la empresa. Registra la referencia de una aprobación
          corporativa real y verificable; no introduzcas una aprobación
          provisional.
        </p>
        {impact?.authorizationReference && (
          <p>Referencia registrada: {impact.authorizationReference}</p>
        )}
        <label className={styles.field}>
          Referencia de aprobación corporativa
          <input
            maxLength={500}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={corporateConfirmed}
            onChange={(e) => setCorporateConfirmed(e.target.checked)}
          />
          Confirmo que la empresa autorizó esta identidad y que su aprobación
          puede verificarse.
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={registration}
            onChange={(e) => setRegistration(e.target.checked)}
          />
          La empresa autoriza incorporación con invitación y se verificaron
          correo, CAPTCHA, límites de Supabase Auth y el hook de invitaciones.
        </label>
        <button
          className="button"
          disabled={busy || !corporateConfirmed || reference.trim().length < 12}
          onClick={async () => {
            setBusy(true);
            try {
              await platformRequest({
                action: "authorization",
                reference,
                confirm: corporateConfirmed,
                registration,
              });
              setCorporateConfirmed(false);
              await load(target);
              setNotice("Autorización registrada; el modo público no cambió.");
            } catch (e) {
              setNotice(
                e instanceof Error
                  ? e.message
                  : "No se pudo registrar la aprobación.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Registrar autorización sin activar el modo
        </button>
      </section>
      <section className={styles.fieldset}>
        <h2>Historial de cambios de identidad</h2>
        {!audit.length && (
          <p>No se ha registrado ningún cambio de modalidad.</p>
        )}
        {audit.map((a) => (
          <p key={a.revision}>
            {a.created_at} · {a.previous_mode} → {a.new_mode} · Cuenta{" "}
            {a.actor_id} · {a.property_count} propiedades visibles · Revisión{" "}
            {a.revision}
          </p>
        ))}
        <p>
          Para revertir, selecciona Thony, revisa el impacto actual y confirma
          el cambio. La reversión usa la misma transacción y conserva ambas
          identidades.
        </p>
      </section>
    </div>
  );
}
