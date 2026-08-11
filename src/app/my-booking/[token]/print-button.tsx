"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#7a2540] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#651e34] print:hidden"
    >
      <Printer className="h-4 w-4" />
      Tipărește
    </button>
  );
}
