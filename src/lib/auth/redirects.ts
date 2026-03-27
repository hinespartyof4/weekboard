export const DEFAULT_AUTH_REDIRECT = "/app";

export function isInvitePath(value?: string | null) {
  return Boolean(value && /^\/invite\/[^/]+$/.test(value));
}

export function getSafeRedirectPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return value;
}
