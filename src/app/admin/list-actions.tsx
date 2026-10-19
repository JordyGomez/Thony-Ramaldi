"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProperty } from "./actions";
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
            `¿Borrar «${title}»? Se quitará de la web. Los archivos compartidos de la biblioteca se conservan. No se puede deshacer.`,
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
