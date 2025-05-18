import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

// Create matchers for each route and its allowed roles
const matchers = Object.entries(routeAccessMap).map(([route, allowedRoles]) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles,
}));

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();
  const sessionClaims = authObject.sessionClaims;

  // Extract the user's role from session claims
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Check if the request is for an API route
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');

  // Iterate through matchers to check access permissions
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req)) {
      // If the user's role is not allowed
      if (!role || !allowedRoles.includes(role)) {
        if (isApiRoute) {
          // For API routes, return a 403 Forbidden response
          return new NextResponse(
            JSON.stringify({ 
              error: 'Access denied',
              message: 'You do not have permission to access this resource'
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        } else {
          // For page routes, redirect to unauthorized page
          const baseUrl = req.nextUrl.origin;
          return NextResponse.redirect(new URL(`/${role ?? "unauthorized"}`, baseUrl));
        }
      }
    }
  }
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Match all API routes
    "/api/:path*",
    // Match all list routes
    "/list/:path*",
    // Match all dashboard routes
    "/(dashboard)/:path*"
  ],
};
