"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/auth/actions";
import { isPreviewModeEnabled } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  compact?: boolean;
};

export function SignOutButton({ compact = false }: SignOutButtonProps) {
  if (isPreviewModeEnabled()) {
    return (
      <Button asChild type="button" variant={compact ? "ghost" : "outline"} size="sm">
        <Link href="/login">
          <LogOut className="size-4" />
          Exit preview
        </Link>
      </Button>
    );
  }

  return (
    <form action={signOutAction}>
      <Button type="submit" variant={compact ? "ghost" : "outline"} size="sm">
        <LogOut className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
