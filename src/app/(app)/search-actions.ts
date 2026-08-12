"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";

export interface SearchResult {
  type: "booking" | "room" | "guest" | "staff";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { profile } = await requireProfile();
  const canSeePayments = profile.role === "admin" || profile.role === "manager";
  const supabase = await createClient();
  const like = `%${trimmed}%`;

  async function searchRooms(): Promise<SearchResult[]> {
    const { data } = await supabase.from("rooms").select("id, number, floor, type").ilike("number", like).limit(5);
    return (data ?? []).map((r) => ({
      type: "room" as const,
      id: r.id,
      title: `Camera ${r.number}`,
      subtitle: r.type ?? (r.floor !== null ? `Etaj ${r.floor}` : ""),
      href: "/rooms",
    }));
  }

  async function searchStaff(): Promise<SearchResult[]> {
    const { data } = await supabase.from("staff").select("id, name, role").ilike("name", like).limit(5);
    return (data ?? []).map((s) => ({
      type: "staff" as const,
      id: s.id,
      title: s.name,
      subtitle: s.role ?? "Personal",
      href: "/staff",
    }));
  }

  async function searchBookings(): Promise<SearchResult[]> {
    const { data } = await supabase
      .from("bookings")
      .select("id, guest_name, phone, checkin, checkout, room:rooms(number)")
      .or(`guest_name.ilike.${like},phone.ilike.${like}`)
      .order("checkin", { ascending: false })
      .limit(5);
    return (data ?? []).map((b) => {
      const room = Array.isArray(b.room) ? b.room[0] : b.room;
      return {
        type: "booking" as const,
        id: b.id,
        title: b.guest_name,
        subtitle: `${room ? `Camera ${room.number} · ` : ""}${b.checkin} → ${b.checkout}`,
        href: `/bookings/${b.id}/invoice`,
      };
    });
  }

  async function searchGuests(): Promise<SearchResult[]> {
    const { data } = await supabase
      .from("guests")
      .select("id, name, phone")
      .or(`name.ilike.${like},phone.ilike.${like}`)
      .limit(5);
    return (data ?? []).map((g) => ({
      type: "guest" as const,
      id: g.id,
      title: g.name,
      subtitle: g.phone ?? "Client fidel",
      href: "/guests",
    }));
  }

  const queries = [searchRooms(), searchStaff()];
  if (canSeePayments) {
    queries.push(searchBookings(), searchGuests());
  }

  const results = await Promise.all(queries);
  return results.flat();
}
