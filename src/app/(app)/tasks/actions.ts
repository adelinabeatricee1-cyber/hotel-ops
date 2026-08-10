"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { TaskStatus, TaskType } from "@/types/database";

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

  const { error } = await supabase.from("tasks").insert({
    hotel_id: profile.hotel_id,
    room_id: roomId,
    type,
    assigned_to: assignedTo || null,
    notes: notes || null,
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
