import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";
import { resolveMonth } from "@/lib/date-utils";
import type { Room, RoomRateOverride } from "@/types/database";
import { RateCalendar } from "./rate-calendar";

export default async function RoomRatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { month } = await searchParams;
  const range = resolveMonth(month);
  const supabase = await createClient();

  const [{ data: room }, { data: overridesData }] = await Promise.all([
    supabase.from("rooms").select("*").eq("id", id).single<Room>(),
    supabase
      .from("room_rate_overrides")
      .select("*")
      .eq("room_id", id)
      .gte("date", range.startDate)
      .lte("date", range.endDate)
      .returns<RoomRateOverride[]>(),
  ]);

  if (!room) {
    notFound();
  }

  if (room.nightly_rate === null) {
    return (
      <div>
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la camere
        </Link>
        <p className="mt-6 text-sm text-slate-500">
          Camera {room.number} nu are un preț standard/noapte setat încă. Adaugă unul în pagina
          Camere înainte de a personaliza tarife pe zile.
        </p>
      </div>
    );
  }

  const overrides: Record<string, number> = {};
  for (const o of overridesData ?? []) {
    overrides[o.date] = Number(o.rate);
  }

  return (
    <div>
      <Link
        href="/rooms"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la camere
      </Link>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
          <Tag className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Tarife — Camera {room.number} ({room.nightly_rate!.toFixed(2)} RON standard)
        </h1>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <Link
          href={`/rooms/${id}/rates?month=${range.prevParam}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Luna anterioară
        </Link>
        <p className="text-sm font-semibold text-slate-900">{range.label}</p>
        <Link
          href={`/rooms/${id}/rates?month=${range.nextParam}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Luna următoare
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4">
        <RateCalendar
          roomId={id}
          days={range.days}
          defaultRate={room.nightly_rate!}
          overrides={overrides}
        />
      </div>
    </div>
  );
}
