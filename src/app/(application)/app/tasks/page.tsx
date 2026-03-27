import { TasksBoard } from "@/components/app/tasks-board";
import { getActiveHouseholdContext } from "@/lib/app/context";
import { getTaskBoardData } from "@/lib/tasks/queries";

export default async function TasksPage() {
  const context = await getActiveHouseholdContext();
  const data = await getTaskBoardData({
    householdId: context.household.id,
    householdName: context.household.name,
    currentUserId: context.user.id,
    timeZone: context.household.timezone,
  });

  return <TasksBoard data={data} />;
}
