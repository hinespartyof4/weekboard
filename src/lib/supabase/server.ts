import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublishableKey, getSupabaseUrl, isPreviewModeEnabled } from "@/lib/supabase/env";

export async function createClient() {
  if (isPreviewModeEnabled()) {
    throw new Error(
      "Supabase is not configured. The app is using seeded preview data instead.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          // Server Components can read cookies but may not be able to persist them.
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {}
      },
    },
  });
}
