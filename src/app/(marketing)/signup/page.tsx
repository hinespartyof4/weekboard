import type { Metadata } from "next";

import { AuthCard } from "@/components/marketing/auth-card";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { redirectIfAuthenticated } from "@/lib/auth/user";
import { isPreviewModeEnabled, isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Sign Up",
};

type SignupPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  await redirectIfAuthenticated(next);
  const setupMessage = !isSupabaseConfigured()
    ? "Supabase isn’t configured yet, but you can still explore the app in preview mode with seeded data."
    : undefined;

  return (
    <main className="page-shell py-12">
      <AuthCard
        mode="signup"
        message={setupMessage}
        nextPath={getSafeRedirectPath(next)}
        previewMode={isPreviewModeEnabled()}
      />
    </main>
  );
}
