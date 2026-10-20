"use client";
import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import styles from "./admin.module.css";
declare global {
  interface Window {
    turnstile?: {
      render: (el: string, options: Record<string, unknown>) => string;
    };
  }
}
export function AccountForm({
  kind,
}: {
  kind: "signup" | "recover" | "password";
}) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY;
  const send = async (form: HTMLFormElement, accept = false) => {
    setBusy(true);
    setNotice("");
    const fields = Object.fromEntries(new FormData(form));
    const token = new URLSearchParams(location.hash.slice(1)).get("invitacion");
    try {
      const r = await fetch("/api/platform/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          action: accept ? "accept" : kind,
          captchaToken: captcha,
          token,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setNotice(data.message);
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        void send(e.currentTarget);
      }}
    >
      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      {kind !== "password" && (
        <label className={styles.field}>
          Correo profesional
          <input type="email" name="email" autoComplete="email" required />
        </label>
      )}
      {kind !== "recover" && (
        <label className={styles.field}>
          {kind === "password" ? "Nueva contraseña" : "Contraseña"}
          <input
            type="password"
            name="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
      )}
      {kind === "signup" && (
        <>
          <label className={styles.field}>
            Nombre profesional
            <input name="name" maxLength={80} />
          </label>
          <label className={styles.field}>
            Datos para verificar tu incorporación
            <textarea name="description" maxLength={2000} />
          </label>
          <p>
            Necesitas una invitación vigente. Registrarte y verificar el correo
            no te concede acceso a propiedades ni permisos de empleado.
          </p>
        </>
      )}
      {siteKey && kind !== "password" && (
        <>
          <div id="auth-captcha" />
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            onLoad={() =>
              window.turnstile?.render("#auth-captcha", {
                sitekey: siteKey,
                callback: (token: string) => setCaptcha(token),
                "expired-callback": () => setCaptcha(""),
              })
            }
          />
        </>
      )}
      <button className="button" disabled={busy}>
        {kind === "signup"
          ? "Registrar cuenta con invitación"
          : kind === "recover"
            ? "Solicitar recuperación"
            : "Guardar nueva contraseña"}
      </button>
      {kind === "signup" && (
        <button
          type="button"
          className="button"
          disabled={busy}
          onClick={(e) => {
            const f = e.currentTarget.form;
            if (f) void send(f, true);
          }}
        >
          Ya verifiqué mi correo: enviar solicitud
        </button>
      )}
      <Link href="/admin/login">Iniciar sesión</Link>
      {kind === "signup" && (
        <Link href="/admin/empresa">Consultar estado de mi solicitud</Link>
      )}
    </form>
  );
}
