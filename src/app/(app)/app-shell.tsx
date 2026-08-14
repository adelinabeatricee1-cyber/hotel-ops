"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  DoorOpen,
  CalendarDays,
  BarChart3,
  Heart,
  SquareParking,
  Package,
  CalendarClock,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Dictionary, Locale } from "@/lib/i18n/dictionary";
import type { ProfileHotelWithName } from "@/types/database";
import { GlobalSearch } from "./global-search";
import { NavLink } from "./nav-link";
import { PropertySwitcher } from "./property-switcher";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({
  hotelId,
  hotelName,
  profileName,
  properties,
  canManage,
  canAddProperty,
  locale,
  t,
  logoutAction,
  children,
}: {
  hotelId: string;
  hotelName: string;
  profileName: string | null;
  properties: ProfileHotelWithName[];
  canManage: boolean;
  canAddProperty: boolean;
  locale: Locale;
  t: Dictionary;
  logoutAction: () => void | Promise<void>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      id="app-shell"
      className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-slate-50 md:flex-row"
    >
      <div className="flex items-center justify-between gap-2 bg-gradient-to-b from-stone-800 to-stone-900 p-3 shadow-xl md:hidden print:hidden">
        <div className="min-w-0 flex-1">
          <PropertySwitcher
            properties={properties}
            currentHotelId={hotelId}
            currentHotelName={hotelName}
            canAdd={canAddProperty}
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Deschide meniul"
          className="shrink-0 rounded-lg border border-white/20 p-2 text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Închide meniul"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-gradient-to-b from-stone-800 via-stone-800 to-stone-900 p-4 shadow-xl transition-transform duration-200 ease-in-out md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:shrink-0 print:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end pb-2 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Închide meniul"
            className="rounded-lg p-1.5 text-stone-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="hidden pb-4 md:block">
          <PropertySwitcher
            properties={properties}
            currentHotelId={hotelId}
            currentHotelName={hotelName}
            canAdd={canAddProperty}
          />
        </div>

        <div className="pb-4">
          <GlobalSearch />
        </div>

        <div className="px-2 pb-2">
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="px-2 pb-6">
          <ThemeToggle />
        </div>

        <nav className="flex flex-1 flex-col gap-1" onClick={() => setOpen(false)}>
          <NavLink href="/" icon={<LayoutDashboard className="h-4 w-4" />}>
            {t.nav.dashboard}
          </NavLink>
          <NavLink href="/rooms" icon={<DoorOpen className="h-4 w-4" />}>
            {t.nav.rooms}
          </NavLink>
          <NavLink href="/parking" icon={<SquareParking className="h-4 w-4" />}>
            {t.nav.parking}
          </NavLink>
          {canManage && (
            <NavLink href="/bookings" icon={<CalendarDays className="h-4 w-4" />}>
              {t.nav.bookings}
            </NavLink>
          )}
          {canManage && (
            <NavLink href="/guests" icon={<Heart className="h-4 w-4" />}>
              {t.nav.guests}
            </NavLink>
          )}
          <NavLink href="/tasks" icon={<ClipboardList className="h-4 w-4" />}>
            {t.nav.housekeeping}
          </NavLink>
          <NavLink href="/staff" icon={<Users className="h-4 w-4" />}>
            {t.nav.staff}
          </NavLink>
          <NavLink href="/schedule" icon={<CalendarClock className="h-4 w-4" />}>
            {t.nav.schedule}
          </NavLink>
          <NavLink href="/supplies" icon={<Package className="h-4 w-4" />}>
            {t.nav.supplies}
          </NavLink>
          {canManage && (
            <NavLink href="/reports" icon={<BarChart3 className="h-4 w-4" />}>
              {t.nav.reports}
            </NavLink>
          )}
          {canManage && (
            <NavLink href="/settings" icon={<Settings className="h-4 w-4" />}>
              {t.nav.settings}
            </NavLink>
          )}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <p className="truncate px-2 text-xs text-stone-300">{profileName || "Utilizator"}</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-stone-300 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              {t.nav.logout}
            </button>
          </form>
        </div>
      </aside>

      <main className="w-full min-w-0 flex-1 overflow-x-hidden p-6 md:p-8 print:p-0">
        {children}
      </main>
    </div>
  );
}
