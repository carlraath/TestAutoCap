import { getIronSession, nextProxyCookies } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";
import { homeFor, isSignedIn, sessionOptions, type SessionData } from "@/lib/session";

/**
 * Request proxy (Next.js 16 proxy convention, formerly middleware).
 * Public paths pass through. Everything else needs a session, and the two
 * role areas redirect each other's users home. A valid session is re-saved on
 * every request so the cookie expiry slides.
 */

const PUBLIC_PREFIXES = ["/_next/", "/brand/", "/fonts/"];
const PUBLIC_EXACT = new Set(["/login", "/api/health", "/favicon.ico"]);
const PARTICIPANT_PREFIXES = ["/dashboard", "/assessment/", "/plan", "/api/attempts/"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (process.env.NODE_ENV === "development" && (pathname === "/dev" || pathname.startsWith("/dev/"))) return true;
  return false;
}

/** Matches "/plan", "/plan/..." and "/assessment/..." style prefixes without matching "/planning". */
function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)));
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(nextProxyCookies(request, response), sessionOptions());
  if (!isSignedIn(session)) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const wantsAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const wantsParticipant = startsWithAny(pathname, PARTICIPANT_PREFIXES);
  if (wantsAdmin && session.role !== "admin") return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  if (wantsParticipant && session.role !== "participant") {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  }

  await session.save();
  return response;
}
