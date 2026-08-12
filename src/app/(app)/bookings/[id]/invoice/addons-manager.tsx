"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BookingAddon } from "@/types/database";
import { addBookingAddon, removeBookingAddon } from "./actions";

const ADDON_SUGGESTIONS = ["Mic dejun", "Late check-out", "Pat suplimentar", "Parcare"];

export function AddonsManager({
  bookingId,
  addons,
}: {
  bookingId: string;
  addons: BookingAddon[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "");
    const price = Number(formData.get("price") ?? 0);
    const quantity = Number(formData.get("quantity") ?? 1);
    setError(null);
    startTransition(async () => {
      try {
        await addBookingAddon(bookingId, name, price, quantity);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut adăuga extra-ul.");
      }
    });
  }

  function handleRemove(addonId: string) {
    startTransition(() => removeBookingAddon(addonId));
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm print:hidden">
      <h2 className="text-sm font-semibold text-slate-700">Extra-uri</h2>

      {addons.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100">
          {addons.map((addon) => (
            <li key={addon.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-slate-700">
                {addon.name} {addon.quantity > 1 && `× ${addon.quantity}`}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900">
                  {(addon.unit_price * addon.quantity).toFixed(2)} RON
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(addon.id)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} onSubmit={handleAdd} className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="addon_name" className="block text-xs font-medium text-slate-600">
            Nume
          </label>
          <input
            id="addon_name"
            name="name"
            list="addon-suggestions"
            required
            placeholder="Mic dejun"
            className="mt-1 w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
          <datalist id="addon-suggestions">
            {ADDON_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="addon_price" className="block text-xs font-medium text-slate-600">
            Preț (RON)
          </label>
          <input
            id="addon_price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <div>
          <label htmlFor="addon_quantity" className="block text-xs font-medium text-slate-600">
            Cantitate
          </label>
          <input
            id="addon_quantity"
            name="quantity"
            type="number"
            min="1"
            defaultValue="1"
            className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Adaugă
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
