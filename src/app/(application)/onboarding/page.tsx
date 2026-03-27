import type { Metadata } from "next";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { redirectIfOnboardingComplete } from "@/lib/auth/user";

export const metadata: Metadata = {
  title: "Onboarding",
};

export default async function OnboardingPage() {
  const user = await redirectIfOnboardingComplete();

  return (
    <main className="page-shell py-10 sm:py-14">
      <OnboardingCard userEmail={user.email} />
    </main>
  );
}

