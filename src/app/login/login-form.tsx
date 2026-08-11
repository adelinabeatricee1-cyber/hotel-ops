"use client";

import Link from "next/link";
import { BedDouble } from "lucide-react";
import { useActionState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n/dictionary";
import { LanguageSwitcher } from "@/components/language-switcher";
import { login } from "../(auth)/actions";

export function LoginForm({
  t,
  locale,
  showNoProfileError,
}: {
  t: Dictionary;
  locale: Locale;
  showNoProfileError: boolean;
}) {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-700 via-stone-800 to-olive-900 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher locale={locale} variant="light" />
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-stone-900/30 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-olive-600 to-olive-700 text-white shadow-lg shadow-olive-600/30">
              <BedDouble className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">{t.login.title}</h1>
          </div>
          <p className="mt-3 text-sm text-slate-500">{t.login.subtitle}</p>

          {showNoProfileError && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t.login.noProfileError}
            </p>
          )}

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                {t.login.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                {t.login.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
              />
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-olive-600/30 transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
            >
              {pending ? t.login.submitting : t.login.submit}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {t.login.noAccount}{" "}
            <Link href="/signup" className="font-semibold text-olive-700 hover:text-olive-600">
              {t.login.createHotel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
