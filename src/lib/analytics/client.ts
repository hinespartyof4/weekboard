"use client";

import posthog from "posthog-js";

import type { AnalyticsEventName } from "@/lib/analytics/events";
import { getPostHogHost, getPostHogKey, isPostHogConfigured } from "@/lib/analytics/config";

let initialized = false;

export function initPostHog() {
  if (!isPostHogConfigured() || initialized) {
    return;
  }

  posthog.init(getPostHogKey(), {
    api_host: getPostHogHost(),
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    persistence: "localStorage+cookie",
  });

  initialized = true;
}

export function captureClientEvent(
  event: AnalyticsEventName,
  properties?: Record<string, unknown>,
) {
  if (!isPostHogConfigured()) {
    return;
  }

  posthog.capture(event, properties);
}

export function captureClientPageView(path: string) {
  if (!isPostHogConfigured()) {
    return;
  }

  posthog.capture("$pageview", {
    $current_url: path,
  });
}

export function identifyClientUser(args: {
  distinctId: string;
  email?: string | null;
  householdId?: string | null;
  householdName?: string | null;
  planTier?: string | null;
}) {
  if (!isPostHogConfigured()) {
    return;
  }

  posthog.identify(args.distinctId, {
    email: args.email ?? undefined,
    household_id: args.householdId ?? undefined,
    household_name: args.householdName ?? undefined,
    plan_tier: args.planTier ?? undefined,
  });
}

export function resetClientAnalytics() {
  if (!isPostHogConfigured()) {
    return;
  }

  posthog.reset();
}
