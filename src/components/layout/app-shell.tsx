import type { ReactNode } from "react";

import type { AppContextSnapshot } from "@/lib/app/types";
import { AppAnalytics } from "@/components/analytics/app-analytics";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AppHeader } from "@/components/layout/app-header";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: ReactNode;
  context: AppContextSnapshot;
};

export function AppShell({ children, context }: AppShellProps) {
  return (
    <AuthProvider initialContext={context}>
      <AppAnalytics />
      <div className="page-shell flex min-h-screen gap-6 py-4 md:py-6">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6">
          <AppHeader />
          <AppMobileNav />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
