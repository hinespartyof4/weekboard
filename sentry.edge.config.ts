import * as Sentry from "@sentry/nextjs";

import { getSentryDsn, isSentryConfigured } from "@/lib/analytics/config";

if (isSentryConfigured()) {
  Sentry.init({
    dsn: getSentryDsn(),
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    enabled: true,
  });
}
