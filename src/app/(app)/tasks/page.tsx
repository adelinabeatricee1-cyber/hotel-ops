import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/date-utils";
import type { Room, Staff, TaskStatus, TaskWithRelations } from "@/types/database";
import { ensureCheckoutHousekeepingTasks } from "./actions";
import { CreateTaskForm } from "./create-task-form";
import {
  TASK_STATUS_COLUMN_STYLE,
  TASK_STATUS_ICONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
} from "./labels";
import { TaskCard } from "./task-card";

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

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_STATUS_ORDER.map((status) => {
          const Icon = TASK_STATUS_ICONS[status];
          return (
            <div key={status}>
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${TASK_STATUS_COLUMN_STYLE[status]}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {TASK_STATUS_LABELS[status]}
                <span className="opacity-70">({columns[status].length})</span>
              </div>
              <div className="mt-3 space-y-3">
                {columns[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    dueOut={task.room_id ? dueOutRoomIds.has(task.room_id) : false}
                    turnover={task.room_id ? turnoverRoomIds.has(task.room_id) : false}
                  />
                ))}
                {columns[status].length === 0 && (
                  <p className="text-sm text-slate-400">Niciun task</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
