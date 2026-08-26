import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ============================================
  // ROOT → LOGIN
  // ============================================

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // ============================================
  // PROTECT ADMIN ROUTES
  // ============================================

  if (pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // ============================================
  // ALREADY LOGGED IN → ADMIN
  // ============================================

  if (pathname === "/login" && user) {
    return NextResponse.redirect(
      new URL("/admin", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/login",
  ],
};