"use client";
import Script from "next/script";
import { useEffect, useId, useState } from "react";
import styles from "./agenda.module.css";
export function BookingCaptcha({
  siteKey,
  onToken,
  reset,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  reset: number;
}) {
  const [ready, setReady] = useState(false),
    [failure, setFailure] = useState<{ reset: number; message: string } | null>(
      null,
    );
  const id = "booking-captcha-" + useId().replace(/[^a-z0-9]/gi, "");
  useEffect(() => {
    if (!ready || !window.turnstile) return;
    const widget = window.turnstile.render("#" + id, {
      sitekey: siteKey,
      action: "appointment_request",
      theme: "dark",
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => {
        onToken("");
        setFailure({
          reset,
          message: "La verificación no respondió. Recárgala antes de enviar.",
        });
      },
    });
    return () => {
      const cf = window.turnstile as typeof window.turnstile & {
        remove?: (id: string) => void;
      };
      cf?.remove?.(widget);
    };
  }, [ready, id, siteKey, reset, onToken]);
  return (
    <div>
      <div id={id} />
      <Script
        id="booking-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
        onError={() =>
          setFailure({
            reset,
            message:
              "No se pudo cargar la verificación de seguridad. Recarga la página para reintentar.",
          })
        }
      />
      {failure?.reset === reset && (
        <p role="alert" className={styles.notice}>
          {failure.message}
        </p>
      )}
    </div>
  );
}
