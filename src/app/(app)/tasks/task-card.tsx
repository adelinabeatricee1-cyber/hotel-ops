"use client";

import { useTransition } from "react";
import type { TaskStatus, TaskWithRelations } from "@/types/database";
import { deleteTask, setTaskStatus } from "./actions";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, TASK_TYPE_LABELS } from "./labels";

export function TaskCard({ task }: { task: TaskWithRelations }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: TaskStatus) {
    startTransition(() => setTaskStatus(task.id, status));
  }

  function handleDelete() {
    if (!confirm("Ștergi acest task?")) return;
    startTransition(() => deleteTask(task.id));
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Camera {task.room?.number ?? "—"}
          </p>
          <p className="text-xs text-slate-500">{TASK_TYPE_LABELS[task.type]}</p>
        </div>
        <span className="text-xs text-slate-400">
          {new Date(task.created_at).toLocaleDateString("ro-RO")}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {task.staff?.name ? `Asignat: ${task.staff.name}` : "Neasignat"}
      </p>
      {task.notes && <p className="mt-1 text-sm text-slate-500">{task.notes}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TASK_STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            disabled={isPending || status === task.status}
            onClick={() => handleStatusChange(status)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {TASK_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="mt-3 text-xs text-red-600 hover:underline disabled:opacity-40"
      >
        Șterge task
      </button>
    </div>
  );
}
