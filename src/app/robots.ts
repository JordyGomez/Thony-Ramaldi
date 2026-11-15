import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getSiteSettings } from "@/data/get-site-settings";
import { getPlatformSnapshot } from "@/data/get-platform";
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const platform = await getPlatformSnapshot();
  if (platform?.mode === "ramaldi")
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/citas/seguimiento"],
      },
      ...(site.url ? { sitemap: `${site.url}/sitemap.xml` } : {}),
    };
  const settings = await getSiteSettings();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: settings.experience.indexable
        ? [
            // Las fichas se rastrean: cada una declara si es indexable
            // (solo las reales y disponibles). Bloquearlas aquí impedía
            // posicionar el inventario publicado.
            "/admin",
            "/api/admin/",
            "/api/citas/",
            "/api/internal/",
            "/api/webhooks/",
            "/auth/",
            "/citas/seguimiento",
          ]
        : ["/"],
    },
    ...(site.url ? { sitemap: `${site.url}/sitemap.xml` } : {}),
  };
}
