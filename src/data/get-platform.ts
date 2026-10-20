import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
} from "@/lib/supabase/env";
import {
  platformMissing,
  parseCorporateSettings,
  parseAgentContent,
  type SiteMode,
  type PublicAgent,
  type CorporateSettings,
} from "@/lib/platform";
import type { PropertyRow } from "./property-row";

export type PlatformSnapshot = {
  mode: SiteMode;
  revision: number;
  settings: unknown;
  properties: PropertyRow[];
  agents: PublicAgent[];
  registrationEnabled: boolean;
};
/** Una lectura por petición, sin caché de modo compartida ni identidad por query string. */
export const getPlatformSnapshot = cache(
  async (): Promise<PlatformSnapshot | null> => {
    if (!isSupabaseConfigured) return null;
    // Fuera del SDK: su catch transforma la señal de Next en un error PostgREST.
    await connection();
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
    const { data, error } = await client.rpc("public_platform_snapshot");
    if (error && platformMissing(error.code)) {
      const state = await client
        .from("platform_state")
        .select("active_mode,revision")
        .eq("id", 1)
        .maybeSingle();
      if (state.error && platformMissing(state.error.code)) return null;
      throw new Error(
        "La ampliación instalada requiere su snapshot completo. No se mezclarán configuraciones de reserva.",
      );
    }
    if (error || !data || !["thony", "ramaldi"].includes(data.mode)) {
      throw new Error(
        "No se pudo verificar la identidad pública de la plataforma.",
      );
    }
    return {
      ...data,
      agents: (data.agents || []).map((a: PublicAgent) => ({
        ...a,
        content: parseAgentContent(a.content),
      })),
    };
  },
);
export function corporateSettings(
  snapshot: PlatformSnapshot,
): CorporateSettings {
  if (snapshot.mode !== "ramaldi")
    throw new Error("La identidad empresarial no está activa.");
  return parseCorporateSettings(snapshot.settings);
}
