import { getProperties } from "@/data/get-properties";
import { getSiteSettings } from "@/data/get-site-settings";
import { HomeContent } from "@/components/home-content";
export const revalidate = 60;
export default async function Home() {
  const [properties, settings] = await Promise.all([
    getProperties(),
    getSiteSettings(),
  ]);
  return <HomeContent properties={properties} settings={settings} />;
}
