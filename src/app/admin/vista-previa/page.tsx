import { requireAdmin } from "@/lib/admin-access";
import { readEditorState } from "@/lib/admin-site";
import { getThonyPreviewProperties } from "@/data/get-thony-preview-properties";
import { WebsitePreview } from "./preview";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ intro?: string }>;
}) {
  const forceIntro = (await searchParams).intro === "1";
  if (!isSupabaseConfigured) redirect("/admin");
  const { supabase } = await requireAdmin();
  const [state, properties] = await Promise.all([
    readEditorState(supabase),
    getThonyPreviewProperties(supabase),
  ]);
  return <WebsitePreview
      initial={state.settings}
      properties={properties}
      forceIntro={forceIntro}
    />;
}
