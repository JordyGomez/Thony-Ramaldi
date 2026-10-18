"use client";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/lib/site-settings";
import { SiteProvider } from "./site-provider";
import { Header } from "./header";
import { Footer } from "./footer";
import { MotionDirector } from "./motion-director";
export function SiteFrame({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  return (
    <SiteProvider settings={settings}>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <Header />
      {children}
      {settings.experience.footer && <Footer />}
      <MotionDirector />
    </SiteProvider>
  );
}
