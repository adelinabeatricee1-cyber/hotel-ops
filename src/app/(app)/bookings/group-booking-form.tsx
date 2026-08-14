"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import type { Room } from "@/types/database";
import { createGroupBooking } from "./actions";

export function GroupBookingForm({ rooms }: { rooms: Room[] }) {
  const [state, formAction, pending] = useActionState(createGroupBooking, undefined);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error && open) {
      formRef.current?.reset();
    }
  }, [pending, state, open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-olive-700 hover:text-olive-800"
      >
        <Users className="h-4 w-4" />
        Rezervare de grup (mai multe camere)
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Users className="h-4 w-4 text-olive-700" />
          Rezervare de grup
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Anulează
        </button>
      </div>

      <div>
        <p className="block text-xs font-medium text-slate-600">Camere (alege minimum 2)</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {rooms.map((room) => (
            <label
              key={room.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 has-checked:border-olive-400 has-checked:bg-olive-50 has-checked:text-olive-800"
            >
              <input type="checkbox" name="room_ids" value={room.id} className="h-3.5 w-3.5" />
              Camera {room.number}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label htmlFor="group_guest_name" className="block text-xs font-medium text-slate-600">
            Nume oaspete / grup
          </label>
          <input
            id="group_guest_name"
            name="guest_name"
            required
            placeholder="Familia Popescu"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <div>
          <label htmlFor="group_phone" className="block text-xs font-medium text-slate-600">
            Telefon
          </label>
          <input
            id="group_phone"
            name="phone"
            placeholder="07xx xxx xxx"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <div>
          <label htmlFor="group_checkin" className="block text-xs font-medium text-slate-600">
            Check-in
          </label>
          <input
            id="group_checkin"
            name="checkin"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <div>
          <label htmlFor="group_checkout" className="block text-xs font-medium text-slate-600">
            Check-out
          </label>
          <input
            id="group_checkout"
            name="checkout"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <div>
          <label htmlFor="group_source" className="block text-xs font-medium text-slate-600">
            Sursă
          </label>
          <select
            id="group_source"
            name="source"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          >
            <option value="direct">Direct</option>
            <option value="booking">Booking.com</option>
            <option value="expedia">Expedia</option>
          </select>
        </div>
        <div>
          <label htmlFor="group_price" className="block text-xs font-medium text-slate-600">
            Preț total (RON)
          </label>
          <input
            id="group_price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="opțional"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
          <p className="mt-1 text-[11px] text-slate-400">Se împarte egal pe camere.</p>
        </div>
        <div className="col-span-full">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Se creează..." : "Creează rezervarea de grup"}
          </button>
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
