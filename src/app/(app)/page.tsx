import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { RoomStatus, TaskStatus } from "@/types/database";

const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  clean: "Curate",
  dirty: "De curățat",
  inprogress: "În curs",
  blocked: "Blocate",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "De făcut",
  inprogress: "În curs",
  done: "Finalizate",
};

export default async function DashboardPage() {
  const { hotel } = await requireProfile();
  const supabase = await createClient();

  const [{ data: rooms }, { data: tasks }] = await Promise.all([
    supabase.from("rooms").select("status"),
    supabase.from("tasks").select("status").neq("status", "done"),
  ]);

  const roomCounts: Record<RoomStatus, number> = { clean: 0, dirty: 0, inprogress: 0, blocked: 0 };
  for (const room of rooms ?? []) {
    roomCounts[room.status as RoomStatus] += 1;
  }

  const taskCounts: Record<TaskStatus, number> = { todo: 0, inprogress: 0, done: 0 };
  for (const task of tasks ?? []) {
    taskCounts[task.status as TaskStatus] += 1;
  }

  const totalRooms = rooms?.length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Bun venit, {hotel.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Sumar operațional</p>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Camere ({totalRooms})</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(ROOM_STATUS_LABELS) as RoomStatus[]).map((status) => (
            <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-2xl font-semibold text-slate-900">{roomCounts[status]}</p>
              <p className="text-xs text-slate-500">{ROOM_STATUS_LABELS[status]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Task-uri active</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["todo", "inprogress"] as TaskStatus[]).map((status) => (
            <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-2xl font-semibold text-slate-900">{taskCounts[status]}</p>
              <p className="text-xs text-slate-500">{TASK_STATUS_LABELS[status]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
