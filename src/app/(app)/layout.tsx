import type { ReactNode } from "react";
import {
  BedDouble,
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  DoorOpen,
  CalendarDays,
  BarChart3,
  Heart,
} from "lucide-react";
import { requireProfile } from "@/lib/current-user";
import { logout } from "../(auth)/actions";
import { NavLink } from "./nav-link";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, hotel } = await requireProfile();
  const canManage = profile.role === "admin" || profile.role === "manager";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col bg-gradient-to-b from-indigo-700 via-indigo-700 to-violet-800 p-4 shadow-xl print:hidden">
        <div className="flex items-center gap-2.5 px-2 pb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
            <BedDouble className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{hotel.name}</p>
            <p className="text-xs text-indigo-200">Hotel Ops</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink href="/" icon={<LayoutDashboard className="h-4 w-4" />}>
            Dashboard
          </NavLink>
          <NavLink href="/rooms" icon={<DoorOpen className="h-4 w-4" />}>
            Camere
          </NavLink>
          {canManage && (
            <NavLink href="/bookings" icon={<CalendarDays className="h-4 w-4" />}>
              Rezervări
            </NavLink>
          )}
          {canManage && (
            <NavLink href="/guests" icon={<Heart className="h-4 w-4" />}>
              Clienți fideli
            </NavLink>
          )}
          <NavLink href="/tasks" icon={<ClipboardList className="h-4 w-4" />}>
            Housekeeping
          </NavLink>
          <NavLink href="/staff" icon={<Users className="h-4 w-4" />}>
            Personal
          </NavLink>
          {canManage && (
            <NavLink href="/reports" icon={<BarChart3 className="h-4 w-4" />}>
              Rapoarte
            </NavLink>
          )}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <p className="truncate px-2 text-xs text-indigo-200">
            {profile.full_name || "Utilizator"}
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-indigo-100 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Deconectare
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 print:p-0">{children}</main>
    </div>
  );
}
