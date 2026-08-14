import Link from "next/link";
import { BarChart3, ChevronLeft, ChevronRight, Percent, Wallet, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";
import { lastMonths, resolveMonth } from "@/lib/date-utils";
import type { BookingSource } from "@/types/database";
import { PAYMENT_STATUS_LABELS, SOURCE_LABELS } from "../bookings/labels";
import { ExportButtons, type ExportRow } from "./export-buttons";
import { TargetCard } from "./target-card";
import { TrendChart } from "./trend-chart";

interface BookingSlim {
  checkin: string;
  checkout: string;
  price: number | null;
  amount_paid: number;
  source: BookingSource;
}

const SOURCE_ORDER: BookingSource[] = ["direct", "booking", "expedia"];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { hotel } = await requireAdmin();
  const { month } = await searchParams;
  const range = resolveMonth(month);
  const supabase = await createClient();

  const monthEndExclusive = new Date(`${range.endDate}T00:00:00Z`);
  monthEndExclusive.setUTCDate(monthEndExclusive.getUTCDate() + 1);

  const [{ count: totalRooms }, { data: bookings }] = await Promise.all([
    supabase.from("rooms").select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("checkin, checkout, price, amount_paid, source")
      .neq("status", "cancelled")
      .gte("checkin", range.startDate)
      .lte("checkin", range.endDate)
      .returns<BookingSlim[]>(),
  ]);

  let totalNights = 0;
  let totalRevenue = 0;
  let totalCollected = 0;
  const bySource: Record<BookingSource, { count: number; revenue: number }> = {
    direct: { count: 0, revenue: 0 },
    booking: { count: 0, revenue: 0 },
    expedia: { count: 0, revenue: 0 },
  };

  for (const booking of bookings ?? []) {
    const checkin = new Date(`${booking.checkin}T00:00:00Z`);
    const checkoutRaw = new Date(`${booking.checkout}T00:00:00Z`);
    const checkout = checkoutRaw < monthEndExclusive ? checkoutRaw : monthEndExclusive;
    const nights = Math.max(
      Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );
    totalNights += nights;

    const price = booking.price ?? 0;
    totalRevenue += price;
    totalCollected += booking.amount_paid;

    bySource[booking.source].count += 1;
    bySource[booking.source].revenue += price;
  }

  const totalDue = Math.max(totalRevenue - totalCollected, 0);
  const capacity = (totalRooms ?? 0) * range.days.length;
  const occupancyRate = capacity > 0 ? (totalNights / capacity) * 100 : 0;

  const trendMonths = lastMonths(range.year, range.month, 6);
  const { data: trendBookings } = await supabase
    .from("bookings")
    .select("checkin, checkout, price")
    .neq("status", "cancelled")
    .gte("checkin", trendMonths[0].startDate)
    .lte("checkin", trendMonths[trendMonths.length - 1].endDate)
    .returns<Pick<BookingSlim, "checkin" | "checkout" | "price">[]>();

  const trendBuckets = trendMonths.map((m) => ({ ...m, nights: 0, revenue: 0 }));
  for (const booking of trendBookings ?? []) {
    const y = Number(booking.checkin.slice(0, 4));
    const m = Number(booking.checkin.slice(5, 7)) - 1;
    const bucket = trendBuckets.find((b) => b.year === y && b.month === m);
    if (!bucket) continue;

    const bucketEndExclusive = new Date(`${bucket.endDate}T00:00:00Z`);
    bucketEndExclusive.setUTCDate(bucketEndExclusive.getUTCDate() + 1);
    const checkin = new Date(`${booking.checkin}T00:00:00Z`);
    const checkoutRaw = new Date(`${booking.checkout}T00:00:00Z`);
    const checkout = checkoutRaw < bucketEndExclusive ? checkoutRaw : bucketEndExclusive;
    const nights = Math.max(
      Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );

    bucket.nights += nights;
    bucket.revenue += booking.price ?? 0;
  }

  const trendPoints = trendBuckets.map((b) => ({
    label: b.label,
    adr: b.nights > 0 ? b.revenue / b.nights : 0,
    revpar: (totalRooms ?? 0) > 0 ? b.revenue / ((totalRooms ?? 0) * b.daysInMonth) : 0,
  }));

  const { data: exportBookings } = await supabase
    .from("bookings")
    .select("guest_name, checkin, checkout, source, price, payment_status, room:rooms(number)")
    .neq("status", "cancelled")
    .gte("checkin", range.startDate)
    .lte("checkin", range.endDate)
    .order("checkin");

  const exportRows: ExportRow[] = (exportBookings ?? []).map((b) => {
    const room = Array.isArray(b.room) ? b.room[0] : b.room;
    return {
      guest_name: b.guest_name,
      room_number: room?.number ?? "",
      checkin: b.checkin,
      checkout: b.checkout,
      source: SOURCE_LABELS[b.source as BookingSource],
      price: b.price ?? 0,
      payment_status: PAYMENT_STATUS_LABELS[b.payment_status as keyof typeof PAYMENT_STATUS_LABELS],
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Rapoarte</h1>
        </div>
        <ExportButtons monthLabel={range.label} rows={exportRows} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <Link
          href={`/reports?month=${range.prevParam}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Luna anterioară
        </Link>
        <p className="order-first w-full text-center text-sm font-semibold text-slate-900 sm:order-none sm:w-auto">
          {range.label}
        </p>
        <Link
          href={`/reports?month=${range.nextParam}`}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Luna următoare
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-olive-100 bg-white p-4 shadow-sm">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
            <Percent className="h-4.5 w-4.5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{occupancyRate.toFixed(0)}%</p>
          <p className="text-xs text-slate-500">Grad de ocupare</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-slate-500">Venituri (RON)</p>
        </div>
        <div className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{totalCollected.toFixed(2)}</p>
          <p className="text-xs text-slate-500">Încasat (RON)</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{totalDue.toFixed(2)}</p>
          <p className="text-xs text-slate-500">Rest de încasat (RON)</p>
        </div>
      </div>

      <TargetCard target={hotel.monthly_revenue_target} revenue={totalRevenue} />

      <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Tendință ADR / RevPAR (ultimele 6 luni)</h2>
        <TrendChart points={trendPoints} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Rezervări pe sursă</h2>
        <div className="w-full overflow-x-auto">
          <table className="mt-3 w-full min-w-[360px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                <th className="pb-2">Sursă</th>
                <th className="pb-2">Rezervări</th>
                <th className="pb-2 text-right">Venituri (RON)</th>
              </tr>
            </thead>
            <tbody>
              {SOURCE_ORDER.map((source) => (
                <tr key={source} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-700">{SOURCE_LABELS[source]}</td>
                  <td className="py-2 text-slate-600">{bySource[source].count}</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {bySource[source].revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
