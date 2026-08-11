"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/dictionary";

export function LanguageSwitcher({
  locale,
  variant = "dark",
}: {
  locale: Locale;
  variant?: "dark" | "light";
}) {
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(() => setLocale(next));
  }

  const wrapClass =
    variant === "dark"
      ? "bg-white/10 text-indigo-100"
      : "border border-slate-200 bg-white text-slate-500 shadow-sm";
  const activeClass =
    variant === "dark" ? "bg-white/20 text-white" : "bg-slate-900 text-white";

  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg p-0.5 text-xs font-semibold ${wrapClass}`}>
      {(["ro", "en"] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          disabled={isPending}
          className={`rounded-md px-2 py-1 uppercase transition disabled:opacity-60 ${
            code === locale ? activeClass : "hover:opacity-80"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
