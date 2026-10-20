import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseCorporateSettings, type CorporateSettings } from "./platform";
import { AdminError } from "./admin-access";
export type CorporateEditorState = {
  settings: CorporateSettings;
  revision: number;
  publishedRevision: number;
  history: {
    revision: number;
    content: CorporateSettings;
    published_at: string;
  }[];
};
export async function readCorporateEditor(
  supabase: SupabaseClient,
): Promise<CorporateEditorState> {
  const [settings, history] = await Promise.all([
    supabase
      .from("site_mode_settings")
      .select("draft,revision,published_revision")
      .eq("mode", "ramaldi")
      .single(),
    supabase
      .from("site_mode_revisions")
      .select("revision,content,published_at")
      .eq("mode", "ramaldi")
      .order("revision", { ascending: false })
      .limit(10),
  ]);
  if (settings.error || history.error || !settings.data)
    throw new AdminError(
      "No se pudo cargar el editor empresarial autorizado.",
      503,
    );
  return {
    settings: parseCorporateSettings(settings.data.draft),
    revision: settings.data.revision,
    publishedRevision: settings.data.published_revision,
    history: history.data || [],
  };
}
