import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultSettings,
  parseSiteSettings,
  type SiteSettings,
} from "@/lib/site-settings";
import { AdminError } from "./admin-access";

export type EditorState = {
  installed: boolean;
  settings: SiteSettings;
  revision: number;
  publishedRevision: number;
  publishedAt: string | null;
  history: { revision: number; published_at: string }[];
};
export async function readEditorState(
  supabase: SupabaseClient,
): Promise<EditorState> {
  const [draft, published, history] = await Promise.all([
    supabase
      .from("site_drafts")
      .select("content,revision")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("site_content")
      .select("revision,published_at")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("site_revisions")
      .select("revision,published_at")
      .order("revision", { ascending: false })
      .limit(10),
  ]);
  const errors = [draft.error, published.error, history.error].filter(Boolean);
  if (
    errors.some((error) => error && ["PGRST205", "42P01"].includes(error.code))
  )
    return {
      installed: false,
      settings: defaultSettings,
      revision: 0,
      publishedRevision: 0,
      publishedAt: null,
      history: [],
    };
  if (errors.length || !draft.data || !published.data)
    throw new AdminError(
      "No se pudo cargar la configuración. Comprueba las tablas y políticas del editor de la web.",
      503,
    );
  return {
    installed: true,
    settings: parseSiteSettings(draft.data.content),
    revision: draft.data.revision,
    publishedRevision: published.data.revision,
    publishedAt: published.data.published_at,
    history: history.data || [],
  };
}
