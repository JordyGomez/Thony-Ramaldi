"use client";
import { useState } from "react";
import Link from "next/link";
export function PreviewScreen() {
  const [mobile, setMobile] = useState(false);
  return (
    <main id="contenido" style={{ padding: 16, minHeight: "100dvh" }}>
      <div
        style={{
          display: "flex",
          gap: 15,
          flexWrap: "wrap",
          alignItems: "center",
          paddingBottom: 15,
        }}
      >
        <Link href="/admin/plataforma">← Configuración de plataforma</Link>
        <button
          className="button"
          aria-pressed={!mobile}
          onClick={() => setMobile(false)}
        >
          Computadora
        </button>
        <button
          className="button"
          aria-pressed={mobile}
          onClick={() => setMobile(true)}
        >
          Móvil
        </button>
        <span>Vista privada · no cambia la identidad pública</span>
      </div>
      <iframe
        title="Vista previa privada de Ramaldi"
        src="/admin/plataforma/vista-previa/contenido"
        style={{
          display: "block",
          margin: "auto",
          border: "1px solid #666",
          width: mobile ? "min(390px, 100%)" : "100%",
          height: "85dvh",
          background: "#2B2B2B",
        }}
      />
    </main>
  );
}
