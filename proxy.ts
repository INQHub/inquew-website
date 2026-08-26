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
    if (req.auth?.user?.mustChangePassword && pathname !== "/admin/account") {
      return NextResponse.redirect(new URL("/admin/account", req.url));
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
    if (req.auth.user.mustChangePassword && pathname.startsWith("/dashboard") && pathname !== "/dashboard/account") {
      return NextResponse.redirect(new URL("/dashboard/account", req.url));
    }
    return;
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/checkout/:path*", "/api/checkout/:path*"]
};
