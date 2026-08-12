"use client";

import { useState, useTransition } from "react";
import { setRateOverride } from "./actions";

export function RateCalendar({
  roomId,
  days,
  defaultRate,
  overrides,
}: {
  roomId: string;
  days: string[];
  defaultRate: number;
  overrides: Record<string, number>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const day of days) {
      initial[day] = String(overrides[day] ?? defaultRate);
    }
    return initial;
  });
  const [isPending, startTransition] = useTransition();

  function handleBlur(day: string) {
    const raw = values[day]?.trim();
    const numeric = raw ? Number(raw) : defaultRate;
    if (Number.isNaN(numeric)) return;

    const isOverride = numeric !== defaultRate;
    startTransition(() => setRateOverride(roomId, day, isOverride ? numeric : null));
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            {days.map((day) => (
              <th key={day} className="border-b border-slate-200 px-1 py-1 text-center font-medium text-slate-500">
                {Number(day.slice(-2))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {days.map((day) => {
              const isOverride = overrides[day] !== undefined;
              return (
                <td key={day} className="px-0.5 py-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={values[day] ?? ""}
                    disabled={isPending}
                    onChange={(e) => setValues((v) => ({ ...v, [day]: e.target.value }))}
                    onBlur={() => handleBlur(day)}
                    className={`w-16 rounded border px-1 py-1 text-center text-xs ${
                      isOverride ? "border-olive-400 bg-olive-50 font-semibold text-olive-800" : "border-slate-200"
                    }`}
                  />
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-400">
        Celulele evidențiate au un preț personalizat pentru acea zi. Șterge valoarea sau
        pune-o egală cu prețul standard ca să revii la implicit.
      </p>
    </div>
  );
}
