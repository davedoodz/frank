import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrototypeTwoLanding =
    process.env.FITTE_PROTOTYPE === "2" &&
    (pathname === "/prototypes/index.html" || pathname === "/prototypes/");

  if (!isPrototypeTwoLanding) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/prototypes/prototype2.html";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|apple-touch-icon.png).*)"],
};
