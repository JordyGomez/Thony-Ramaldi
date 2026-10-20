import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const supabase = await createAdminClient();
  const query = request.nextUrl.searchParams;
  const code = query.get("code");
  const hash = query.get("token_hash");
  const type = query.get("type");
  let valid = false;
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    valid = !result.error;
  } else if (
    hash &&
    (type === "email" || type === "recovery" || type === "signup")
  ) {
    const result = await supabase.auth.verifyOtp({ token_hash: hash, type });
    valid = !result.error;
  }
  const next = query.get("next");
  const destination = valid
    ? next === "/admin/registro"
      ? "/admin/registro"
      : "/admin/cuenta"
    : "/admin/recuperar?enlace=invalid";
  const url = new URL(destination, request.url);
  url.host = request.headers.get("host") || url.host;
  return NextResponse.redirect(url, {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
