import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isValidToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") return NextResponse.next();

  const ok = await isValidToken(request.cookies.get(AUTH_COOKIE)?.value);
  if (ok) {
    const isPrototypeTwoLanding =
      process.env.FITTE_PROTOTYPE === "2" &&
      (pathname === "/prototypes/index.html" || pathname === "/prototypes/");

    if (isPrototypeTwoLanding) {
      const url = request.nextUrl.clone();
      url.pathname = "/prototypes/prototype2.html";
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-touch-icon.png).*)"],
};
