"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, Receipt } from "lucide-react";
import type { BookingWithRoom, PaymentStatus } from "@/types/database";
import { deleteBooking, setPaymentStatus } from "./actions";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES, SOURCE_ICONS, SOURCE_LABELS } from "./labels";

const PAYMENT_STATUS_ORDER: PaymentStatus[] = ["unpaid", "partial", "paid"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ro-RO");
}

export function BookingRow({ booking }: { booking: BookingWithRoom }) {
  const [isPending, startTransition] = useTransition();
  const [amountPaid, setAmountPaid] = useState(String(booking.amount_paid ?? 0));
  const SourceIcon = SOURCE_ICONS[booking.source];

  function handlePaymentStatusChange(status: PaymentStatus) {
    let amount = Number(amountPaid) || 0;
    if (status === "paid") amount = booking.price ?? 0;
    if (status === "unpaid") amount = 0;
    setAmountPaid(String(amount));
    startTransition(() => setPaymentStatus(booking.id, status, amount));
  }

  function handleAmountBlur() {
    const amount = Number(amountPaid) || 0;
    startTransition(() => setPaymentStatus(booking.id, booking.payment_status, amount));
  }

  function handleDelete() {
    if (!confirm(`Ștergi rezervarea pentru ${booking.guest_name}?`)) return;
    startTransition(() => deleteBooking(booking.id));
  }

  return (
    <tr className="border-b border-slate-100 last:border-0 align-top">
      <td className="py-3 pr-4">
        <p className="text-sm font-semibold text-slate-900">{booking.guest_name}</p>
        <p className="text-xs text-slate-500">{booking.phone || "—"}</p>
      </td>
      <td className="py-3 pr-4 text-sm text-slate-700">
        {booking.room ? `Camera ${booking.room.number}` : "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-slate-600">
        {formatDate(booking.checkin)} → {formatDate(booking.checkout)}
      </td>
      <td className="py-3 pr-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          <SourceIcon className="h-3 w-3" />
          {SOURCE_LABELS[booking.source]}
        </span>
      </td>
      <td className="py-3 pr-4 text-sm font-medium text-slate-900">
        {booking.price !== null ? `${booking.price.toFixed(2)} RON` : "—"}
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {PAYMENT_STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isPending || status === booking.payment_status}
              onClick={() => handlePaymentStatusChange(status)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition disabled:cursor-default ${
                status === booking.payment_status
                  ? PAYMENT_STATUS_STYLES[status]
                  : "border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-700"
              }`}
            >
              {PAYMENT_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        {booking.payment_status === "partial" && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Achitat:</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              onBlur={handleAmountBlur}
              className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-xs"
            />
            <span className="text-xs text-slate-500">RON</span>
          </div>
        )}
      </td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/bookings/${booking.id}/invoice`}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Receipt className="h-3.5 w-3.5" />
            {booking.invoice_number ? `Factura #${booking.invoice_number}` : "Generează factură"}
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}
