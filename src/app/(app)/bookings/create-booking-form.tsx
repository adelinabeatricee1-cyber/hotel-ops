"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import type { Room } from "@/types/database";
import { createBooking } from "./actions";

export function CreateBookingForm({ rooms }: { rooms: Room[] }) {
  const [state, formAction, pending] = useActionState(createBooking, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="guest_name" className="block text-xs font-medium text-slate-600">
          Nume oaspete
        </label>
        <input
          id="guest_name"
          name="guest_name"
          required
          placeholder="Ion Popescu"
          className="mt-1 w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-xs font-medium text-slate-600">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          placeholder="07xx xxx xxx"
          className="mt-1 w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div>
        <label htmlFor="room_id" className="block text-xs font-medium text-slate-600">
          Cameră
        </label>
        <select
          id="room_id"
          name="room_id"
          required
          className="mt-1 w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Alege...</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.number}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="checkin" className="block text-xs font-medium text-slate-600">
          Check-in
        </label>
        <input
          id="checkin"
          name="checkin"
          type="date"
          required
          className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div>
        <label htmlFor="checkout" className="block text-xs font-medium text-slate-600">
          Check-out
        </label>
        <input
          id="checkout"
          name="checkout"
          type="date"
          required
          className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <div>
        <label htmlFor="source" className="block text-xs font-medium text-slate-600">
          Sursă
        </label>
        <select
          id="source"
          name="source"
          className="mt-1 w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="direct">Direct</option>
          <option value="booking">Booking.com</option>
          <option value="expedia">Expedia</option>
        </select>
      </div>
      <div>
        <label htmlFor="price" className="block text-xs font-medium text-slate-600">
          Preț (RON)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="500"
          className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {pending ? "Se adaugă..." : "Adaugă rezervare"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
