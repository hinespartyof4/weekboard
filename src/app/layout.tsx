import type { Metadata } from "next";

import "@/app/globals.css";
import { siteConfig } from "@/config/site";
import { PostHogProvider } from "@/components/providers/posthog-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://weekboard.app"),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/weekboard-logo.png",
    apple: "/weekboard-logo.png",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
