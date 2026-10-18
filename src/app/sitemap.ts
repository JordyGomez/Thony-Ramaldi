import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Las fichas ficticias permanecen fuera del índice de búsqueda.
  return site.url
    ? [{ url: site.url, changeFrequency: "monthly", priority: 1 }]
    : [];
}
