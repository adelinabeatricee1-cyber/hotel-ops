import { createClient } from "@/lib/supabase/server";
import type { Room, Staff, TaskStatus, TaskWithRelations } from "@/types/database";
import { CreateTaskForm } from "./create-task-form";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "./labels";
import { TaskCard } from "./task-card";

export default async function TasksPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: rooms }, { data: staff }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, room:rooms(id, number, floor), staff:staff(id, name)")
      .order("created_at", { ascending: false })
      .returns<TaskWithRelations[]>(),
    supabase.from("rooms").select("*").order("number").returns<Room[]>(),
    supabase.from("staff").select("*").order("name").returns<Staff[]>(),
  ]);

  const columns: Record<TaskStatus, TaskWithRelations[]> = { todo: [], inprogress: [], done: [] };
  for (const task of tasks ?? []) {
    columns[task.status].push(task);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Housekeeping</h1>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <CreateTaskForm rooms={rooms ?? []} staff={staff ?? []} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_STATUS_ORDER.map((status) => (
          <div key={status}>
            <h2 className="text-sm font-medium text-slate-700">
              {TASK_STATUS_LABELS[status]}{" "}
              <span className="text-slate-400">({columns[status].length})</span>
            </h2>
            <div className="mt-2 space-y-3">
              {columns[status].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {columns[status].length === 0 && (
                <p className="text-sm text-slate-400">Niciun task</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
