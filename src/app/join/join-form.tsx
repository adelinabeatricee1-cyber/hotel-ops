"use client";

import Link from "next/link";
import { useActionState } from "react";
import { joinHotel } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  staff: "Personal",
};

export function JoinForm({ token, hotelName, role }: { token: string; hotelName: string; role: string }) {
  const [state, formAction, pending] = useActionState(joinHotel, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-700 via-stone-800 to-olive-900 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-stone-900/30 backdrop-blur">
        <h1 className="text-xl font-bold text-slate-900">Ai fost invitat/ă</h1>
        <p className="mt-2 text-sm text-slate-600">
          Alătură-te echipei <span className="font-semibold text-slate-900">{hotelName}</span> ca{" "}
          <span className="font-semibold text-slate-900">{ROLE_LABELS[role] ?? role}</span>.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
              Numele tău
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Parolă
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
            />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-olive-600/30 transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
          >
            {pending ? "Se creează contul..." : "Creează cont și intră"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Ai deja cont?{" "}
          <Link href="/login" className="font-semibold text-olive-700 hover:text-olive-600">
            Autentifică-te
          </Link>
        </p>
      </div>
    </div>
  );
}
