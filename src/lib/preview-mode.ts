import { isPreviewModeEnabled } from "@/lib/supabase/env";

const previewReadOnlyMessage =
  "Preview mode is read-only. Connect Supabase to create, edit, and save real household data.";

export function assertWritesEnabled() {
  if (isPreviewModeEnabled()) {
    throw new Error(previewReadOnlyMessage);
  }
}

export function getPreviewModeMessage() {
  return previewReadOnlyMessage;
}
