import type { ReactNode } from "react";
import { requireProfile } from "@/lib/current-user";
import { logout } from "../(auth)/actions";
import { NavLink } from "./nav-link";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, hotel } = await requireProfile();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
        <div className="px-2 pb-6">
          <p className="text-sm font-semibold text-slate-900">{hotel.name}</p>
          <p className="text-xs text-slate-500">Hotel Ops</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/rooms">Camere</NavLink>
          <NavLink href="/tasks">Housekeeping</NavLink>
          <NavLink href="/staff">Personal</NavLink>
        </nav>

        <div className="border-t border-slate-200 pt-4">
          <p className="truncate px-2 text-xs text-slate-500">{profile.full_name || "Utilizator"}</p>
          <form action={logout}>
            <button
              type="submit"
              className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100"
            >
              Deconectare
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
