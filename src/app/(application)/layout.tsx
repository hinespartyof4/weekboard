import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type AuthenticatedRouteGroupLayoutProps = {
  children: ReactNode;
};

export default function AuthenticatedRouteGroupLayout({
  children,
}: AuthenticatedRouteGroupLayoutProps) {
  return children;
}
