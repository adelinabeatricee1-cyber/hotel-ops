"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";

export async function setMonthlyTarget(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const targetRaw = String(formData.get("target") ?? "").trim();
  const target = targetRaw ? Number(targetRaw) : null;

  if (targetRaw && (Number.isNaN(target) || (target ?? 0) < 0)) {
    return { error: "Introdu o valoare validă." };
  }

  const { error } = await supabase
    .from("hotels")
    .update({ monthly_revenue_target: target })
    .eq("id", profile.hotel_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/reports");
  return { error: undefined };
}
