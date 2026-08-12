"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Minus, Package, Plus, Trash2 } from "lucide-react";
import type { Supply } from "@/types/database";
import { adjustSupplyQuantity, deleteSupply, setLowStockThreshold } from "./actions";

export function SupplyCard({ supply }: { supply: Supply }) {
  const [isPending, startTransition] = useTransition();
  const [threshold, setThreshold] = useState(String(supply.low_stock_threshold));
  const lowStock = supply.quantity <= supply.low_stock_threshold;

  function handleAdjust(delta: number) {
    startTransition(() => adjustSupplyQuantity(supply.id, delta));
  }

  function handleThresholdBlur() {
    const value = Number(threshold);
    if (Number.isNaN(value)) return;
    startTransition(() => setLowStockThreshold(supply.id, value));
  }

  function handleDelete() {
    if (!confirm(`Ștergi produsul ${supply.name}?`)) return;
    startTransition(() => deleteSupply(supply.id));
  }

  return (
    <div
      className={`rounded-xl border border-slate-100 border-t-4 bg-white p-4 shadow-sm transition hover:shadow-md ${
        lowStock ? "border-t-red-400" : "border-t-olive-400"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              lowStock ? "bg-red-100 text-red-600" : "bg-olive-100 text-olive-700"
            }`}
          >
            <Package className="h-4.5 w-4.5" />
          </div>
          <p className="text-sm font-bold text-slate-900">{supply.name}</p>
        </div>
        {lowStock && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
            <AlertTriangle className="h-3 w-3" />
            Stoc redus
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => handleAdjust(-1)}
          disabled={isPending || supply.quantity === 0}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-olive-300 hover:bg-olive-50 hover:text-olive-800 disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <p className="min-w-[4rem] text-center text-lg font-bold text-slate-900">
          {supply.quantity} <span className="text-xs font-normal text-slate-500">{supply.unit}</span>
        </p>
        <button
          type="button"
          onClick={() => handleAdjust(1)}
          disabled={isPending}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-olive-300 hover:bg-olive-50 hover:text-olive-800 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-1.5">
        <label htmlFor={`threshold-${supply.id}`} className="text-xs text-slate-500">
          Prag minim:
        </label>
        <input
          id={`threshold-${supply.id}`}
          type="number"
          min="0"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          onBlur={handleThresholdBlur}
          className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-xs"
        />
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
      >
        <Trash2 className="h-3 w-3" />
        Șterge produs
      </button>
    </div>
  );
}
