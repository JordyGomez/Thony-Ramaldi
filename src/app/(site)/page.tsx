import { getProperties } from "@/data/get-properties";
import { getSiteSettings } from "@/data/get-site-settings";
import { HomeContent } from "@/components/home-content";
import { getPlatformSnapshot, corporateSettings } from "@/data/get-platform";
import { CorporateHome } from "@/components/corporate-portal";
import { PublicModeContent } from "@/components/public-mode";
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
  const [properties, settings] = await Promise.all([
    getProperties(),
    getSiteSettings(),
  ]);
  return (
    <PublicModeContent mode="thony" revision={platform?.revision || 0}>
      <HomeContent properties={properties} settings={settings} />
    </PublicModeContent>
  );
}
