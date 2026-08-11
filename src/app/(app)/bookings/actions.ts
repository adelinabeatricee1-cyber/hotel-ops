"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { BookingSource, PaymentStatus } from "@/types/database";

export async function createBooking(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const roomId = String(formData.get("room_id") ?? "");
  const guestName = String(formData.get("guest_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const checkin = String(formData.get("checkin") ?? "");
  const checkout = String(formData.get("checkout") ?? "");
  const source = String(formData.get("source") ?? "direct") as BookingSource;
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (!roomId || !guestName || !checkin || !checkout) {
    return { error: "Cameră, nume oaspete și datele de check-in/check-out sunt obligatorii." };
  }

  if (checkout <= checkin) {
    return { error: "Data de check-out trebuie să fie după check-in." };
  }

  const { error } = await supabase.from("bookings").insert({
    hotel_id: profile.hotel_id,
    room_id: roomId,
    guest_name: guestName,
    phone: phone || null,
    checkin,
    checkout,
    source,
    price: priceRaw ? Number(priceRaw) : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bookings");
  return { error: undefined };
}

export async function setPaymentStatus(
  bookingId: string,
  paymentStatus: PaymentStatus,
  amountPaid: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: paymentStatus, amount_paid: amountPaid })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/bookings");
}

export async function issueInvoice(bookingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_invoice_number", {
    p_booking_id: bookingId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}/invoice`);
}

export async function deleteBooking(bookingId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/bookings");
}
