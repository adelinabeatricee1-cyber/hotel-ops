"use client";

import { useState, useTransition } from "react";
import { Trash2, Car } from "lucide-react";
import type { ParkingSpot } from "@/types/database";
import { deleteParkingSpot, setParkingStatus } from "./actions";

export function ParkingSpotCard({ spot }: { spot: ParkingSpot }) {
  const [isPending, startTransition] = useTransition();
  const [guestName, setGuestName] = useState(spot.guest_name ?? "");
  const occupied = spot.status === "occupied";

  function handleToggle() {
    const next = occupied ? "available" : "occupied";
    startTransition(() => setParkingStatus(spot.id, next, guestName));
  }

  function handleGuestBlur() {
    if (occupied) {
      startTransition(() => setParkingStatus(spot.id, "occupied", guestName));
    }
  }

  function handleDelete() {
    if (!confirm(`Ștergi locul ${spot.label}?`)) return;
    startTransition(() => deleteParkingSpot(spot.id));
  }

  return (
    <div
      className={`rounded-xl border border-slate-100 border-t-4 bg-white p-4 shadow-sm transition hover:shadow-md ${
        occupied ? "border-t-amber-400" : "border-t-emerald-400"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              occupied ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
            }`}
          >
            <Car className="h-4.5 w-4.5" />
          </div>
          <p className="text-lg font-bold text-slate-900">{spot.label}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            occupied ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {occupied ? "Ocupat" : "Liber"}
        </span>
      </div>

      {occupied && (
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          onBlur={handleGuestBlur}
          placeholder="Nume oaspete / nr. înmatriculare"
          className="mt-3 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      )}

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40"
        >
          {occupied ? "Marchează liber" : "Marchează ocupat"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
