"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { assertWritesEnabled } from "@/lib/preview-mode";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { InviteActionState } from "@/lib/invitations/types";

export async function acceptHouseholdInviteAction(
  _previousState: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase is not configured yet, so invites cannot be accepted.",
    };
  }

  try {
    assertWritesEnabled();
    await requireUser();

    const token = String(formData.get("token") ?? "").trim();

    if (!token) {
      return {
        status: "error",
        message: "Invitation link is invalid.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("accept_household_invitation", {
      p_invite_token: token,
    });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }

    redirect("/app");
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to accept the invitation.",
    };
  }
}
