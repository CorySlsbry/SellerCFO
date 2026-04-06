import { type NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/supabase/middleware";

/**
 * Middleware to refresh Supabase session and protect routes
 * Runs on every request to the application
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await refreshSession(request);

  const isAuthRoute = request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup" ||
    request.nextUrl.pathname === "/auth/callback";

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/admin");

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users trying to access protected routes
  if ((isDashboardRoute || isAdminRoute) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Return the response with refreshed session
  return response;
}

/**
 * Configuration for which routes should run through middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
