import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env";

// Renueva la sesión del panel y protege /admin. El sitio público no pasa por aquí.
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === "/admin/login";
  const isPublicAccount = ["/admin/registro", "/admin/recuperar"].includes(
    request.nextUrl.pathname,
  );
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.host = request.headers.get("host") || url.host;
    url.pathname = pathname;
    url.search = "";
    const redirected = NextResponse.redirect(url);
    response.cookies
      .getAll()
      .forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  };
  if (!user && !isLogin && !isPublicAccount) {
    return redirectTo("/admin/login");
  }
  if (user && isLogin) {
    return redirectTo("/admin");
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
