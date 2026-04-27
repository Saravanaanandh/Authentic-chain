import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the user is not an admin, redirect them from the dashboard to the home page
    if (req.nextUrl.pathname.startsWith("/dashboard") && req.nextauth.token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Requires authentication for the matched routes
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"], // Apply middleware only to dashboard routes
};
