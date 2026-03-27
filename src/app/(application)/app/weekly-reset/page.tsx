import { WeeklyResetBoard } from "@/components/app/weekly-reset-board";
import { getActiveHouseholdContext } from "@/lib/app/context";
import { getWeeklyResetData } from "@/lib/weekly-reset/queries";

export default async function WeeklyResetPage() {
  const context = await getActiveHouseholdContext();
  const data = await getWeeklyResetData({
    householdId: context.household.id,
    householdName: context.household.name,
    currentUserId: context.user.id,
    timeZone: context.household.timezone,
    weekStartsOn: context.household.weekStartsOn,
  });

  return <WeeklyResetBoard data={data} />;
}
