import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import { resolveWeek } from "@/lib/date-utils";
import type { Shift, ShiftType, Staff } from "@/types/database";
import { ScheduleGrid } from "./schedule-grid";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { profile } = await requireProfile();
  const canEdit = profile.role === "admin" || profile.role === "manager";
  const { week } = await searchParams;
  const range = resolveWeek(week);
  const supabase = await createClient();

  const [{ data: staff }, { data: shiftRows }] = await Promise.all([
    supabase.from("staff").select("*").order("name").returns<Staff[]>(),
    supabase
      .from("shifts")
      .select("*")
      .gte("date", range.days[0])
      .lte("date", range.days[6])
      .returns<Shift[]>(),
  ]);

  const shifts: Record<string, ShiftType> = {};
  for (const row of shiftRows ?? []) {
    shifts[`${row.staff_id}_${row.date}`] = row.shift_type;
  }

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
          <CalendarClock className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Program tură</h1>
      </div>
      {!canEdit && (
        <p className="mt-1 text-sm text-slate-500">
          Doar administratorii și managerii pot edita programul.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <Link
          href={`/schedule?week=${range.prevParam}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Săptămâna anterioară
        </Link>
        <p className="order-first w-full text-center text-sm font-semibold text-slate-900 sm:order-none sm:w-auto">
          {range.label}
        </p>
        <Link
          href={`/schedule?week=${range.nextParam}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Săptămâna următoare
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4">
        <ScheduleGrid
          staff={staff ?? []}
          days={range.days}
          dayLabels={range.dayLabels}
          shifts={shifts}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
