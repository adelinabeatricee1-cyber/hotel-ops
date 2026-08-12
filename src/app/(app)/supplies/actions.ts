"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";

export async function createSupply(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || "buc";
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const thresholdRaw = String(formData.get("low_stock_threshold") ?? "").trim();

  if (!name) {
    return { error: "Numele produsului este obligatoriu." };
  }

  const { error } = await supabase.from("supplies").insert({
    hotel_id: profile.hotel_id,
    name,
    unit,
    quantity: quantityRaw ? Number(quantityRaw) : 0,
    low_stock_threshold: thresholdRaw ? Number(thresholdRaw) : 5,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "Există deja un produs cu acest nume." : error.message,
    };
  }

  revalidatePath("/supplies");
  return { error: undefined };
}

export async function adjustSupplyQuantity(supplyId: string, delta: number) {
  const supabase = await createClient();

  const { data: supply, error: fetchError } = await supabase
    .from("supplies")
    .select("quantity")
    .eq("id", supplyId)
    .single<{ quantity: number }>();

  if (fetchError || !supply) {
    throw new Error(fetchError?.message ?? "Produs inexistent");
  }

  const quantity = Math.max(0, supply.quantity + delta);

  const { error } = await supabase.from("supplies").update({ quantity }).eq("id", supplyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/supplies");
}

export async function setLowStockThreshold(supplyId: string, threshold: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("supplies")
    .update({ low_stock_threshold: Math.max(0, threshold) })
    .eq("id", supplyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/supplies");
}

export async function deleteSupply(supplyId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("supplies").delete().eq("id", supplyId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/supplies");
}
