import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { aj } from "@/lib/arcjet";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/transactions(.*)",
  "/account(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // ── Arcjet security layer (runs before Clerk on every request) ──────────
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
    if (decision.reason.isBot()) {
      return NextResponse.json(
        { error: "Bot traffic not allowed" },
        { status: 403 }
      );
    }
    if (decision.reason.isEmail()) {
      return NextResponse.json(
        { error: "Invalid or disposable email" },
        { status: 400 }
      );
    }
    // Fallback denial
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // ────────────────────────────────────────────────────────────────────────

  // Clerk: protect authenticated routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
