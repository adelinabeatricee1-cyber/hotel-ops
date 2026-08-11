"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 print:hidden"
    >
      <Printer className="h-4 w-4" />
      Tipărește / salvează PDF
    </button>
  );
}
