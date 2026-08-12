"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";

interface DigestData {
  hotelName: string;
  dateLabel: string;
  arrivalsN: number;
  departuresN: number;
  occupancyRate: number;
  amountDue: number;
  unpaidCount: number;
  lowStockItems: { name: string; quantity: number; unit: string }[];
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return `4${digits}`;
  if (digits.startsWith("40")) return digits;
  return digits;
}

export function DailyDigestButton({
  data,
  defaultPhone,
}: {
  data: DigestData;
  defaultPhone: string | null;
}) {
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [showPhoneInput, setShowPhoneInput] = useState(!defaultPhone);

  function buildMessage() {
    const lines = [
      `Rezumatul zilei — ${data.hotelName}`,
      data.dateLabel,
      "",
      `Check-in-uri azi: ${data.arrivalsN}`,
      `Check-out-uri azi: ${data.departuresN}`,
      `Grad de ocupare: ${data.occupancyRate.toFixed(0)}%`,
    ];
    if (data.unpaidCount > 0) {
      lines.push(`Rest de încasat: ${data.amountDue.toFixed(2)} RON (${data.unpaidCount} rezervări)`);
    }
    if (data.lowStockItems.length > 0) {
      lines.push("", "Provizii cu stoc redus:");
      for (const item of data.lowStockItems) {
        lines.push(`- ${item.name}: ${item.quantity} ${item.unit}`);
      }
    }
    return lines.join("\n");
  }

  function handleSend() {
    const target = normalizePhone(phone);
    if (!target) return;
    const waLink = `https://wa.me/${target}?text=${encodeURIComponent(buildMessage())}`;
    window.open(waLink, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-md">
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <MessageCircle className="h-4 w-4 text-emerald-600" />
        Rezumatul zilei
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Trimite pe WhatsApp un mesaj cu check-in-uri, check-out-uri, plăți restante și stoc redus.
      </p>
      {showPhoneInput && (
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="ex. 407xxxxxxxx"
          className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      )}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={!phone.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Trimite rezumatul
        </button>
        {!showPhoneInput && (
          <button
            type="button"
            onClick={() => setShowPhoneInput(true)}
            className="text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            schimbă numărul
          </button>
        )}
      </div>
    </div>
  );
}
