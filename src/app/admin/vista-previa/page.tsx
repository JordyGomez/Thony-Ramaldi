import { requireAdmin } from "@/lib/admin-access";
import { readEditorState } from "@/lib/admin-site";
import { getProperties } from "@/data/get-properties";
import { WebsitePreview } from "./preview";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
export default async function PreviewPage() {
  if (!isSupabaseConfigured) redirect("/admin");
  const { supabase } = await requireAdmin();
  const [state, properties] = await Promise.all([
    readEditorState(supabase),
    getProperties(),
  ]);
  return <WebsitePreview initial={state.settings} properties={properties} />;
}
