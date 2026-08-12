"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { ChecklistItem, TaskStatus, TaskType } from "@/types/database";
import { DEFAULT_CHECKLIST } from "./labels";

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
