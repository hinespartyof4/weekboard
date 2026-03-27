import * as Sentry from "@sentry/nextjs";

import { getSentryDsn, isSentryConfigured } from "@/lib/analytics/config";

if (isSentryConfigured()) {
  Sentry.init({
    dsn: getSentryDsn(),
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    enabled: true,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
