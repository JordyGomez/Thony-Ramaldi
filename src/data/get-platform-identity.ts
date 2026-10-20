import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
} from "@/lib/supabase/env";
import { platformMissing, type SiteMode } from "@/lib/platform";

/** Lectura mínima independiente del contenido: el panel de reversión debe
 * seguir disponible aunque una configuración editorial resulte inválida. */
export const getPlatformIdentity = cache(
  async (): Promise<{ mode: SiteMode; revision: number }> => {
    if (!isSupabaseConfigured) return { mode: "thony", revision: 0 };
    await connection();
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { fetch: (i, init) => fetch(i, { ...init, cache: "no-store" }) },
    });
    const { data, error } = await client.rpc("public_platform_identity");
    if (error && platformMissing(error.code)) {
      const state = await client
        .from("platform_state")
        .select("active_mode,revision")
        .eq("id", 1)
        .maybeSingle();
      if (state.error && platformMissing(state.error.code))
        return { mode: "thony", revision: 0 };
      if (state.error || !state.data)
        throw new Error("No se pudo verificar la modalidad activa.");
      return { mode: state.data.active_mode, revision: state.data.revision };
    }
    if (error || !data || !["thony", "ramaldi"].includes(data.mode))
      throw new Error("No se pudo verificar la modalidad activa.");
    return data;
  },
);
