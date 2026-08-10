"use client";

import { useActionState, useEffect, useRef } from "react";
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
          className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
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
          className="mt-1 w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
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
          className="mt-1 w-36 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Se adaugă..." : "Adaugă cameră"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
