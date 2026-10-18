"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProperty, importLocalProperties } from "./actions";
import styles from "./admin.module.css";

export function DeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={`${styles.linkButton} ${styles.danger}`}
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `¿Borrar «${title}»? Se quitará de la web y se eliminarán sus fotos. No se puede deshacer.`,
          )
        )
          return;
        startTransition(async () => {
          const result = await deleteProperty(id);
          if (!result.ok) window.alert(result.error);
          router.refresh();
        });
      }}
    >
      {pending ? "Borrando…" : "Borrar"}
    </button>
  );
}

export function ImportButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className="button button-solid"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await importLocalProperties();
            setMessage(result.ok ? (result.message ?? null) : result.error);
            router.refresh();
          })
        }
      >
        {pending ? "Importando… (puede tardar un minuto)" : "Importar propiedades actuales"}
      </button>
      {message && (
        <p role="status" className={styles.hint}>
          {message}
        </p>
      )}
    </>
  );
}
