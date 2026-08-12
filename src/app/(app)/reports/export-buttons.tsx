"use client";

import { FileDown, Printer } from "lucide-react";

export interface ExportRow {
  guest_name: string;
  room_number: string;
  checkin: string;
  checkout: string;
  source: string;
  price: number;
  payment_status: string;
}

function csvCell(value: string | number) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ExportButtons({ monthLabel, rows }: { monthLabel: string; rows: ExportRow[] }) {
  function handleExportCsv() {
    const header = ["Oaspete", "Cameră", "Check-in", "Check-out", "Sursă", "Preț (RON)", "Plată"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [r.guest_name, r.room_number, r.checkin, r.checkout, r.source, r.price.toFixed(2), r.payment_status]
          .map(csvCell)
          .join(","),
      ),
    ];
    const csv = "﻿" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rezervari-${monthLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={handleExportCsv}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:border-olive-300 hover:text-olive-800"
      >
        <FileDown className="h-4 w-4" />
        Export Excel (CSV)
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:border-olive-300 hover:text-olive-800"
      >
        <Printer className="h-4 w-4" />
        Salvează PDF
      </button>
    </div>
  );
}
