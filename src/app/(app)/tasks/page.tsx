import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/date-utils";
import type { Room, Staff, TaskStatus, TaskWithRelations } from "@/types/database";
import { ensureCheckoutHousekeepingTasks } from "./actions";
import { CreateTaskForm } from "./create-task-form";
import { TASK_STATUS_ORDER } from "./labels";
import { TasksBoard } from "./tasks-board";

export default async function TasksPage() {
  await ensureCheckoutHousekeepingTasks();
  const supabase = await createClient();
  const today = todayDateString();

  const [{ data: tasks }, { data: rooms }, { data: staff }, { data: dueOutBookings }, { data: arrivingBookings }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*, room:rooms(id, number, floor), staff:staff(id, name)")
        .order("created_at", { ascending: false })
        .returns<TaskWithRelations[]>(),
      supabase.from("rooms").select("*").order("number").returns<Room[]>(),
      supabase.from("staff").select("*").order("name").returns<Staff[]>(),
      supabase
        .from("bookings")
        .select("room_id")
        .eq("checkout", today)
        .in("status", ["confirmed", "checked_in"]),
      supabase
        .from("bookings")
        .select("room_id")
        .eq("checkin", today)
        .in("status", ["confirmed", "checked_in"]),
    ]);

  const dueOutRoomIds = new Set((dueOutBookings ?? []).map((b) => b.room_id).filter(Boolean));
  const arrivingRoomIds = new Set((arrivingBookings ?? []).map((b) => b.room_id).filter(Boolean));
  const turnoverRoomIds = new Set([...dueOutRoomIds].filter((id) => arrivingRoomIds.has(id)));

  function priorityRank(task: TaskWithRelations) {
    if (!task.room_id || task.type !== "housekeeping") return 2;
    if (turnoverRoomIds.has(task.room_id)) return 0;
    if (dueOutRoomIds.has(task.room_id)) return 1;
    return 2;
  }

  const columns: Record<TaskStatus, TaskWithRelations[]> = { todo: [], inprogress: [], done: [] };
  for (const task of tasks ?? []) {
    columns[task.status].push(task);
  }
  for (const status of TASK_STATUS_ORDER) {
    columns[status].sort((a, b) => priorityRank(a) - priorityRank(b));
  }

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
          <ClipboardList className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Housekeeping</h1>
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <CreateTaskForm rooms={rooms ?? []} staff={staff ?? []} />
      </div>

      <TasksBoard columns={columns} dueOutRoomIds={dueOutRoomIds} turnoverRoomIds={turnoverRoomIds} />
    </div>
  );
}
