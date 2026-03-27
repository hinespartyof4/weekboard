import type { Metadata } from "next";

import { AuthCard } from "@/components/marketing/auth-card";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { redirectIfAuthenticated } from "@/lib/auth/user";
import { isPreviewModeEnabled, isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, next } = await searchParams;
  await redirectIfAuthenticated(next);
  const setupMessage =
    message ??
    (!isSupabaseConfigured()
      ? "Supabase isn’t configured yet, but you can open the app in preview mode with seeded household data."
      : undefined);

  return (
    <main className="page-shell py-12">
      <AuthCard
        mode="login"
        message={setupMessage}
        nextPath={getSafeRedirectPath(next)}
        previewMode={isPreviewModeEnabled()}
      />
    </main>
  );
}
