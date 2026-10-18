import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
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
