"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import { todayDateString } from "@/lib/date-utils";
import type { ChecklistItem, TaskStatus, TaskType } from "@/types/database";
import { DEFAULT_CHECKLIST } from "./labels";

// Called from the Tasks page on every load: for any room checking out today
// that doesn't already have a housekeeping task created today, auto-creates
// one. Idempotent (safe to call repeatedly) — no separate cron job needed.
export async function ensureCheckoutHousekeepingTasks() {
  const { profile } = await requireProfile();
  const supabase = await createClient();
  const today = todayDateString();

  const { data: dueOutBookings } = await supabase
    .from("bookings")
    .select("room_id")
    .eq("checkout", today)
    .in("status", ["confirmed", "checked_in"]);

  const roomIds = [
    ...new Set((dueOutBookings ?? []).map((b) => b.room_id).filter((id): id is string => Boolean(id))),
  ];
  if (roomIds.length === 0) return;

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("room_id")
    .eq("type", "housekeeping")
    .in("room_id", roomIds)
    .gte("created_at", today);

  const roomsWithTask = new Set((existingTasks ?? []).map((t) => t.room_id));
  const roomsNeedingTask = roomIds.filter((id) => !roomsWithTask.has(id));
  if (roomsNeedingTask.length === 0) return;

  const checklist: ChecklistItem[] = DEFAULT_CHECKLIST.housekeeping.map((label) => ({ label, done: false }));

  await supabase.from("tasks").insert(
    roomsNeedingTask.map((roomId) => ({
      hotel_id: profile.hotel_id,
      room_id: roomId,
      type: "housekeeping" as TaskType,
      notes: "Curățenie automată — cameră eliberată azi.",
      checklist,
    })),
  );

  await supabase
    .from("rooms")
    .update({ status: "dirty" })
    .in("id", roomsNeedingTask)
    .eq("status", "clean");
}

export async function createTask(_prevState: { error?: string } | undefined, formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const roomId = String(formData.get("room_id") ?? "");
  const type = String(formData.get("type") ?? "housekeeping") as TaskType;
  const assignedTo = String(formData.get("assigned_to") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!roomId) {
    return { error: "Selectează o cameră." };
  }

  const checklist: ChecklistItem[] = DEFAULT_CHECKLIST[type].map((label) => ({ label, done: false }));

  const { error } = await supabase.from("tasks").insert({
    hotel_id: profile.hotel_id,
    room_id: roomId,
    type,
    assigned_to: assignedTo || null,
    notes: notes || null,
    checklist,
  });

  if (error) {
    return { error: error.message };
  }

  // A housekeeping task starting up implies the room needs attention.
  if (type === "housekeeping") {
    await supabase.from("rooms").update({ status: "dirty" }).eq("id", roomId).eq("status", "clean");
  }

  revalidatePath("/tasks");
  revalidatePath("/rooms");
  revalidatePath("/");
  return { error: undefined };
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .select("room_id, type")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (task?.room_id && task.type === "housekeeping") {
    if (status === "inprogress") {
      await supabase.from("rooms").update({ status: "inprogress" }).eq("id", task.room_id);
    } else if (status === "done") {
      await supabase.from("rooms").update({ status: "clean" }).eq("id", task.room_id);
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/rooms");
  revalidatePath("/");
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
}

// Bulk status change, restricted to todo/inprogress: forcing many tasks to
// "done" at once would bypass the per-task checklist + photo-proof gate on
// housekeeping tasks, so "Finalizat" stays a per-card action.
export async function setTaskStatusBulk(taskIds: string[], status: Exclude<TaskStatus, "done">) {
  if (taskIds.length === 0) return;
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .update({ status })
    .in("id", taskIds)
    .select("room_id, type");

  if (error) {
    throw new Error(error.message);
  }

  if (status === "inprogress") {
    const roomIds = (tasks ?? [])
      .filter((t) => t.type === "housekeeping" && t.room_id)
      .map((t) => t.room_id as string);
    if (roomIds.length > 0) {
      await supabase.from("rooms").update({ status: "inprogress" }).in("id", roomIds);
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/rooms");
  revalidatePath("/");
}

export async function deleteTasksBulk(taskIds: string[]) {
  if (taskIds.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().in("id", taskIds);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
}

export async function toggleChecklistItem(taskId: string, index: number) {
  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("checklist")
    .eq("id", taskId)
    .single<{ checklist: ChecklistItem[] }>();

  if (fetchError || !task) {
    throw new Error(fetchError?.message ?? "Task inexistent");
  }

  const checklist = task.checklist.map((item, i) =>
    i === index ? { ...item, done: !item.done } : item,
  );

  const { error } = await supabase.from("tasks").update({ checklist }).eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
}

export async function uploadTaskPhoto(taskId: string, formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Alege o poză." };
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${profile.hotel_id}/${taskId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("task-photos").upload(path, file, {
    contentType: file.type || undefined,
  });

  if (uploadError) {
    return { error: "Nu am putut încărca poza." };
  }

  const { data: publicUrl } = supabase.storage.from("task-photos").getPublicUrl(path);

  const { error } = await supabase
    .from("tasks")
    .update({ photo_url: publicUrl.publicUrl })
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tasks");
  return { error: undefined };
}
