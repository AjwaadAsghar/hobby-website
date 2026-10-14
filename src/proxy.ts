import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig, ADMIN_ROLES } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * First line of defence: redirects signed-out visitors away from /admin and
 * /account. Every admin page, server action and API route ALSO checks the
 * session and role on the server (see src/lib/auth-helpers.ts).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) {
      const url = new URL("/admin/login", req.nextUrl);
      if (pathname !== "/admin") url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/account") && !["/account/login", "/account/register"].includes(pathname)) {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL("/account/login", req.nextUrl));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
