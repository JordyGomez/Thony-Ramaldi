import { getPlatformIdentity } from "@/data/get-platform-identity";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  };
  try {
    return Response.json(await getPlatformIdentity(), { headers });
  } catch {
    return Response.json(
      { error: "Identidad no disponible" },
      { status: 503, headers },
    );
  }
}
