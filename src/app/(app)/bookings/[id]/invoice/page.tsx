import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";
import type { BookingAddon, BookingWithRoom } from "@/types/database";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES, SOURCE_LABELS } from "../../labels";
import { AddonsManager } from "./addons-manager";
import { PrintButton } from "./print-button";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { hotel } = await requireAdmin();
  const supabase = await createClient();

  // Idempotent: assigns the next sequential number only the first time.
  await supabase.rpc("issue_invoice_number", { p_booking_id: id });

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, room:rooms(id, number, floor)")
    .eq("id", id)
    .single<BookingWithRoom>();

  if (!booking) {
    notFound();
  }

  const { data: addons } = await supabase
    .from("booking_addons")
    .select("*")
    .eq("booking_id", id)
    .order("created_at")
    .returns<BookingAddon[]>();

  const addonsList = addons ?? [];
  const addonsTotal = addonsList.reduce((sum, a) => sum + a.unit_price * a.quantity, 0);

  const price = booking.price ?? 0;
  const roomPrice = price - addonsTotal;
  const due = Math.max(price - booking.amount_paid, 0);
  const nights = Math.max(
    Math.round(
      (new Date(booking.checkout).getTime() - new Date(booking.checkin).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
    0,
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la rezervări
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-olive-600 to-olive-700 text-white">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{hotel.name}</p>
              <p className="text-xs text-slate-500">Hotel Ops</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-slate-900">FACTURĂ</p>
            <p className="text-sm text-slate-500">
              Nr. {booking.invoice_number ?? "—"}
              {booking.invoice_issued_at && ` · ${formatDate(booking.invoice_issued_at)}`}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Facturat către
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{booking.guest_name}</p>
            {booking.phone && <p className="text-sm text-slate-500">{booking.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Detalii rezervare
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Camera {booking.room?.number ?? "—"} · {SOURCE_LABELS[booking.source]}
            </p>
            <p className="text-sm text-slate-500">
              {formatDate(booking.checkin)} → {formatDate(booking.checkout)} ({nights}{" "}
              {nights === 1 ? "noapte" : "nopți"})
            </p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
              <th className="pb-2">Descriere</th>
              <th className="pb-2 text-right">Sumă</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3 text-slate-700">
                Cazare camera {booking.room?.number ?? "—"} ({nights}{" "}
                {nights === 1 ? "noapte" : "nopți"})
              </td>
              <td className="py-3 text-right font-medium text-slate-900">
                {roomPrice.toFixed(2)} RON
              </td>
            </tr>
            {addonsList.map((addon) => (
              <tr key={addon.id} className="border-b border-slate-100">
                <td className="py-3 text-slate-700">
                  {addon.name} {addon.quantity > 1 && `× ${addon.quantity}`}
                </td>
                <td className="py-3 text-right font-medium text-slate-900">
                  {(addon.unit_price * addon.quantity).toFixed(2)} RON
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Total</span>
              <span className="font-medium text-slate-900">{price.toFixed(2)} RON</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Achitat</span>
              <span className="font-medium text-slate-900">
                {booking.amount_paid.toFixed(2)} RON
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-slate-900">
              <span className="font-semibold">Rest de plată</span>
              <span className="font-bold">{due.toFixed(2)} RON</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${PAYMENT_STATUS_STYLES[booking.payment_status]}`}
          >
            {PAYMENT_STATUS_LABELS[booking.payment_status]}
          </span>
          <p className="text-xs text-slate-400">Generat prin Hotel Ops</p>
        </div>
      </div>

      <AddonsManager bookingId={id} addons={addonsList} />
    </div>
  );
}
