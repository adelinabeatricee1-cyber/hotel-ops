"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { Staff } from "@/types/database";
import { deleteStaff } from "./actions";

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function StaffRow({ member, canManage }: { member: Staff; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Ștergi ${member.name}?`)) return;
    startTransition(() => deleteStaff(member.id));
  }

  const initial = member.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarColor(member.name)}`}
          >
            {initial}
          </div>
          <span className="text-sm font-medium text-slate-900">{member.name}</span>
        </div>
      </td>
      <td className="py-2.5 pr-4 text-sm text-slate-600">{member.role || "—"}</td>
      <td className="py-2.5 pr-4 text-sm text-slate-600">{member.phone || "—"}</td>
      <td className="py-2.5 text-right">
        {canManage && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" />
            Șterge
          </button>
        )}
      </td>
    </tr>
  );
}
