import type { Metadata, Viewport } from "next";
import { getSiteSettings } from "@/data/get-site-settings";
import { SiteFrame } from "@/components/site-frame";
import "@/components/cinematic.css";
export async function generateViewport(): Promise<Viewport> {
  const settings = await getSiteSettings();
  return { themeColor: settings.theme.background, colorScheme: "dark" };
}
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: {
      default: s.texts.seoTitle,
      template: `%s | ${s.texts.name} · ${s.texts.company}`,
    },
    description: s.texts.seoDescription,
    robots: { index: s.experience.indexable, follow: true },
    openGraph: {
      type: "website",
      locale: "es_DO",
      title: s.texts.socialTitle,
      description: s.texts.socialDescription,
      siteName: `${s.texts.name} · ${s.texts.company}`,
      ...(s.assets.social ? { images: [s.assets.social] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: s.texts.socialTitle,
      description: s.texts.socialDescription,
      ...(s.assets.social ? { images: [s.assets.social] } : {}),
    },
  };
}
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  return <SiteFrame settings={settings}>{children}</SiteFrame>;
}
