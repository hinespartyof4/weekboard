import { PantryBoard } from "@/components/app/pantry-board";
import { getActiveHouseholdContext } from "@/lib/app/context";
import { getPantryBoardData } from "@/lib/pantry/queries";

export default async function PantryPage() {
  const context = await getActiveHouseholdContext();
  const data = await getPantryBoardData({
    householdId: context.household.id,
    householdName: context.household.name,
    timeZone: context.household.timezone,
    subscription: context.subscription,
  });

  return <PantryBoard data={data} />;
}
