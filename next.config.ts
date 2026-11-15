import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las respuestas. Se limitan a las que no
// requieren nonces: una CSP completa de scripts debe introducirse aparte, con
// pruebas, porque Next incrusta scripts en línea para hidratar la página.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    // Impide incrustar el sitio en marcos ajenos (clickjacking), fija el
    // origen de formularios y bloquea <base> y complementos antiguos.
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // Fotos subidas desde el panel /admin (almacenamiento público de Supabase).
    remotePatterns: [
      // Solo el servidor local de regresiones del panel; nunca se activa en Vercel.
      ...(process.env.THONY_ADMIN_TESTS === "1" &&
      !process.env.VERCEL_ENV &&
      /^http:\/\/127\.0\.0\.1:\d+$/.test(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      )
        ? [
            new URL(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`,
            ),
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
