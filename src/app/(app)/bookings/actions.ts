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
  const guestId = String(formData.get("guest_id") ?? "").trim();
  const externalBookingId = String(formData.get("external_booking_id") ?? "").trim();

  if (!roomId || !guestName || !checkin || !checkout) {
    return { error: "Cameră, nume oaspete și datele de check-in/check-out sunt obligatorii." };
  }

  if (checkout <= checkin) {
    return { error: "Data de check-out trebuie să fie după check-in." };
  }

  const { data: conflicts } = await supabase
    .from("bookings")
    .select("guest_name, checkin, checkout")
    .eq("room_id", roomId)
    .neq("status", "cancelled")
    .lt("checkin", checkout)
    .gt("checkout", checkin)
    .limit(1);

  if (conflicts && conflicts.length > 0) {
    const conflict = conflicts[0];
    return {
      error: `Camera este deja rezervată în acest interval, pentru ${conflict.guest_name} (${conflict.checkin} → ${conflict.checkout}).`,
    };
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
    guest_id: guestId || null,
    external_booking_id: externalBookingId || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bookings");
  return { error: undefined };
}

export async function createGroupBooking(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const roomIds = formData.getAll("room_ids").map(String).filter(Boolean);
  const guestName = String(formData.get("guest_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const checkin = String(formData.get("checkin") ?? "");
  const checkout = String(formData.get("checkout") ?? "");
  const source = String(formData.get("source") ?? "direct") as BookingSource;
  const totalPriceRaw = String(formData.get("price") ?? "").trim();

  if (roomIds.length < 2) {
    return { error: "Selectează cel puțin 2 camere pentru o rezervare de grup." };
  }

  if (!guestName || !checkin || !checkout) {
    return { error: "Nume oaspete și datele de check-in/check-out sunt obligatorii." };
  }

  if (checkout <= checkin) {
    return { error: "Data de check-out trebuie să fie după check-in." };
  }

  for (const roomId of roomIds) {
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("guest_name, checkin, checkout, room:rooms(number)")
      .eq("room_id", roomId)
      .neq("status", "cancelled")
      .lt("checkin", checkout)
      .gt("checkout", checkin)
      .limit(1);

    if (conflicts && conflicts.length > 0) {
      const conflict = conflicts[0] as unknown as {
        guest_name: string;
        checkin: string;
        checkout: string;
        room: { number: string } | { number: string }[] | null;
      };
      const roomNumber = Array.isArray(conflict.room) ? conflict.room[0]?.number : conflict.room?.number;
      return {
        error: `Camera ${roomNumber ?? ""} este deja rezervată în acest interval, pentru ${conflict.guest_name} (${conflict.checkin} → ${conflict.checkout}).`,
      };
    }
  }

  const totalPrice = totalPriceRaw ? Number(totalPriceRaw) : null;
  const pricePerRoom = totalPrice !== null ? totalPrice / roomIds.length : null;
  const groupId = crypto.randomUUID();

  const { error } = await supabase.from("bookings").insert(
    roomIds.map((roomId) => ({
      hotel_id: profile.hotel_id,
      room_id: roomId,
      guest_name: guestName,
      phone: phone || null,
      checkin,
      checkout,
      source,
      price: pricePerRoom,
      group_id: groupId,
    })),
  );

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
