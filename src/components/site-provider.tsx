"use client";

import {
  createContext,
  useContext,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";
import { defaultSettings, type SiteSettings } from "@/lib/site-settings";
import { site, whatsappUrl } from "@/lib/site";

const SiteContext = createContext<SiteSettings>(defaultSettings);
export function useExperienceReducedMotion() {
  const reduced = useReducedMotion();
  const settings = useContext(SiteContext);
  return reduced || settings.experience.motion === "off";
}
export function useSite() {
  const settings = useContext(SiteContext);
  const t = settings.texts;
  return {
    settings,
    contact: {
      ...site,
      name: t.name,
      company: t.company,
      phone: t.phone,
      phoneHref: `tel:+${t.phoneInternational}`,
      email: t.email,
      instagram: t.instagram,
      instagramHandle: t.instagramHandle,
      logo: settings.assets.logo || null,
    },
    whatsappUrl: (property?: Parameters<typeof whatsappUrl>[0]) =>
      whatsappUrl(property, {
        number: t.whatsapp,
        message: t.whatsappMessage,
        name: t.name,
      }),
  };
}
export function SiteProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  const presentation = useMemo(
    () => ({
      ...settings,
      experience: { ...settings.experience, motion: "off" as const, entry: false },
    }),
    [settings],
  );
  const style = {
    "--bg": settings.theme.background,
    "--bg-deep": `color-mix(in srgb, ${settings.theme.background}, black 20%)`,
    "--bg-raised": `color-mix(in srgb, ${settings.theme.background}, white 5%)`,
    "--text": settings.theme.text,
    "--text-soft": `color-mix(in srgb, ${settings.theme.text}, ${settings.theme.background} 18%)`,
    "--muted": `color-mix(in srgb, ${settings.theme.text}, ${settings.theme.background} 33%)`,
    "--accent": settings.theme.accent,
    "--gold-light": settings.theme.accent,
    "--brand-ink": settings.theme.accent,
  } as CSSProperties;
  return (
    <SiteContext.Provider value={presentation}>
      <div
        className="site-experience"
        data-motion="off"
        style={style}
      >
        {children}
      </div>
    </SiteContext.Provider>
  );
}
