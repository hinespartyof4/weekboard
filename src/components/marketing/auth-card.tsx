"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { loginAction, signupAction } from "@/lib/auth/actions";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import {
  initialAuthActionState,
  type AuthActionState,
} from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthCardProps = {
  mode: "login" | "signup";
  message?: string;
  nextPath?: string;
  previewMode?: boolean;
};

function SubmitButton({
  idleLabel,
  pendingLabel,
  disabled = false,
}: {
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending || disabled}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

function getAction(mode: "login" | "signup") {
  return mode === "login" ? loginAction : signupAction;
}

function getAlternateHref(mode: "login" | "signup", nextPath: string) {
  const pathname = mode === "login" ? "/signup" : "/login";
  const safeNextPath = getSafeRedirectPath(nextPath);

  return safeNextPath === "/app"
    ? pathname
    : `${pathname}?next=${encodeURIComponent(safeNextPath)}`;
}

function getMessageTone(state: AuthActionState, message?: string) {
  if (state.status === "error" || message) {
    return "border-rose-200 bg-rose-50/90 text-rose-900";
  }

  return "border-emerald-200 bg-emerald-50/90 text-emerald-900";
}

export function AuthCard({
  mode,
  message,
  nextPath = "/app",
  previewMode = false,
}: AuthCardProps) {
  const isLogin = mode === "login";
  const [state, formAction] = useActionState(getAction(mode), initialAuthActionState);
  const safeNextPath = getSafeRedirectPath(nextPath);
  const feedbackMessage = state.message ?? message;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-primary/12 bg-[linear-gradient(160deg,rgba(245,249,245,0.98),rgba(223,233,221,0.9))]">
        <CardHeader className="space-y-5">
          <p className="eyebrow">{isLogin ? "Welcome back" : "Create account"}</p>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em] sm:text-5xl">
            {isLogin ? "Log in to Weekboard" : "Start your Weekboard account"}
          </CardTitle>
          <CardDescription className="text-base leading-8">
            {isLogin
              ? "Sign in to pick up your shared shopping lists, pantry inventory, tasks, and Weekly Reset."
              : "Create an account first. If you were invited into a household, we’ll connect that membership automatically after auth."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            "Cookie-based SSR auth for App Router",
            "Protected app shell for authenticated households",
            "Email confirmation support for production-ready signup",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="size-4 text-primary" />
              {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mx-auto w-full max-w-xl">
        <CardHeader className="space-y-3">
          <p className="eyebrow">
            {isLogin ? "Household sign in" : "Password-based sign up"}
          </p>
          <CardTitle className="font-serif text-4xl tracking-[-0.05em]">
            {isLogin ? "Continue to your app" : "Create your secure login"}
          </CardTitle>
          <CardDescription className="text-base leading-7">
            {isLogin
              ? "Use your email and password to access the Weekboard app shell. If your email has a pending household invite, we’ll attach it automatically."
              : "If email confirmation is enabled in Supabase, we’ll ask you to verify before entering the app."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {feedbackMessage ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${getMessageTone(
                state,
                message,
              )}`}
            >
              {feedbackMessage}
            </div>
          ) : null}

          {previewMode ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/app">
                Open app preview
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={safeNextPath} />

            <fieldset disabled={previewMode} className="space-y-4 disabled:opacity-70">
              <div className="space-y-2">
                <label
                  htmlFor={`${mode}-email`}
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <Input
                  id={`${mode}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@household.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={`${mode}-password`}
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Input
                  id={`${mode}-password`}
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder={isLogin ? "Enter your password" : "Use at least 8 characters"}
                  required
                />
              </div>
            </fieldset>

            <SubmitButton
              idleLabel={isLogin ? "Continue to dashboard" : "Create account"}
              pendingLabel={isLogin ? "Signing in..." : "Creating account..."}
              disabled={previewMode}
            />
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Need an account?" : "Already have an account?"}{" "}
            <Link
              href={getAlternateHref(mode, safeNextPath)}
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
            >
              {isLogin ? "Sign up" : "Log in"}
              <ArrowRight className="size-3.5" />
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
