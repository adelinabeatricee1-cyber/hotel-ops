"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createSupply } from "./actions";

export function AddSupplyForm() {
  const [state, formAction, pending] = useActionState(createSupply, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="name" className="block text-xs font-medium text-slate-600">
          Produs
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Prosoape mari"
          className="mt-1 w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <div>
        <label htmlFor="unit" className="block text-xs font-medium text-slate-600">
          Unitate
        </label>
        <input
          id="unit"
          name="unit"
          placeholder="buc"
          defaultValue="buc"
          className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <div>
        <label htmlFor="quantity" className="block text-xs font-medium text-slate-600">
          Stoc inițial
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          defaultValue="0"
          className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <div>
        <label htmlFor="low_stock_threshold" className="block text-xs font-medium text-slate-600">
          Prag stoc minim
        </label>
        <input
          id="low_stock_threshold"
          name="low_stock_threshold"
          type="number"
          min="0"
          defaultValue="5"
          className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {pending ? "Se adaugă..." : "Adaugă produs"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
