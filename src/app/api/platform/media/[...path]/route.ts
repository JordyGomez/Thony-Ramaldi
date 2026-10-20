import { getAdminUser } from "@/lib/supabase/server";
import { adminFailure, AdminError } from "@/lib/admin-access";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const name = (await params).path.join("/");
    if (
      !/^[a-f\d-]{36}\/[a-f\d-]{36}\/[a-f\d-]{36}\.(jpg|jpeg|png|webp|pdf)$/.test(
        name,
      )
    )
      throw new AdminError("Archivo no encontrado.", 404);
    const { supabase } = await getAdminUser();
    const { data: allowed, error } = await supabase.rpc(
      "can_read_enterprise_media",
      { p_name: name },
    );
    if (error || allowed !== true)
      throw new AdminError("Archivo no disponible.", 404);
    const { data, error: signError } = await supabase.storage
      .from("platform-media")
      .createSignedUrl(name, 60);
    if (signError || !data?.signedUrl)
      throw new AdminError("Archivo no disponible.", 404);
    return new Response(null, {
      status: 307,
      headers: {
        Location: data.signedUrl,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    return adminFailure(error);
  }
}
