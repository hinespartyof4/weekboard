import * as React from "react";

import { formatShortDate } from "@/lib/date";
import type { SendHouseholdInviteEmailInput } from "@/lib/invitations/types";

type HouseholdInviteEmailProps = {
  invite: SendHouseholdInviteEmailInput;
};

const styles = {
  body: {
    margin: 0,
    backgroundColor: "#f1f5f1",
    color: "#223036",
    fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
  },
  wrapper: {
    width: "100%",
    padding: "32px 16px",
  },
  card: {
    maxWidth: "640px",
    margin: "0 auto",
    backgroundColor: "#f7faf7",
    border: "1px solid rgba(37, 55, 60, 0.12)",
    borderRadius: "28px",
    overflow: "hidden",
  },
  hero: {
    padding: "32px",
    background:
      "linear-gradient(160deg, rgba(245, 249, 245, 0.98), rgba(223, 233, 221, 0.9))",
    borderBottom: "1px solid rgba(37, 55, 60, 0.1)",
  },
  eyebrow: {
    margin: "0 0 12px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.24em",
    textTransform: "uppercase" as const,
    color: "#5f6e69",
  },
  heading: {
    margin: 0,
    fontSize: "34px",
    lineHeight: "1.05",
    fontWeight: 600,
    letterSpacing: "-0.05em",
    color: "#223036",
  },
  lead: {
    margin: "16px 0 0",
    fontSize: "15px",
    lineHeight: "1.75",
    color: "#5f6e69",
  },
  section: {
    padding: "24px 32px 0",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(37, 55, 60, 0.1)",
    borderRadius: "20px",
    padding: "18px",
  },
  label: {
    margin: "0 0 6px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "#5f6e69",
  },
  value: {
    margin: 0,
    fontSize: "15px",
    lineHeight: "1.75",
    color: "#223036",
  },
  footer: {
    padding: "28px 32px 32px",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#25373c",
    color: "#f4f7f3",
    textDecoration: "none",
    borderRadius: "999px",
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: 600,
  },
  footerText: {
    margin: "16px 0 0",
    fontSize: "13px",
    lineHeight: "1.75",
    color: "#5f6e69",
  },
};

export function HouseholdInviteEmail({ invite }: HouseholdInviteEmailProps) {
  return (
    <html>
      <body style={styles.body}>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.hero}>
              <p style={styles.eyebrow}>Weekboard household invite</p>
              <h1 style={styles.heading}>Join {invite.householdName} on Weekboard.</h1>
              <p style={styles.lead}>
                {invite.inviterName} invited you to join the shared household workspace so
                you can keep shopping, pantry, tasks, and Weekly Reset in one place.
              </p>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionCard}>
                <p style={styles.label}>Invited email</p>
                <p style={styles.value}>{invite.inviteeEmail}</p>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionCard}>
                <p style={styles.label}>What happens next</p>
                <p style={styles.value}>
                  Use the button below to sign up or log in with this email address. If
                  your account already exists, Weekboard will connect the household invite
                  after authentication.
                </p>
              </div>
            </div>

            <div style={styles.footer}>
              <a href={invite.inviteUrl} style={styles.button}>
                Join household
              </a>
              <p style={styles.footerText}>
                {invite.expiresAt
                  ? `This invitation expires on ${formatShortDate(invite.expiresAt)}.`
                  : "This invitation will stay available until it is accepted or revoked."}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
