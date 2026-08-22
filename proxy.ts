import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return;
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout") || pathname.startsWith("/api/checkout")) {
    if (!req.auth) {
      if (pathname.startsWith("/api/checkout")) {
        return NextResponse.json({ error: "Sign in required" }, { status: 401 });
      }
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return;
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/checkout/:path*", "/api/checkout/:path*"]
};
