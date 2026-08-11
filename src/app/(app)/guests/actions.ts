"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";

export async function createGuest(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name) {
    return { error: "Numele este obligatoriu." };
  }

  const { error } = await supabase.from("guests").insert({
    hotel_id: profile.hotel_id,
    name,
    phone: phone || null,
    email: email || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/guests");
  revalidatePath("/bookings");
  return { error: undefined };
}

export async function deleteGuest(guestId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", guestId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/guests");
  revalidatePath("/bookings");
}
