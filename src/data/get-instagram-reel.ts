import "server-only";
import { parseReelUrl, type PublicReel, type ReelSettings } from "@/lib/instagram";

type Media = {
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

export type InstagramSync =
  | { state: "not_configured" }
  | { state: "ok"; reel: Extract<PublicReel, { source: "auto" }> }
  | { state: "no_reels" }
  | { state: "error"; detail: string };

/** Frecuencia de consulta a Meta: la respuesta se reutiliza media hora. */
const REVALIDATE_SECONDS = 1800;

/**
 * Último Reel propio mediante la API oficial (Instagram API con inicio de
 * sesión de Instagram). Se distingue el Reel más reciente de la publicación
 * más reciente por `media_product_type`. El token nunca sale del servidor.
 */
export async function syncLatestReel(fresh = false): Promise<InstagramSync> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { state: "not_configured" };
  try {
    const endpoint = new URL("https://graph.instagram.com/me/media");
    endpoint.searchParams.set(
      "fields",
      "media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp",
    );
    endpoint.searchParams.set("limit", "25");
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
      ...(fresh
        ? { cache: "no-store" as const }
        : { next: { revalidate: REVALIDATE_SECONDS } }),
    });
    if (!response.ok)
      return {
        state: "error",
        detail:
          response.status === 400 || response.status === 401 || response.status === 190
            ? "Meta rechazó el token: puede haber caducado o haberse revocado."
            : `Meta respondió ${response.status}.`,
      };
    const body = (await response.json()) as { data?: Media[] };
    const reel = (body.data || [])
      .filter(
        (media) =>
          media.media_product_type === "REELS" &&
          media.media_type === "VIDEO" &&
          media.media_url &&
          media.permalink &&
          parseReelUrl(media.permalink),
      )
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))[0];
    if (!reel) return { state: "no_reels" };
    return {
      state: "ok",
      reel: {
        source: "auto",
        permalink: parseReelUrl(reel.permalink!)!.permalink,
        videoUrl: reel.media_url!,
        posterUrl: reel.thumbnail_url || null,
        publishedAt: reel.timestamp || null,
      },
    };
  } catch {
    return { state: "error", detail: "No se pudo contactar con Meta." };
  }
}

/** Reel que se muestra en la web: automático si hay conexión, si no el manual. */
export async function getPublicReel(
  settings: ReelSettings,
): Promise<PublicReel | null> {
  if (settings.mode === "off") return null;
  if (settings.mode === "auto") {
    const sync = await syncLatestReel();
    if (sync.state === "ok") return sync.reel;
  }
  const manual = parseReelUrl(settings.url);
  return manual ? { source: "manual", ...manual } : null;
}
