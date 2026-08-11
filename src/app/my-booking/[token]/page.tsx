import { BedDouble } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "@/app/(app)/bookings/labels";
import type { PaymentStatus } from "@/types/database";
import { PrintButton } from "./print-button";

interface BookingLookup {
  guest_name: string;
  checkin: string;
  checkout: string;
  room_number: string | null;
  price: number | null;
  amount_paid: number;
  payment_status: PaymentStatus;
  invoice_number: number | null;
  hotel_name: string;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MyBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_booking_by_token", { p_token: token });
  const booking = (data as BookingLookup[] | null)?.[0];

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 p-8 text-center shadow-2xl shadow-indigo-900/30 backdrop-blur">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <BedDouble className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Acest link nu este valid. Contactează hotelul pentru un link nou.
          </p>
        </div>
      </div>
    );
  }

  const price = booking.price ?? 0;
  const due = Math.max(price - booking.amount_paid, 0);
  const nights = Math.max(
    Math.round(
      (new Date(booking.checkout).getTime() - new Date(booking.checkin).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-12 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <BedDouble className="h-5 w-5" />
            </div>
            <p className="font-semibold">{booking.hotel_name}</p>
          </div>
          <PrintButton />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-2xl print:rounded-none print:border-0 print:shadow-none">
          <h1 className="text-xl font-bold text-slate-900">Sejurul tău la {booking.hotel_name}</h1>
          <p className="mt-1 text-sm text-slate-500">Bun venit, {booking.guest_name}!</p>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Cameră
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {booking.room_number ? `Camera ${booking.room_number}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Perioadă
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatDate(booking.checkin)} → {formatDate(booking.checkout)}
              </p>
              <p className="text-xs text-slate-500">
                {nights} {nights === 1 ? "noapte" : "nopți"}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex justify-end">
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
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${PAYMENT_STATUS_STYLES[booking.payment_status]}`}
            >
              {PAYMENT_STATUS_LABELS[booking.payment_status]}
            </span>
            {booking.invoice_number && (
              <p className="text-xs text-slate-400">Factură #{booking.invoice_number}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
