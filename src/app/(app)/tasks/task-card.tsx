"use client";

import { useTransition } from "react";
import { Trash2, User } from "lucide-react";
import type { TaskStatus, TaskWithRelations } from "@/types/database";
import { deleteTask, setTaskStatus } from "./actions";
import {
  TASK_STATUS_BORDER,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  TASK_TYPE_ICONS,
  TASK_TYPE_LABELS,
} from "./labels";

export function TaskCard({ task }: { task: TaskWithRelations }) {
  const [isPending, startTransition] = useTransition();
  const TypeIcon = TASK_TYPE_ICONS[task.type];

  function handleStatusChange(status: TaskStatus) {
    startTransition(() => setTaskStatus(task.id, status));
  }

  function handleDelete() {
    if (!confirm("Ștergi acest task?")) return;
    startTransition(() => deleteTask(task.id));
  }

  return (
    <div
      className={`rounded-xl border border-slate-100 border-t-4 bg-white p-4 shadow-sm transition hover:shadow-md ${TASK_STATUS_BORDER[task.status]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Camera {task.room?.number ?? "—"}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
            <TypeIcon className="h-3 w-3" />
            {TASK_TYPE_LABELS[task.type]}
          </p>
        </div>
        <span className="text-xs text-slate-400">
          {new Date(task.created_at).toLocaleDateString("ro-RO")}
        </span>
      </div>

      <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
        <User className="h-3.5 w-3.5 text-slate-400" />
        {task.staff?.name ? task.staff.name : "Neasignat"}
      </p>
      {task.notes && <p className="mt-1 text-sm text-slate-500">{task.notes}</p>}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TASK_STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            disabled={isPending || status === task.status}
            onClick={() => handleStatusChange(status)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-olive-300 hover:bg-olive-50 hover:text-olive-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-600"
          >
            {TASK_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
      >
        <Trash2 className="h-3 w-3" />
        Șterge task
      </button>
    </div>
  );
}
