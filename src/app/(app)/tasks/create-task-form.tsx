"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Room, Staff } from "@/types/database";
import { createTask } from "./actions";

export function CreateTaskForm({ rooms, staff }: { rooms: Room[]; staff: Staff[] }) {
  const [state, formAction, pending] = useActionState(createTask, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="room_id" className="block text-xs font-medium text-slate-600">
          Cameră
        </label>
        <select
          id="room_id"
          name="room_id"
          required
          className="mt-1 w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
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
        <label htmlFor="type" className="block text-xs font-medium text-slate-600">
          Tip
        </label>
        <select
          id="type"
          name="type"
          className="mt-1 w-36 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="housekeeping">Housekeeping</option>
          <option value="maintenance">Mentenanță</option>
        </select>
      </div>
      <div>
        <label htmlFor="assigned_to" className="block text-xs font-medium text-slate-600">
          Asignat
        </label>
        <select
          id="assigned_to"
          name="assigned_to"
          className="mt-1 w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Neasignat</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-40 flex-1">
        <label htmlFor="notes" className="block text-xs font-medium text-slate-600">
          Note
        </label>
        <input
          id="notes"
          name="notes"
          placeholder="Opțional"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Se creează..." : "Creează task"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
