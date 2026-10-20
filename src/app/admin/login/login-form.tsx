"use client";

import { useActionState } from "react";
import { signIn } from "../actions";
import styles from "../admin.module.css";
import Link from "next/link";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className={styles.form}>
      {state && !state.ok && (
        <p className={`${styles.notice} ${styles.error}`} role="alert">
          {state.error}
        </p>
      )}
      <label className={styles.field}>
        Correo
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          autoFocus
        />
      </label>
      <label className={styles.field}>
        Contraseña
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" className="button button-solid" disabled={pending}>
        {pending ? "Entrando…" : "Entrar al panel"}
      </button>
      <Link href="/admin/recuperar">Recuperar contraseña</Link>
    </form>
  );
}
