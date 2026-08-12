"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Camera, Clock3, Trash2, User } from "lucide-react";
import type { TaskStatus, TaskWithRelations } from "@/types/database";
import { deleteTask, setTaskStatus, toggleChecklistItem, uploadTaskPhoto } from "./actions";
import {
  TASK_STATUS_BORDER,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  TASK_TYPE_ICONS,
  TASK_TYPE_LABELS,
} from "./labels";

export function TaskCard({
  task,
  dueOut = false,
  turnover = false,
}: {
  task: TaskWithRelations;
  dueOut?: boolean;
  turnover?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const TypeIcon = TASK_TYPE_ICONS[task.type];
  const isPriority = task.status !== "done" && (dueOut || turnover);

  const checklistComplete = task.checklist.length === 0 || task.checklist.every((item) => item.done);
  const requiresProof = task.type === "housekeeping" && task.checklist.length > 0;
  const canComplete = !requiresProof || (checklistComplete && !!task.photo_url);

  function handleStatusChange(status: TaskStatus) {
    startTransition(() => setTaskStatus(task.id, status));
  }

  function handleToggleChecklist(index: number) {
    startTransition(() => toggleChecklistItem(task.id, index));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 9 * 1024 * 1024) {
      setPhotoError("Poza e prea mare (max 9MB). Încearcă o poză mai mică sau comprimată.");
      return;
    }
    const formData = new FormData();
    formData.append("photo", file);
    setPhotoError(null);
    startTransition(async () => {
      const result = await uploadTaskPhoto(task.id, formData);
      if (result?.error) setPhotoError(result.error);
    });
  }

  function handleDelete() {
    if (!confirm("Ștergi acest task?")) return;
    startTransition(() => deleteTask(task.id));
  }

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        isPriority
          ? turnover
            ? "border-red-200 border-t-4 border-t-red-500 ring-1 ring-red-100"
            : "border-amber-200 border-t-4 border-t-amber-500 ring-1 ring-amber-100"
          : `border-slate-100 border-t-4 ${TASK_STATUS_BORDER[task.status]}`
      }`}
    >
      {isPriority && (
        <div
          className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            turnover ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {turnover ? <AlertTriangle className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
          {turnover ? "Turnover azi — sosire nouă!" : "Prioritate — eliberare azi"}
        </div>
      )}

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

      {task.checklist.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-2">
          {task.checklist.map((item, index) => (
            <label key={item.label} className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={item.done}
                disabled={isPending}
                onChange={() => handleToggleChecklist(index)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-olive-600 focus:ring-olive-500"
              />
              <span className={item.done ? "text-slate-400 line-through" : ""}>{item.label}</span>
            </label>
          ))}
        </div>
      )}

      {requiresProof && (
        <div className="mt-3">
          {task.photo_url ? (
            <a href={task.photo_url} target="_blank" rel="noopener noreferrer" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.photo_url}
                alt="Dovadă curățenie"
                className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
              />
            </a>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-olive-700 hover:text-olive-800">
              <Camera className="h-3.5 w-3.5" />
              {isPending ? "Se încarcă..." : "Adaugă poză dovadă"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={isPending}
              />
            </label>
          )}
          {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
          {!canComplete && (
            <p className="mt-1 text-xs text-slate-400">
              Bifează toate punctele și adaugă o poză pentru a finaliza.
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TASK_STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            disabled={isPending || status === task.status || (status === "done" && !canComplete)}
            onClick={() => handleStatusChange(status)}
            title={status === "done" && !canComplete ? "Bifează checklist-ul și adaugă o poză mai întâi" : undefined}
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
