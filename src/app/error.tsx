"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="contenido" className="error-page section-pad">
      <span className="eyebrow">INTENTÉMOSLO DE NUEVO</span>
      <h1>
        Hagamos
        <br />
        <em>una pausa.</em>
      </h1>
      <p>No pudimos cargar este espacio. Puedes volver a intentarlo.</p>
      <button className="button button-primary" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
