"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { RoomStatus } from "@/types/database";

export async function createRoom(_prevState: { error?: string } | undefined, formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const number = String(formData.get("number") ?? "").trim();
  const floorRaw = String(formData.get("floor") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const rateRaw = String(formData.get("nightly_rate") ?? "").trim();

  if (!number) {
    return { error: "Numărul camerei este obligatoriu." };
  }

  const { error } = await supabase.from("rooms").insert({
    hotel_id: profile.hotel_id,
    number,
    floor: floorRaw ? Number(floorRaw) : null,
    type: type || null,
    nightly_rate: rateRaw ? Number(rateRaw) : null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Există deja o cameră cu acest număr." : error.message,
    };
  }

  revalidatePath("/rooms");
  return { error: undefined };
}

export async function setRoomStatus(roomId: string, status: RoomStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").update({ status }).eq("id", roomId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/rooms");
  revalidatePath("/");
}

export async function setNightlyRate(roomId: string, rate: number | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").update({ nightly_rate: rate }).eq("id", roomId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/rooms");
}

export async function deleteRoom(roomId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/rooms");
}
