import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteLayout from "./(site)/layout";

// Raíz: fuera del grupo (site), así que reutiliza su envoltorio.
export default function NotFound() {
  return (
    <SiteLayout>
      <main id="contenido" className="error-page section-pad">
        <span className="label">404 · Un nuevo camino</span>
        <h1>
          Este espacio <strong>no está aquí.</strong>
        </h1>
        <p>
          La página que buscas no existe. Regresa al catálogo para seguir
          explorando.
        </p>
        <Link href="/#propiedades" className="button">
          <ArrowLeft size={16} strokeWidth={1.25} />
          Ver propiedades
        </Link>
      </main>
    </SiteLayout>
  );
}
