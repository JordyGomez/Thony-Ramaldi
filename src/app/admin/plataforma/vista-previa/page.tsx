import { notFound } from "next/navigation";
import { requirePlatform } from "@/lib/platform-access";
import { PreviewScreen } from "./screen";
export default async function CorporatePreviewPage() {
  const context = await requirePlatform("superadmin").catch(() => null);
  if (!context) notFound();
  return <PreviewScreen />;
}
