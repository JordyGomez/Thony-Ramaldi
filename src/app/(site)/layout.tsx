import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Envoltorio del sitio público; el panel /admin queda fuera de este grupo.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <Header />
      {children}
      <Footer />
    </>
  );
}
