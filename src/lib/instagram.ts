/**
 * Reel de Instagram. Dos orígenes, sin scraping:
 *  - «auto»: API oficial de Instagram (cuenta profesional propia y token del
 *    propietario en INSTAGRAM_ACCESS_TOKEN, solo en el servidor).
 *  - «manual»: URL de un Reel pegada en el panel, mostrada con el embed oficial.
 */
export type ReelMode = "auto" | "manual" | "off";
export type ReelSettings = { mode: ReelMode; url: string };

export type PublicReel =
  | {
      source: "auto";
      permalink: string;
      videoUrl: string;
      posterUrl: string | null;
      publishedAt: string | null;
    }
  | { source: "manual"; permalink: string; shortcode: string };

const HOSTS = ["instagram.com", "www.instagram.com"];

/** Devuelve el enlace canónico de un Reel o publicación, o `null` si no lo es. */
export function parseReelUrl(
  value: string,
): { permalink: string; shortcode: string } | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    !HOSTS.includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  )
    return null;
  const match = url.pathname.match(
    /^(?:\/[A-Za-z0-9._]{1,30})?\/(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,40})\/?$/,
  );
  if (!match) return null;
  const kind = match[1] === "reels" ? "reel" : match[1];
  return {
    permalink: `https://www.instagram.com/${kind}/${match[2]}/`,
    shortcode: match[2],
  };
}

export const reelEmbedUrl = (permalink: string) => `${permalink}embed`;
