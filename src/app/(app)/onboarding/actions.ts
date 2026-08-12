"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";

export async function bulkCreateRooms(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const count = Number(formData.get("count") ?? 0);
  const startNumber = Number(formData.get("start_number") ?? 0);
  const floorRaw = String(formData.get("floor") ?? "").trim();
  const rateRaw = String(formData.get("nightly_rate") ?? "").trim();

  if (!Number.isInteger(count) || count < 1 || count > 200) {
    return { error: "Alege un număr de camere între 1 și 200." };
  }
  if (!Number.isInteger(startNumber) || startNumber < 1) {
    return { error: "Numărul primei camere trebuie să fie un întreg pozitiv." };
  }

  const floor = floorRaw ? Number(floorRaw) : null;
  const nightlyRate = rateRaw ? Number(rateRaw) : null;

  const rooms = Array.from({ length: count }, (_, i) => ({
    hotel_id: profile.hotel_id,
    number: String(startNumber + i),
    floor,
    nightly_rate: nightlyRate,
  }));

  const { error } = await supabase.from("rooms").insert(rooms);

  if (error) {
    return {
      error: error.code === "23505" ? "Unele dintre aceste camere există deja." : error.message,
    };
  }

  revalidatePath("/rooms");
  revalidatePath("/onboarding");
  revalidatePath("/");
  return { error: undefined };
}
