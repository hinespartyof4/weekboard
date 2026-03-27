import { NextResponse } from "next/server";

import { isResendConfigured } from "@/lib/resend/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getWeeklyDigestData,
  getWeeklyDigestEligibleHouseholds,
  markWeeklyDigestDelivered,
} from "@/lib/weekly-digest/queries";
import { sendWeeklyDigestEmail } from "@/lib/weekly-digest/send";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const configuredSecret =
    process.env.CRON_SECRET ?? process.env.WEEKLY_RESET_CRON_SECRET;

  if (!configuredSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${configuredSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured for digest delivery." },
      { status: 503 },
    );
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "Resend is not configured for digest delivery." },
      { status: 503 },
    );
  }

  const dueHouseholds = await getWeeklyDigestEligibleHouseholds();
  const results: Array<{
    householdId: string;
    householdName: string;
    status: "sent" | "skipped" | "failed";
    detail: string;
  }> = [];

  for (const entry of dueHouseholds) {
    try {
      const digest = await getWeeklyDigestData({
        householdId: entry.household.id,
        householdName: entry.household.name,
        timezone: entry.household.timezone,
        weekStartsOn: entry.household.week_starts_on,
        resetDay: entry.household.reset_day,
        weekStartDate: entry.weekStartDate,
        recipientEmailOverride: entry.household.weekly_digest_recipient_email,
      });

      if (!digest) {
        results.push({
          householdId: entry.household.id,
          householdName: entry.household.name,
          status: "skipped",
          detail: "No recipient email could be resolved.",
        });
        continue;
      }

      await sendWeeklyDigestEmail(digest);
      await markWeeklyDigestDelivered({
        householdId: digest.householdId,
        weekStartDate: digest.weekStartDate,
      });

      results.push({
        householdId: digest.householdId,
        householdName: digest.householdName,
        status: "sent",
        detail: `Sent to ${digest.recipientEmail}.`,
      });
    } catch (error) {
      results.push({
        householdId: entry.household.id,
        householdName: entry.household.name,
        status: "failed",
        detail: error instanceof Error ? error.message : "Unknown failure.",
      });
    }
  }

  return NextResponse.json({
    processed: dueHouseholds.length,
    sent: results.filter((result) => result.status === "sent").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  });
}
