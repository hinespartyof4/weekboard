import { getActiveHouseholdContext } from "@/lib/app/context";
import { getShoppingBoardData } from "@/lib/shopping/queries";
import { ShoppingBoard } from "@/components/app/shopping-board";

export default async function ShoppingPage() {
  const context = await getActiveHouseholdContext();
  const data = await getShoppingBoardData({
    householdId: context.household.id,
    householdName: context.household.name,
    userId: context.user.id,
    subscription: context.subscription,
  });

  return <ShoppingBoard data={data} />;
}
