"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createParkingSpot } from "./actions";

export function AddSpotForm() {
  const [state, formAction, pending] = useActionState(createParkingSpot, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="label" className="block text-xs font-medium text-slate-600">
          Loc de parcare
        </label>
        <input
          id="label"
          name="label"
          required
          placeholder="P1"
          className="mt-1 w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {pending ? "Se adaugă..." : "Adaugă loc"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
