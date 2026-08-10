"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../(auth)/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Hotel Ops</h1>
        <p className="mt-1 text-sm text-slate-500">
          Creează contul de administrator și hotelul tău
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="hotel_name" className="block text-sm font-medium text-slate-700">
              Numele hotelului
            </label>
            <input
              id="hotel_name"
              name="hotel_name"
              type="text"
              required
              placeholder="Hotel Panorama"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
              Numele tău
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Se creează..." : "Creează hotelul"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Ai deja cont?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Autentifică-te
          </Link>
        </p>
      </div>
    </div>
  );
}
