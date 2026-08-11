"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BedDouble } from "lucide-react";
import { Suspense, useActionState } from "react";
import { login } from "../(auth)/actions";

function NoProfileBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("error") !== "no-profile") return null;

  return (
    <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      Contul a fost confirmat, dar înregistrarea hotelului nu s-a finalizat. Te rugăm să creezi
      hotelul din nou.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-indigo-900/30 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30">
            <BedDouble className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Hotel Ops</h1>
        </div>
        <p className="mt-3 text-sm text-slate-500">Autentifică-te în contul tău</p>

        <Suspense fallback={null}>
          <NoProfileBanner />
        </Suspense>

        <form action={formAction} className="mt-6 space-y-4">
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
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
          >
            {pending ? "Se autentifică..." : "Autentificare"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Nu ai cont?{" "}
          <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Creează un hotel
          </Link>
        </p>
      </div>
    </div>
  );
}
