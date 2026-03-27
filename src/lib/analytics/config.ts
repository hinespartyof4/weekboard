export function isPostHogConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST,
  );
}

export function getPostHogKey() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_POSTHOG_KEY.");
  }

  return key;
}

export function getPostHogHost() {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
}

export function isSentryConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function getSentryDsn() {
  return process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
}
