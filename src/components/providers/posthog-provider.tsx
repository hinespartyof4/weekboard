"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { captureClientPageView, initPostHog } from "@/lib/analytics/client";

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    captureClientPageView(pathname);
  }, [pathname]);

  return children;
}
