"use client";

import { useActionState, useState } from "react";
import { Target } from "lucide-react";
import { setMonthlyTarget } from "./actions";

export function TargetCard({
  target,
  revenue,
}: {
  target: number | null;
  revenue: number;
}) {
  const [state, formAction, pending] = useActionState(setMonthlyTarget, undefined);
  const [editing, setEditing] = useState(false);

  const progress = target && target > 0 ? Math.min((revenue / target) * 100, 100) : 0;

  return (
    <div className="mt-6 rounded-xl border border-olive-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Target className="h-4 w-4 text-olive-700" />
          Target lunar de venituri
        </h2>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-xs font-medium text-olive-700 hover:text-olive-800"
        >
          {editing ? "Anulează" : target ? "Editează" : "Setează target"}
        </button>
      </div>

      {editing ? (
        <form action={formAction} className="mt-3 flex items-end gap-2">
          <div>
            <label htmlFor="target" className="block text-xs font-medium text-slate-600">
              Target (RON / lună)
            </label>
            <input
              id="target"
              name="target"
              type="number"
              min="0"
              step="0.01"
              defaultValue={target ?? ""}
              placeholder="ex. 20000"
              className="mt-1 w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
          >
            {pending ? "Se salvează..." : "Salvează"}
          </button>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      ) : target ? (
        <>
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-slate-900">
              {revenue.toFixed(2)} / {target.toFixed(2)} RON
            </span>
            <span className="text-slate-500">{progress.toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-olive-500 to-olive-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Niciun target setat pentru această lună.</p>
      )}
    </div>
  );
}
