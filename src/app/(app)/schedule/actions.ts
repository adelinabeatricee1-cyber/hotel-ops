"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";
import type { ShiftType } from "@/types/database";

export async function setShift(staffId: string, date: string, shiftType: ShiftType | null) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  if (shiftType === null) {
    const { error } = await supabase
      .from("shifts")
      .delete()
      .eq("staff_id", staffId)
      .eq("date", date);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("shifts")
      .upsert(
        { hotel_id: profile.hotel_id, staff_id: staffId, date, shift_type: shiftType },
        { onConflict: "staff_id,date" },
      );
    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/schedule");
}
