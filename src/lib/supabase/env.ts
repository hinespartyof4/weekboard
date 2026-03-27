function getRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_APP_URL") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(url && key);
}

export function isPreviewModeEnabled() {
  return !isSupabaseConfigured();
}

function getSupabaseKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return value;
}

export function getSupabaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey() {
  return getSupabaseKey();
}

function normalizeAppUrl(value: string) {
  const withProtocol =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  return withProtocol.replace(/\/$/, "");
}

export function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (explicitUrl) {
    return normalizeAppUrl(explicitUrl);
  }

  if (process.env.VERCEL_ENV === "preview") {
    const previewUrl = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;

    if (previewUrl) {
      return normalizeAppUrl(previewUrl);
    }
  }

  const deploymentUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (deploymentUrl) {
    return normalizeAppUrl(deploymentUrl);
  }

  return "http://localhost:3000";
}
