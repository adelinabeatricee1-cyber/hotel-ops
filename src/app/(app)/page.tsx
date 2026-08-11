import { Sparkles, Brush, Loader, Ban, ListTodo, Hourglass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { RoomStatus, TaskStatus } from "@/types/database";

const ROOM_STATUS_META: Record<
  RoomStatus,
  { label: string; icon: LucideIcon; ring: string; iconWrap: string }
> = {
  clean: {
    label: "Curate",
    icon: Sparkles,
    ring: "border-emerald-100",
    iconWrap: "bg-emerald-100 text-emerald-600",
  },
  dirty: {
    label: "De curățat",
    icon: Brush,
    ring: "border-amber-100",
    iconWrap: "bg-amber-100 text-amber-600",
  },
  inprogress: {
    label: "În curs",
    icon: Loader,
    ring: "border-sky-100",
    iconWrap: "bg-sky-100 text-sky-600",
  },
  blocked: {
    label: "Blocate",
    icon: Ban,
    ring: "border-red-100",
    iconWrap: "bg-red-100 text-red-600",
  },
};

const TASK_STATUS_META: Record<
  Exclude<TaskStatus, "done">,
  { label: string; icon: LucideIcon; iconWrap: string }
> = {
  todo: { label: "De făcut", icon: ListTodo, iconWrap: "bg-fuchsia-100 text-fuchsia-600" },
  inprogress: { label: "În curs", icon: Hourglass, iconWrap: "bg-indigo-100 text-indigo-600" },
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
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-600/20">
        <h1 className="text-2xl font-bold">Bun venit, {hotel.name}</h1>
        <p className="mt-1 text-sm text-indigo-100">Sumar operațional</p>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">Camere ({totalRooms})</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(Object.keys(ROOM_STATUS_META) as RoomStatus[]).map((status) => {
            const meta = ROOM_STATUS_META[status];
            const Icon = meta.icon;
            return (
              <div
                key={status}
                className={`rounded-xl border bg-white p-4 shadow-sm ${meta.ring}`}
              >
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${meta.iconWrap}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{roomCounts[status]}</p>
                <p className="text-xs text-slate-500">{meta.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">Task-uri active</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["todo", "inprogress"] as const).map((status) => {
            const meta = TASK_STATUS_META[status];
            const Icon = meta.icon;
            return (
              <div key={status} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${meta.iconWrap}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{taskCounts[status]}</p>
                <p className="text-xs text-slate-500">{meta.label}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
