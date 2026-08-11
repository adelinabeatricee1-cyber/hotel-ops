"use client";

import { useActionState, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { Hotel } from "@/types/database";
import { updateGuestSettings } from "./actions";

export function GuestSettingsForm({ hotel }: { hotel: Hotel }) {
  const [state, formAction, pending] = useActionState(updateGuestSettings, undefined);
  const [slugPreview, setSlugPreview] = useState(hotel.booking_slug ?? "");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!hotel.booking_slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/book/${hotel.booking_slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="booking_slug" className="block text-xs font-medium text-slate-600">
          Adresa paginii de rezervare directă
        </label>
        <input
          id="booking_slug"
          name="booking_slug"
          value={slugPreview}
          onChange={(e) => setSlugPreview(e.target.value)}
          placeholder="hotel-panorama"
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
        <p className="mt-1 text-xs text-slate-400">
          Doar litere mici, cifre și cratime. Camerele cu preț/noapte completat (în Camere) vor fi
          rezervabile de aici.
        </p>
        {hotel.booking_slug && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <input
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/book/${hotel.booking_slug}`}
              className="flex-1 truncate bg-transparent text-xs text-emerald-800 outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiat" : "Copiază"}
            </button>
          </div>
        )}
      </div>
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
      <div>
        <label htmlFor="cover_image_url" className="block text-xs font-medium text-slate-600">
          Poză de fundal (pagina oaspetelui)
        </label>
        <input
          id="cover_image_url"
          name="cover_image_url"
          type="url"
          placeholder="https://..."
          defaultValue={hotel.cover_image_url ?? ""}
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
        <p className="mt-1 text-xs text-slate-400">
          Link către o poză a hotelului (ex. din Google Photos, Imgur). Opțional.
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
