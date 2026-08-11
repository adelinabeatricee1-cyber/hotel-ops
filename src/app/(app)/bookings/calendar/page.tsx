import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";
import { dayOfMonthLabel, isWeekend, resolveMonth } from "@/lib/date-utils";
import type { Room } from "@/types/database";

interface BookingSlim {
  id: string;
  room_id: string | null;
  guest_name: string;
  checkin: string;
  checkout: string;
}

export default async function BookingsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();
  const { month } = await searchParams;
  const range = resolveMonth(month);
  const supabase = await createClient();

  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    supabase.from("rooms").select("*").order("floor").order("number").returns<Room[]>(),
    supabase
      .from("bookings")
      .select("id, room_id, guest_name, checkin, checkout")
      .neq("status", "cancelled")
      .lte("checkin", range.endDate)
      .gte("checkout", range.startDate)
      .returns<BookingSlim[]>(),
  ]);

  const byRoom = new Map<string, BookingSlim[]>();
  for (const booking of bookings ?? []) {
    if (!booking.room_id) continue;
    const list = byRoom.get(booking.room_id) ?? [];
    list.push(booking);
    byRoom.set(booking.room_id, list);
  }

  function findBooking(roomId: string, day: string) {
    const list = byRoom.get(roomId);
    if (!list) return null;
    return list.find((b) => day >= b.checkin && day < b.checkout) ?? null;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar disponibilitate</h1>
        </div>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-700"
        >
          <List className="h-4 w-4" />
          Vezi listă
        </Link>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <Link
          href={`/bookings/calendar?month=${range.prevParam}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Luna anterioară
        </Link>
        <p className="text-sm font-semibold text-slate-900">{range.label}</p>
        <Link
          href={`/bookings/calendar?month=${range.nextParam}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Luna următoare
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-medium text-slate-500">
                Cameră
              </th>
              {range.days.map((day) => (
                <th
                  key={day}
                  className={`border-b border-slate-200 px-1.5 py-2 text-center font-medium ${
                    isWeekend(day) ? "bg-indigo-50 text-indigo-600" : "text-slate-500"
                  }`}
                >
                  {dayOfMonthLabel(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rooms ?? []).map((room) => (
              <tr key={room.id} className="border-b border-slate-100 last:border-0">
                <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
                  {room.number}
                </td>
                {range.days.map((day) => {
                  const booking = findBooking(room.id, day);
                  return (
                    <td key={day} className="px-0.5 py-1.5 text-center">
                      {booking ? (
                        <span
                          title={`${booking.guest_name} · ${booking.checkin} → ${booking.checkout}`}
                          className="mx-auto flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-semibold text-white"
                        >
                          {booking.guest_name.trim().charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <span className="mx-auto block h-6 w-6 rounded bg-slate-50" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {(!rooms || rooms.length === 0) && (
              <tr>
                <td colSpan={range.days.length + 1} className="py-6 text-center text-slate-400">
                  Nicio cameră adăugată încă.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
