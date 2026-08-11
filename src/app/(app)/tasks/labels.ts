import { ListTodo, Hourglass, CheckCircle2, Sparkles, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TaskStatus, TaskType } from "@/types/database";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "De făcut",
  inprogress: "În curs",
  done: "Finalizat",
};

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "inprogress", "done"];

export const TASK_STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  todo: ListTodo,
  inprogress: Hourglass,
  done: CheckCircle2,
};

export const TASK_STATUS_COLUMN_STYLE: Record<TaskStatus, string> = {
  todo: "bg-fuchsia-100 text-fuchsia-700",
  inprogress: "bg-indigo-100 text-indigo-700",
  done: "bg-emerald-100 text-emerald-700",
};

export const TASK_STATUS_BORDER: Record<TaskStatus, string> = {
  todo: "border-t-fuchsia-400",
  inprogress: "border-t-indigo-400",
  done: "border-t-emerald-400",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  housekeeping: "Housekeeping",
  maintenance: "Mentenanță",
};

export const TASK_TYPE_ICONS: Record<TaskType, LucideIcon> = {
  housekeeping: Sparkles,
  maintenance: Wrench,
};
