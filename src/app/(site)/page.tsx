import { getProperties } from "@/data/get-properties";
import { getSiteSettings } from "@/data/get-site-settings";
import { HomeContent } from "@/components/home-content";
import { getPlatformSnapshot, corporateSettings } from "@/data/get-platform";
import { CorporateHome } from "@/components/corporate-portal";
import { PublicModeContent } from "@/components/public-mode";
import { cookies } from "next/headers";
import { INTRO_COOKIE } from "@/lib/intro";
export const revalidate = 60;
export default async function Home() {
  const platform = await getPlatformSnapshot();
  if (platform?.mode === "ramaldi")
    return (
      <PublicModeContent mode="ramaldi" revision={platform.revision}>
        <CorporateHome
          settings={corporateSettings(platform)}
          properties={platform.properties}
          agents={platform.agents}
        />
      </PublicModeContent>
    );
  const [properties, settings, jar] = await Promise.all([
    getProperties(),
    getSiteSettings(),
    cookies(),
  ]);
  const intro =
    settings.experience.intro === "door" &&
    (settings.experience.introFrequency === "always" ||
      !jar.has(INTRO_COOKIE));
  return (
    <PublicModeContent mode="thony" revision={platform?.revision || 0}>
      <HomeContent properties={properties} settings={settings} intro={intro} />
    </PublicModeContent>
  );
}
