import { DigestSettingsCard } from "@/components/app/digest-settings-card";
import { DevSeedCard } from "@/components/app/dev-seed-card";
import { HouseholdSettingsCard } from "@/components/app/household-settings-card";
import { MemberManagementCard } from "@/components/app/member-management-card";
import { ProfileSettingsCard } from "@/components/app/profile-settings-card";
import { Badge } from "@/components/ui/badge";
import { getSettingsPageData } from "@/lib/settings/queries";

export default async function SettingsPage() {
  const settings = await getSettingsPageData();

  return (
    <div className="space-y-6">
      <section className="rounded-[calc(var(--radius)+6px)] border border-border bg-card/90 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge>Settings</Badge>
            <div className="space-y-2">
              <h1 className="font-serif text-4xl tracking-[-0.06em] text-foreground sm:text-5xl">
                Household settings for {settings.household.householdName}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Keep account details, household preferences, members, and email delivery
                in one simple place.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{settings.household.planName}</Badge>
            <Badge variant="secondary">
              {settings.household.memberCount} members
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <HouseholdSettingsCard settings={settings.household} />
        <ProfileSettingsCard settings={settings.profile} />
      </div>

      <MemberManagementCard settings={settings.members} />
      <DigestSettingsCard settings={settings.digest} />
      {process.env.NODE_ENV !== "production" ? <DevSeedCard /> : null}
    </div>
  );
}
