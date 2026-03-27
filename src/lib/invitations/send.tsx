import * as React from "react";

import { HouseholdInviteEmail } from "@/components/emails/household-invite-email";
import { createResendClient, getResendFromEmail } from "@/lib/resend/client";
import type { SendHouseholdInviteEmailInput } from "@/lib/invitations/types";

export async function sendHouseholdInviteEmail(invite: SendHouseholdInviteEmailInput) {
  const resend = createResendClient();

  const { data, error } = await resend.emails.send({
    from: getResendFromEmail(),
    to: invite.inviteeEmail,
    subject: `${invite.householdName} invited you to Weekboard`,
    react: React.createElement(HouseholdInviteEmail, { invite }),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
