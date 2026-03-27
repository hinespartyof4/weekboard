import { PostHog } from "posthog-node";

import type { AnalyticsEventName } from "@/lib/analytics/events";
import { getPostHogHost, getPostHogKey, isPostHogConfigured } from "@/lib/analytics/config";

type CaptureServerEventArgs = {
  distinctId: string;
  event: AnalyticsEventName;
  properties?: Record<string, unknown>;
};

export async function captureServerEvent(args: CaptureServerEventArgs) {
  if (!isPostHogConfigured()) {
    return;
  }

  const client = new PostHog(getPostHogKey(), {
    host: getPostHogHost(),
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    client.capture({
      distinctId: args.distinctId,
      event: args.event,
      properties: args.properties,
    });
  } finally {
    await client.shutdown();
  }
}
