import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

function applySupabaseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isOnboardingRoute = pathname === "/onboarding";

  if (!user && (isAppRoute || isOnboardingRoute)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";

    if (pathname !== "/app" || request.nextUrl.search) {
      redirectUrl.searchParams.set(
        "next",
        getSafeRedirectPath(`${pathname}${request.nextUrl.search}`),
      );
    }

    const redirectResponse = NextResponse.redirect(redirectUrl);
    applySupabaseCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}
