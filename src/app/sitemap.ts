import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getSiteSettings } from "@/data/get-site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  // Las fichas ficticias permanecen fuera del índice de búsqueda.
  return site.url && settings.experience.indexable
    ? [{ url: site.url, changeFrequency: "monthly", priority: 1 }]
    : [];
}
