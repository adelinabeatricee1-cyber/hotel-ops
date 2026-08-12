"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, Receipt, ExternalLink, Link2, Check, MessageCircle } from "lucide-react";
import type { BookingWithRoom, Hotel, PaymentStatus } from "@/types/database";
import { todayDateString } from "@/lib/date-utils";
import { deleteBooking, setPaymentStatus } from "./actions";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES, SOURCE_ICONS, SOURCE_LABELS } from "./labels";

const PAYMENT_STATUS_ORDER: PaymentStatus[] = ["unpaid", "partial", "paid"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ro-RO");
}

function tomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return `4${digits}`;
  if (digits.startsWith("40")) return digits;
  return digits;
}

export function BookingRow({ booking, hotel }: { booking: BookingWithRoom; hotel: Hotel }) {
  const [isPending, startTransition] = useTransition();
  const [amountPaid, setAmountPaid] = useState(String(booking.amount_paid ?? 0));
  const [linkCopied, setLinkCopied] = useState(false);
  const SourceIcon = SOURCE_ICONS[booking.source];

  const today = todayDateString();
  const tomorrow = tomorrowDateString();
  const isCheckinSoon =
    (booking.status === "confirmed" || booking.status === "checked_in") &&
    (booking.checkin === today || booking.checkin === tomorrow);

  function handleCopyGuestLink() {
    const link = `${window.location.origin}/my-booking/${booking.guest_access_token}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleSendWelcome() {
    if (!booking.phone) return;
    const link = `${window.location.origin}/my-booking/${booking.guest_access_token}`;
    const lines = [
      `Bună, ${booking.guest_name}! Vă așteptăm la ${hotel.name}.`,
      `Check-in: ${formatDate(booking.checkin)}${booking.room ? ` · Camera ${booking.room.number}` : ""}.`,
    ];
    if (hotel.wifi_network) {
      lines.push(`Wi-Fi: ${hotel.wifi_network}${hotel.wifi_password ? ` / parola: ${hotel.wifi_password}` : ""}.`);
    }
    lines.push(`Detaliile rezervării dvs.: ${link}`);
    lines.push("Vă mulțumim și vă așteptăm cu drag!");

    const waLink = `https://wa.me/${normalizePhone(booking.phone)}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(waLink, "_blank", "noopener,noreferrer");
  }

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
        {isCheckinSoon && (
          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            {booking.checkin === today ? "Check-in azi" : "Check-in mâine"}
          </span>
        )}
      </td>
      <td className="py-3 pr-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          <SourceIcon className="h-3 w-3" />
          {SOURCE_LABELS[booking.source]}
        </span>
        {booking.external_booking_id && (
          <div className="mt-1 text-xs text-slate-500">
            ID: {booking.external_booking_id}
            {booking.source === "booking" && (
              <a
                href="https://admin.booking.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1.5 inline-flex items-center gap-0.5 text-olive-700 hover:text-olive-800"
              >
                <ExternalLink className="h-3 w-3" />
                extranet
              </a>
            )}
          </div>
        )}
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
                  : "border border-slate-200 text-slate-500 hover:border-olive-300 hover:text-olive-800"
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
          {isCheckinSoon && booking.phone && (
            <button
              type="button"
              onClick={handleSendWelcome}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              title="Trimite mesaj de bun venit pe WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Bun venit
            </button>
          )}
          <button
            type="button"
            onClick={handleCopyGuestLink}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            title="Copiază link-ul pentru oaspete"
          >
            {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
            {linkCopied ? "Copiat" : "Link oaspete"}
          </button>
          <Link
            href={`/bookings/${booking.id}/invoice`}
            className="inline-flex items-center gap-1 text-xs font-medium text-olive-700 hover:text-olive-800"
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
