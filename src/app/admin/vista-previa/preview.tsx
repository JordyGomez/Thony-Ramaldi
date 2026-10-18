"use client";
import { useEffect, useState } from "react";
import type { Property } from "@/data/properties";
import { parseSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { SiteFrame } from "@/components/site-frame";
import { HomeContent } from "@/components/home-content";
import { footerPropertyImage } from "@/lib/footer-property-image";
import "@/components/cinematic.css";

export function WebsitePreview({
  initial,
  properties,
}: {
  initial: SiteSettings;
  properties: Property[];
}) {
  const [settings, setSettings] = useState(initial);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== "thony-site-preview"
      )
        return;
      try {
        setSettings(parseSiteSettings(event.data.settings));
      } catch {
        /* Una edición incompleta conserva la última previsualización válida. */
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  return (
    <SiteFrame settings={settings} footerImage={footerPropertyImage(properties)}>
      <HomeContent settings={settings} properties={properties} preview />
    </SiteFrame>
  );
}
