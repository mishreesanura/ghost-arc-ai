import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
export const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up';

const isPublicRoute = createRouteMatcher([
  `${signInUrl}(.*)`,
  `${signUpUrl}(.*)`,
]);

export default clerkMiddleware(async (auth, req) => {
  // Bypasses Clerk middleware in development if mock_auth is active in search params or referer
  const referer = req.headers.get('referer');
  let isMockAuth = req.nextUrl.searchParams.get('mock_auth') === 'true';
  if (!isMockAuth && referer) {
    try {
      isMockAuth = new URL(referer).searchParams.get('mock_auth') === 'true';
    } catch {
      // Ignore invalid URLs
    }
  }

  if (process.env.NODE_ENV === 'development' && isMockAuth) {
    return;
  }

  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await auth.protect();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Clerk's auto-proxy path once, after the API/TRPC matcher
    '/__clerk/:path*',
  ],
};
