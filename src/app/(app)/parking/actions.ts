"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { ParkingStatus } from "@/types/database";

export async function createParkingSpot(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const label = String(formData.get("label") ?? "").trim();

  if (!label) {
    return { error: "Numărul locului este obligatoriu." };
  }

  const { error } = await supabase.from("parking_spots").insert({
    hotel_id: profile.hotel_id,
    label,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Există deja un loc cu acest număr." : error.message,
    };
  }

  revalidatePath("/parking");
  return { error: undefined };
}

export async function setParkingStatus(
  spotId: string,
  status: ParkingStatus,
  guestName: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("parking_spots")
    .update({ status, guest_name: status === "occupied" ? guestName || null : null })
    .eq("id", spotId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/parking");
}

export async function deleteParkingSpot(spotId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("parking_spots").delete().eq("id", spotId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/parking");
}
