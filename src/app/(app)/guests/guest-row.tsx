"use client";

import { useTransition } from "react";
import { Trash2, Star } from "lucide-react";
import type { Guest } from "@/types/database";
import { deleteGuest } from "./actions";

export function GuestRow({ guest }: { guest: Guest }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Ștergi clientul ${guest.name}?`)) return;
    startTransition(() => deleteGuest(guest.id));
  }

  const isLoyal = guest.visit_count >= 2;

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-900">{guest.name}</span>
          {isLoyal && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              Client fidel
            </span>
          )}
        </div>
      </td>
      <td className="py-2.5 pr-4 text-sm text-slate-600">{guest.phone || "—"}</td>
      <td className="py-2.5 pr-4 text-sm text-slate-600">{guest.email || "—"}</td>
      <td className="py-2.5 pr-4 text-sm text-slate-600">{guest.visit_count}</td>
      <td className="py-2.5 pr-4 text-sm font-semibold text-indigo-700">
        {guest.loyalty_points} pct
      </td>
      <td className="py-2.5 text-right">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" />
          Șterge
        </button>
      </td>
    </tr>
  );
}
