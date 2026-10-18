"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="contenido" className="error-page section-pad">
      <span className="label">Intentémoslo de nuevo</span>
      <h1>
        Hagamos <strong>una pausa.</strong>
      </h1>
      <p>No pudimos cargar este espacio. Puedes volver a intentarlo.</p>
      <button className="button" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
