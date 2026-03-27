import { RecurringBoard } from "@/components/app/recurring-board";
import { getActiveHouseholdContext } from "@/lib/app/context";
import { getRecurringBoardData } from "@/lib/recurring/queries";

export default async function RecurringPage() {
  const context = await getActiveHouseholdContext();
  const data = await getRecurringBoardData({
    householdId: context.household.id,
    householdName: context.household.name,
    timeZone: context.household.timezone,
  });

  return <RecurringBoard data={data} />;
}
