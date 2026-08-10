"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";

export async function createStaff(_prevState: { error?: string } | undefined, formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) {
    return { error: "Numele este obligatoriu." };
  }

  const { error } = await supabase.from("staff").insert({
    hotel_id: profile.hotel_id,
    name,
    role: role || null,
    phone: phone || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/staff");
  return { error: undefined };
}

export async function deleteStaff(staffId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("staff").delete().eq("id", staffId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/staff");
}
