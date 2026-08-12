"use server";

import { createClient } from "@/lib/supabase/server";

export interface AvailableRoom {
  room_id: string;
  number: string;
  type: string | null;
  nightly_rate: number;
  total_price: number;
}

export async function searchAvailability(
  slug: string,
  checkin: string,
  checkout: string,
): Promise<{ rooms: AvailableRoom[]; error?: string }> {
  if (!checkin || !checkout || checkout <= checkin) {
    return { rooms: [], error: "Alege date valide (check-out după check-in)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_rooms", {
    p_slug: slug,
    p_checkin: checkin,
    p_checkout: checkout,
  });

  if (error) {
    return { rooms: [], error: "Nu am putut căuta camere disponibile." };
  }

  return { rooms: (data as AvailableRoom[] | null) ?? [] };
}

export async function submitBooking(
  slug: string,
  roomId: string,
  checkin: string,
  checkout: string,
  guestName: string,
  phone: string,
): Promise<{ token?: string; error?: string }> {
  if (!guestName.trim()) {
    return { error: "Numele este obligatoriu." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_direct_booking", {
    p_slug: slug,
    p_room_id: roomId,
    p_checkin: checkin,
    p_checkout: checkout,
    p_guest_name: guestName,
    p_phone: phone || null,
  });

  if (error) {
    return {
      error:
        error.message.includes("no longer available")
          ? "Ne pare rău, camera tocmai a fost rezervată de altcineva. Încearcă altă cameră."
          : "Nu am putut finaliza rezervarea. Încearcă din nou.",
    };
  }

  return { token: data as string };
}
