"use client";

import { useActionState, useState, useTransition } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";
import type { ProfileHotelWithName } from "@/types/database";
import { createProperty, switchProperty } from "./properties/actions";

export function PropertySwitcher({
  properties,
  currentHotelId,
  currentHotelName,
  canAdd,
}: {
  properties: ProfileHotelWithName[];
  currentHotelId: string;
  currentHotelName: string;
  canAdd: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [state, formAction, formPending] = useActionState(createProperty, undefined);

  function handleSwitch(hotelId: string) {
    if (hotelId === currentHotelId) return;
    startTransition(() => switchProperty(hotelId));
  }

  if (properties.length <= 1 && !canAdd) {
    return (
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{currentHotelName}</p>
          <p className="text-xs text-stone-300">Hotel Ops</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          {properties.length > 1 ? (
            <div className="relative">
              <select
                value={currentHotelId}
                disabled={isPending}
                onChange={(e) => handleSwitch(e.target.value)}
                className="w-full appearance-none truncate rounded-md border-none bg-transparent py-0.5 pr-5 text-sm font-semibold text-white outline-none disabled:opacity-60"
              >
                {properties.map((p) => (
                  <option key={p.hotel_id} value={p.hotel_id} className="text-slate-900">
                    {p.hotel?.name ?? "Proprietate"}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1 h-4 w-4 text-stone-300" />
            </div>
          ) : (
            <p className="truncate text-sm font-semibold text-white">{currentHotelName}</p>
          )}
          <p className="text-xs text-stone-300">Hotel Ops</p>
        </div>
      </div>

      {canAdd && (
        <div className="mt-2">
          {adding ? (
            <form action={formAction} className="space-y-1.5">
              <input
                name="name"
                required
                autoFocus
                placeholder="Nume proprietate nouă"
                className="w-full rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={formPending}
                  className="rounded-md bg-white/15 px-2 py-1 text-xs font-medium text-white hover:bg-white/25 disabled:opacity-60"
                >
                  {formPending ? "Se creează..." : "Adaugă"}
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-stone-300 hover:text-white"
                >
                  Anulează
                </button>
              </div>
              {state?.error && <p className="text-[11px] text-red-300">{state.error}</p>}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-300 hover:text-white"
            >
              <Plus className="h-3 w-3" />
              Adaugă proprietate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
