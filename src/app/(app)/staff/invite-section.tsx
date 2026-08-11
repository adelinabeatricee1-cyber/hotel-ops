"use client";

import { useActionState, useState, useTransition } from "react";
import { Copy, Check, Mail, Trash2, UserPlus } from "lucide-react";
import type { Invite } from "@/types/database";
import { createInvite, revokeInvite } from "./actions";

function InviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/join?token=${token}` : "";

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
      <input
        readOnly
        value={link}
        className="flex-1 truncate bg-transparent text-xs text-emerald-800 outline-none"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiat" : "Copiază"}
      </button>
    </div>
  );
}

export function InviteSection({ invites }: { invites: Invite[] }) {
  const [state, formAction, pending] = useActionState(createInvite, undefined);
  const [isPending, startTransition] = useTransition();
  const lastToken = state?.token ?? null;

  function handleRevoke(id: string) {
    startTransition(() => revokeInvite(id));
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <UserPlus className="h-4 w-4" />
        Invită personal
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Generează un link pe care îl trimiți colegului tău (WhatsApp, email etc.) — el/ea își
        creează propriul cont și intră direct în hotelul tău.
      </p>

      <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="role" className="block text-xs font-medium text-slate-600">
            Rol
          </label>
          <select
            id="role"
            name="role"
            className="mt-1 w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          >
            <option value="staff">Personal</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-slate-600">
            Email (opțional, doar informativ)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="nume@exemplu.ro"
            className="mt-1 w-52 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          {pending ? "Se generează..." : "Generează link"}
        </button>
      </form>

      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {lastToken && <InviteLink token={lastToken} />}

      {invites.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500">Invitații în așteptare</p>
          <ul className="mt-2 space-y-1.5">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-1.5 text-sm"
              >
                <span className="text-slate-700">
                  {invite.email || "Fără email"} ·{" "}
                  <span className="text-slate-400">
                    {invite.role === "manager" ? "Manager" : "Personal"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRevoke(invite.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" />
                  Anulează
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
