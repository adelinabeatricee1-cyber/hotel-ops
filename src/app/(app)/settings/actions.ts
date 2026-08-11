"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";

export async function updateGuestSettings(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const wifiNetwork = String(formData.get("wifi_network") ?? "").trim();
  const wifiPassword = String(formData.get("wifi_password") ?? "").trim();
  const receptionPhone = String(formData.get("reception_phone") ?? "").trim();

  const { error } = await supabase
    .from("hotels")
    .update({
      wifi_network: wifiNetwork || null,
      wifi_password: wifiPassword || null,
      reception_phone: receptionPhone || null,
    })
    .eq("id", profile.hotel_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { error: undefined, success: true };
}
