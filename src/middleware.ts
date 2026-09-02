import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Authentication + role-based access control.
 *
 * Roles live in Clerk `publicMetadata.role`. Anything that is not explicitly
 * "admin" is treated as a marketer, so marketer sign-up needs no special
 * handling and admin accounts are created/stamped only from the Clerk dashboard.
 */

const isPublicRoute = createRouteMatcher(["/login(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isMarketerAppRoute = createRouteMatcher(["/dashboard(.*)", "/reports(.*)"]);

function roleHome(role: string | undefined): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims as { metadata?: { role?: string } } | null)?.metadata?.role;

  // --- Public routes (only /login) ---
  if (isPublicRoute(req)) {
    // Already signed in? Send to the correct home instead of showing /login.
    if (userId) {
      return NextResponse.redirect(new URL(roleHome(role), req.url));
    }
    return NextResponse.next();
  }

  // --- Everything else requires a session ---
  if (!userId) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // --- /admin/* is admin-only ---
  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // --- The marketer workspace is not for admins ---
  if (isMarketerAppRoute(req) && role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets...
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // ...and always on API routes.
    "/(api|trpc)(.*)",
  ],
};
