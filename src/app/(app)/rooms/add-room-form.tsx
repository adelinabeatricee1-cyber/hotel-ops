"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createRoom } from "./actions";

export function AddRoomForm() {
  const [state, formAction, pending] = useActionState(createRoom, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="number" className="block text-xs font-medium text-slate-600">
          Număr
        </label>
        <input
          id="number"
          name="number"
          required
          placeholder="101"
          className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <div>
        <label htmlFor="floor" className="block text-xs font-medium text-slate-600">
          Etaj
        </label>
        <input
          id="floor"
          name="floor"
          type="number"
          placeholder="1"
          className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <div>
        <label htmlFor="type" className="block text-xs font-medium text-slate-600">
          Tip
        </label>
        <input
          id="type"
          name="type"
          placeholder="Single / Dublă..."
          className="mt-1 w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {pending ? "Se adaugă..." : "Adaugă cameră"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
