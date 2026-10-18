import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getSiteSettings } from "@/data/get-site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: settings.experience.indexable
        ? ["/propiedades/", "/admin", "/api/admin/"]
        : ["/"],
    },
    ...(site.url ? { sitemap: `${site.url}/sitemap.xml` } : {}),
  };
}
