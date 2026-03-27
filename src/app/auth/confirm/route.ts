import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getPostAuthRedirectPath } from "@/lib/auth/user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set(
      "message",
      "Supabase auth is not configured yet. Add your environment variables first.",
    );
    return NextResponse.redirect(redirectTo);
  }

  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(searchParams.get("next"));

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      redirectTo.pathname = await getPostAuthRedirectPath(next);
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("message", "Confirmation link is invalid or has expired.");
  return NextResponse.redirect(redirectTo);
}
