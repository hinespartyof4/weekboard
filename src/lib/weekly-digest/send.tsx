import * as React from "react";

import { WeeklyResetDigestEmail } from "@/components/emails/weekly-reset-digest-email";
import { createResendClient, getResendFromEmail } from "@/lib/resend/client";
import type { WeeklyDigestData } from "@/lib/weekly-digest/types";

export async function sendWeeklyDigestEmail(digest: WeeklyDigestData) {
  const resend = createResendClient();

  const { data, error } = await resend.emails.send({
    from: getResendFromEmail(),
    to: digest.recipientEmail,
    subject: `${digest.householdName} weekly reset • ${digest.weekRangeLabel}`,
    react: React.createElement(WeeklyResetDigestEmail, { digest }),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
