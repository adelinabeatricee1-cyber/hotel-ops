"use client";

import { useState, useTransition } from "react";
import type { ShiftType, Staff } from "@/types/database";
import { setShift } from "./actions";
import { SHIFT_TYPE_LABELS, SHIFT_TYPE_ORDER, SHIFT_TYPE_STYLE } from "./labels";

function dayShortLabel(dateStr: string) {
  return Number(dateStr.slice(-2));
}

export function ScheduleGrid({
  staff,
  days,
  dayLabels,
  shifts,
  canEdit,
}: {
  staff: Staff[];
  days: string[];
  dayLabels: string[];
  shifts: Record<string, ShiftType>;
  canEdit: boolean;
}) {
  const [values, setValues] = useState<Record<string, ShiftType | "">>(() => {
    const initial: Record<string, ShiftType | ""> = {};
    for (const s of staff) {
      for (const day of days) {
        initial[`${s.id}_${day}`] = shifts[`${s.id}_${day}`] ?? "";
      }
    }
    return initial;
  });
  const [isPending, startTransition] = useTransition();

  function handleChange(staffId: string, day: string, value: string) {
    const key = `${staffId}_${day}`;
    const shiftType = (value || null) as ShiftType | null;
    setValues((v) => ({ ...v, [key]: (value as ShiftType) || "" }));
    startTransition(() => setShift(staffId, day, shiftType));
  }

  if (staff.length === 0) {
    return <p className="text-sm text-slate-500">Adaugă mai întâi personal în pagina Personal.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
            <th className="px-3 py-2">Personal</th>
            {days.map((day, i) => (
              <th key={day} className="px-2 py-2 text-center">
                {dayLabels[i]}
                <br />
                <span className="font-normal text-slate-400">{dayShortLabel(day)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-2 font-medium text-slate-900">{s.name}</td>
              {days.map((day) => {
                const key = `${s.id}_${day}`;
                const value = values[key] ?? "";
                return (
                  <td key={day} className="px-1.5 py-1.5 text-center">
                    <select
                      value={value}
                      disabled={!canEdit || isPending}
                      onChange={(e) => handleChange(s.id, day, e.target.value)}
                      className={`w-full min-w-[6.5rem] rounded-lg border px-1.5 py-1 text-xs font-medium disabled:opacity-70 ${
                        value ? SHIFT_TYPE_STYLE[value as ShiftType] : "border-slate-200 text-slate-400"
                      }`}
                    >
                      <option value="">—</option>
                      {SHIFT_TYPE_ORDER.map((type) => (
                        <option key={type} value={type}>
                          {SHIFT_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
