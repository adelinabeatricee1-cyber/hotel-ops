"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";

export async function switchProperty(hotelId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.rpc("switch_property", { p_hotel_id: hotelId });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function createProperty(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Numele proprietății este obligatoriu." };
  }

  const { data: newHotelId, error } = await supabase.rpc("create_property", { p_name: name });

  if (error) {
    return { error: error.message.includes("only admins") ? "Doar administratorii pot adăuga proprietăți." : error.message };
  }

  const { error: switchError } = await supabase.rpc("switch_property", {
    p_hotel_id: newHotelId as string,
  });

  if (switchError) {
    return { error: switchError.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
