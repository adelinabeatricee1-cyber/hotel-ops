"use client";

import { useActionState } from "react";
import type { Hotel } from "@/types/database";
import { updateGuestSettings } from "./actions";

export function GuestSettingsForm({ hotel }: { hotel: Hotel }) {
  const [state, formAction, pending] = useActionState(updateGuestSettings, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="wifi_network" className="block text-xs font-medium text-slate-600">
          Rețea Wi-Fi
        </label>
        <input
          id="wifi_network"
          name="wifi_network"
          defaultValue={hotel.wifi_network ?? ""}
          placeholder="Hotel-Guest"
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <div>
        <label htmlFor="wifi_password" className="block text-xs font-medium text-slate-600">
          Parolă Wi-Fi
        </label>
        <input
          id="wifi_password"
          name="wifi_password"
          defaultValue={hotel.wifi_password ?? ""}
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <div>
        <label htmlFor="reception_phone" className="block text-xs font-medium text-slate-600">
          Telefon recepție (WhatsApp)
        </label>
        <input
          id="reception_phone"
          name="reception_phone"
          placeholder="40712345678"
          defaultValue={hotel.reception_phone ?? ""}
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
        <p className="mt-1 text-xs text-slate-400">
          Fără +, spații sau zero inițial — ex. pentru 07xx xxx xxx scrie 407xxxxxxxx.
        </p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Salvat.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
      >
        {pending ? "Se salvează..." : "Salvează"}
      </button>
    </form>
  );
}
