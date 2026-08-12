"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";

export async function addBookingAddon(
  bookingId: string,
  name: string,
  unitPrice: number,
  quantity: number,
) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  if (!name.trim()) {
    throw new Error("Numele extra-ului este obligatoriu.");
  }
  if (!(unitPrice >= 0) || !Number.isFinite(unitPrice)) {
    throw new Error("Preț invalid.");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Cantitate invalidă.");
  }

  const { error: insertError } = await supabase.from("booking_addons").insert({
    hotel_id: profile.hotel_id,
    booking_id: bookingId,
    name: name.trim(),
    unit_price: unitPrice,
    quantity,
  });
  if (insertError) {
    throw new Error(insertError.message);
  }

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("price")
    .eq("id", bookingId)
    .single();
  if (fetchError || !booking) {
    throw new Error(fetchError?.message ?? "Rezervare inexistentă.");
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ price: (booking.price ?? 0) + unitPrice * quantity })
    .eq("id", bookingId);
  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath(`/bookings/${bookingId}/invoice`);
  revalidatePath("/bookings");
  revalidatePath("/");
}

export async function removeBookingAddon(addonId: string) {
  const supabase = await createClient();

  const { data: addon, error: fetchAddonError } = await supabase
    .from("booking_addons")
    .select("booking_id, unit_price, quantity")
    .eq("id", addonId)
    .single();
  if (fetchAddonError || !addon) {
    throw new Error(fetchAddonError?.message ?? "Extra inexistent.");
  }

  const { error: deleteError } = await supabase.from("booking_addons").delete().eq("id", addonId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("price")
    .eq("id", addon.booking_id)
    .single();

  await supabase
    .from("bookings")
    .update({ price: Math.max((booking?.price ?? 0) - addon.unit_price * addon.quantity, 0) })
    .eq("id", addon.booking_id);

  revalidatePath(`/bookings/${addon.booking_id}/invoice`);
  revalidatePath("/bookings");
  revalidatePath("/");
}
