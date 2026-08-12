"use client";

import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    queueMicrotask(() => {
      const isDark = localStorage.getItem("theme") === "dark";
      setDark(isDark);
      document.getElementById("app-shell")?.classList.toggle("dark", isDark);
    });
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.getElementById("app-shell")?.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-stone-300 hover:bg-white/10 hover:text-white"
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {dark ? "Mod luminos" : "Mod întunecat"}
    </button>
  );
}
