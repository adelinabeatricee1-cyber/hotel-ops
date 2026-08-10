import type { TaskStatus, TaskType } from "@/types/database";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "De făcut",
  inprogress: "În curs",
  done: "Finalizat",
};

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "inprogress", "done"];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  housekeeping: "Housekeeping",
  maintenance: "Mentenanță",
};
