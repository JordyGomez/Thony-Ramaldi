import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main id="contenido" className="error-page section-pad">
      <span className="eyebrow">404 · UN NUEVO CAMINO</span>
      <h1>
        Este espacio
        <br />
        <em>no está aquí.</em>
      </h1>
      <p>
        La página que buscas no existe. Regresa al catálogo para seguir
        explorando.
      </p>
      <Link href="/#propiedades" className="button button-primary">
        <ArrowLeft size={17} />
        Ver propiedades
      </Link>
    </main>
  );
}
