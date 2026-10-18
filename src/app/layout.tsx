import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter/wght.css";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url || "http://localhost:3000"),
  ...(site.url ? { alternates: { canonical: site.url } } : {}),
  title: {
    default: "Thony Paulino · Ramaldi | Tu próximo espacio",
    template: "%s | Thony Paulino · Ramaldi",
  },
  description:
    "Asesoría inmobiliaria con Thony Paulino, Ramaldi en República Dominicana. Propiedades para vivir o invertir, en venta y alquiler.",
  openGraph: {
    type: "website",
    locale: "es_DO",
    siteName: "Thony Paulino · Ramaldi",
    title: "Tu próximo espacio. Tu próxima historia.",
    description:
      "Asesoría inmobiliaria con Thony Paulino. Explora sus propiedades y conversemos sobre tu próximo hogar.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#2B2B2B" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
