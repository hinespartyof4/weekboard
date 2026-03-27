"use server";

import { redirect } from "next/navigation";

import { captureServerEvent } from "@/lib/analytics/server";
import { analyticsEvents } from "@/lib/analytics/events";
import type { AuthActionState } from "@/lib/auth/types";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getPostAuthRedirectPath } from "@/lib/auth/user";
import { isPreviewModeEnabled, isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    next: getSafeRedirectPath(String(formData.get("next") ?? "/app")),
  };
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password, next } = readCredentials(formData);

  if (isPreviewModeEnabled()) {
    return {
      status: "error",
      message: "Login is disabled in preview mode. Use the preview button to enter the app with seeded data.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase auth is not configured yet. Add your project URL and publishable key to .env.local first.",
    };
  }

  if (!validateEmail(email) || password.length < 6) {
    return {
      status: "error",
      message: "Enter a valid email and password.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  redirect(await getPostAuthRedirectPath(next));
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password, next } = readCredentials(formData);

  if (isPreviewModeEnabled()) {
    return {
      status: "error",
      message: "Signup is disabled in preview mode. Use the preview button to enter the app with seeded data.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase auth is not configured yet. Add your project URL and publishable key to .env.local first.",
    };
  }

  if (!validateEmail(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Use at least 8 characters for your password.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (data.user?.id) {
    await captureServerEvent({
      distinctId: data.user.id,
      event: analyticsEvents.signupCompleted,
      properties: {
        requires_email_confirmation: !data.session,
      },
    });
  }

  if (data.session) {
    redirect(await getPostAuthRedirectPath(next));
  }

  return {
    status: "success",
    message:
      "Check your email to confirm your account. Once confirmed, we’ll take you into your first Weekboard setup step.",
  };
}

export async function signOutAction() {
  if (isPreviewModeEnabled()) {
    redirect("/login");
  }

  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
