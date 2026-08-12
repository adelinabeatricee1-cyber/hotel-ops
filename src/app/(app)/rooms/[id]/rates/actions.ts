"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";

export async function setRateOverride(roomId: string, date: string, rate: number | null) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  if (rate === null) {
    const { error } = await supabase
      .from("room_rate_overrides")
      .delete()
      .eq("room_id", roomId)
      .eq("date", date);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("room_rate_overrides")
      .upsert(
        { hotel_id: profile.hotel_id, room_id: roomId, date, rate },
        { onConflict: "room_id,date" },
      );
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/rooms/${roomId}/rates`);
}
