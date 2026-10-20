import type { Metadata, Viewport } from "next";
import { getSiteSettings } from "@/data/get-site-settings";
import { getProperties } from "@/data/get-properties";
import { footerPropertyImage } from "@/lib/footer-property-image";
import { SiteFrame } from "@/components/site-frame";
import "@/components/cinematic.css";
import { getPlatformSnapshot, corporateSettings } from "@/data/get-platform";
import { CorporateFrame } from "@/components/corporate-portal";
import { PublicModeProvider } from "@/components/public-mode";
export const dynamic = "force-dynamic";
export async function generateViewport(): Promise<Viewport> {
  const platform = await getPlatformSnapshot();
  if (platform?.mode === "ramaldi")
    return {
      themeColor: corporateSettings(platform).background,
      colorScheme: "dark",
    };
  const settings = await getSiteSettings();
  return { themeColor: settings.theme.background, colorScheme: "dark" };
}
export async function generateMetadata(): Promise<Metadata> {
  const platform = await getPlatformSnapshot();
  if (platform?.mode === "ramaldi") {
    const s = corporateSettings(platform);
    return {
      title: { default: s.seoTitle, template: `%s | ${s.name}` },
      description: s.seoDescription,
      openGraph: {
        type: "website",
        locale: "es_DO",
        siteName: s.name,
        title: s.seoTitle,
        description: s.seoDescription,
      },
      twitter: {
        card: "summary_large_image",
        title: s.seoTitle,
        description: s.seoDescription,
      },
      robots: { index: true, follow: true },
    };
  }
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
  const platform = await getPlatformSnapshot();
  if (platform?.mode === "ramaldi")
    return (
      <PublicModeProvider mode="ramaldi" revision={platform.revision}>
        <CorporateFrame
          settings={corporateSettings(platform)}
          registration={platform.registrationEnabled}
        >
          {children}
        </CorporateFrame>
      </PublicModeProvider>
    );
  const [settings, properties] = await Promise.all([
    getSiteSettings(),
    getProperties(),
  ]);
  return (
    <PublicModeProvider mode="thony" revision={platform?.revision || 0}>
      <SiteFrame
        settings={settings}
        footerImage={footerPropertyImage(properties)}
      >
        {children}
      </SiteFrame>
    </PublicModeProvider>
  );
}
