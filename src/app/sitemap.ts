import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getSiteSettings } from "@/data/get-site-settings";
import { getPlatformSnapshot } from "@/data/get-platform";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const platform = await getPlatformSnapshot();
  if (platform?.mode === "ramaldi")
    return site.url
      ? [
          { url: site.url, priority: 1 },
          { url: `${site.url}/asesores`, priority: 0.7 },
          ...platform.agents.map((a) => ({
            url: `${site.url}/asesores/${a.slug}`,
            priority: 0.6,
          })),
          ...platform.properties.map((p) => ({
            url: `${site.url}/propiedades/${p.slug}`,
            priority: 0.8,
          })),
        ]
      : [];
  const settings = await getSiteSettings();
  // Las fichas ficticias permanecen fuera del índice de búsqueda.
  return site.url && settings.experience.indexable
    ? [{ url: site.url, changeFrequency: "monthly", priority: 1 }]
    : [];
}
