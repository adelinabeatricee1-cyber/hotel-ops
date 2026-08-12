"use client";

import { useState, useTransition } from "react";
import { CheckSquare, Square, Trash2, X } from "lucide-react";
import type { TaskStatus, TaskWithRelations } from "@/types/database";
import { deleteTasksBulk, setTaskStatusBulk } from "./actions";
import {
  TASK_STATUS_COLUMN_STYLE,
  TASK_STATUS_ICONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
} from "./labels";
import { TaskCard } from "./task-card";

const BULK_STATUS_OPTIONS: Exclude<TaskStatus, "done">[] = ["todo", "inprogress"];

export function TasksBoard({
  columns,
  dueOutRoomIds,
  turnoverRoomIds,
}: {
  columns: Record<TaskStatus, TaskWithRelations[]>;
  dueOutRoomIds: Set<string>;
  turnoverRoomIds: Set<string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allTaskIds = TASK_STATUS_ORDER.flatMap((status) => columns[status].map((t) => t.id));

  function toggleSelect(taskId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === allTaskIds.length ? new Set() : new Set(allTaskIds)));
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function handleBulkStatus(status: Exclude<TaskStatus, "done">) {
    startTransition(async () => {
      await setTaskStatusBulk([...selected], status);
      setSelected(new Set());
    });
  }

  function handleBulkDelete() {
    if (!confirm(`Ștergi ${selected.size} task-uri selectate?`)) return;
    startTransition(async () => {
      await deleteTasksBulk([...selected]);
      setSelected(new Set());
    });
  }

  return (
    <div>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          {selectMode ? <X className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
          {selectMode ? "Anulează selecția" : "Selectează mai multe"}
        </button>
        {selectMode && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-olive-700 hover:text-olive-800"
          >
            <Square className="h-3.5 w-3.5" />
            {selected.size === allTaskIds.length ? "Deselectează tot" : "Selectează tot"}
          </button>
        )}
      </div>

      {selectMode && selected.size > 0 && (
        <div className="sticky top-2 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-olive-200 bg-olive-50 px-4 py-2.5 shadow-sm">
          <span className="text-xs font-semibold text-olive-800">{selected.size} selectate</span>
          <span className="text-xs text-olive-600">Marchează:</span>
          {BULK_STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus(status)}
              className="rounded-md border border-olive-300 bg-white px-2 py-1 text-xs font-medium text-olive-800 hover:bg-olive-100 disabled:opacity-50"
            >
              {TASK_STATUS_LABELS[status]}
            </button>
          ))}
          <button
            type="button"
            disabled={isPending}
            onClick={handleBulkDelete}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Șterge
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                    selected={selected.has(task.id)}
                    onToggleSelect={selectMode ? toggleSelect : undefined}
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
