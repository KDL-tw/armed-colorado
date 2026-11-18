import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/admin-auth/session";

/**
 * Password gate for /admin (shared ADMIN_PASSWORD).
 * - GET/HEAD without a valid session -> redirect to /admin/login
 * - any other method without a valid session -> 403 (blocks server-action POSTs)
 * - fail-closed: ADMIN_PASSWORD unset -> 503 on everything under /admin
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return; // public login page

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (cookie && (await verifySession(password, cookie))) return; // authorized

  if (request.method === "GET" || request.method === "HEAD") {
    const url = new URL("/admin/login", request.url);
    if (request.nextUrl.pathname !== "/admin") {
      url.searchParams.set("next", request.nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

export const config = {
  matcher: ["/admin/:path*"],
};
