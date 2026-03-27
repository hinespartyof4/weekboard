import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getActiveHouseholdContext } from "@/lib/app/context";

type ApplicationLayoutProps = {
  children: ReactNode;
};

export default async function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  const context = await getActiveHouseholdContext();

  return <AppShell context={context}>{children}</AppShell>;
}
