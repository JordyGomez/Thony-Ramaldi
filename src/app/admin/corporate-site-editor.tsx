"use client";
import { useState } from "react";
import Link from "next/link";
import type { CorporateEditorState } from "@/lib/platform-editor";
import { CorporateEditor, platformRequest } from "./empresa/workspace";
import styles from "./admin.module.css";
export function CorporateSiteEditor({
  initial,
  superadmin,
}: {
  initial: CorporateEditorState;
  superadmin: boolean;
}) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const run = async (input: Record<string, unknown>) => {
    setBusy(true);
    setNotice("");
    try {
      const result = await platformRequest(input);
      const response = await fetch("/api/admin/platform?kind=editor", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "Los cambios se guardaron, pero falta recargar el estado del editor.",
        );
      setState(await response.json());
      setNotice(
        input.publish
          ? "Configuración empresarial publicada. El modo público no cambió."
          : "Borrador empresarial guardado.",
      );
      return result;
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "No se pudieron guardar los cambios.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={styles.form}>
      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      {superadmin && (
        <Link className="button" href="/admin/plataforma/vista-previa">
          Vista previa empresarial privada
        </Link>
      )}
      <CorporateEditor
        key={state.revision}
        initial={state.settings}
        revision={state.revision}
        history={state.history}
        busy={busy}
        run={run}
      />
    </div>
  );
}
