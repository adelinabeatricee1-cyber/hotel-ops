"use client";

import { useTransition } from "react";
import type { Staff } from "@/types/database";
import { deleteStaff } from "./actions";

export function StaffRow({ member }: { member: Staff }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Ștergi ${member.name}?`)) return;
    startTransition(() => deleteStaff(member.id));
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-4 text-sm font-medium text-slate-900">{member.name}</td>
      <td className="py-2 pr-4 text-sm text-slate-600">{member.role || "—"}</td>
      <td className="py-2 pr-4 text-sm text-slate-600">{member.phone || "—"}</td>
      <td className="py-2 text-right">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-red-600 hover:underline disabled:opacity-40"
        >
          Șterge
        </button>
      </td>
    </tr>
  );
}
