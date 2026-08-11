import Link from "next/link";
import { CalendarDays, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";
import type { BookingWithRoom, Guest, Room } from "@/types/database";
import { BookingRow } from "./booking-row";
import { CreateBookingForm } from "./create-booking-form";

export default async function BookingsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: bookings }, { data: rooms }, { data: guests }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, room:rooms(id, number, floor)")
      .order("checkin", { ascending: false })
      .returns<BookingWithRoom[]>(),
    supabase.from("rooms").select("*").order("number").returns<Room[]>(),
    supabase.from("guests").select("*").order("name").returns<Guest[]>(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Rezervări</h1>
        </div>
        <Link
          href="/bookings/calendar"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:border-olive-300 hover:text-olive-800"
        >
          <LayoutGrid className="h-4 w-4" />
          Vezi calendar
        </Link>
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <CreateBookingForm rooms={rooms ?? []} guests={guests ?? []} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        {bookings && bookings.length > 0 ? (
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                <th className="pb-2">Oaspete</th>
                <th className="pb-2">Cameră</th>
                <th className="pb-2">Perioadă</th>
                <th className="pb-2">Sursă</th>
                <th className="pb-2">Preț</th>
                <th className="pb-2">Plată</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">Nicio rezervare încă. Adaugă prima mai sus.</p>
        )}
      </div>
    </div>
  );
}
