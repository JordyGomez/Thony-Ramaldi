import type { Metadata } from "next";
import { isSanityConfigured } from "@/sanity/env";
import { Studio } from "./studio";

export const dynamic = "force-static";
export { viewport } from "next-sanity/studio";

export const metadata: Metadata = {
  title: "Panel de propiedades",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  if (isSanityConfigured) return <Studio />;
  return (
    <main id="contenido" className="error-page section-pad admin-pending">
      <span className="label">Panel de propiedades</span>
      <h1>
        Panel <strong>pendiente de activar.</strong>
      </h1>
      <p>
        El panel para publicar propiedades ya está instalado. Falta conectarlo
        con Sanity: crea el proyecto en sanity.io y define la variable{" "}
        <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> con su Project ID. Mientras
        tanto, la web muestra las propiedades actuales.
      </p>
    </main>
  );
}
