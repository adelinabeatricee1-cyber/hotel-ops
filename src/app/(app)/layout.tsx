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
} from "lucide-react";
import { requireProfile } from "@/lib/current-user";
import { getDictionary } from "@/lib/i18n/get-locale";
import { createClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { ProfileHotelWithName } from "@/types/database";
import { logout } from "../(auth)/actions";
import { GlobalSearch } from "./global-search";
import { NavLink } from "./nav-link";
import { PropertySwitcher } from "./property-switcher";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, hotel } = await requireProfile();
  const { locale, t } = await getDictionary();
  const canManage = profile.role === "admin" || profile.role === "manager";

  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("profile_hotels")
    .select("*, hotel:hotels(id, name)")
    .eq("profile_id", profile.id)
    .order("created_at")
    .returns<ProfileHotelWithName[]>();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col bg-gradient-to-b from-stone-800 via-stone-800 to-stone-900 p-4 shadow-xl print:hidden">
        <div className="pb-4">
          <PropertySwitcher
            properties={properties ?? []}
            currentHotelId={hotel.id}
            currentHotelName={hotel.name}
            canAdd={profile.role === "admin"}
          />
        </div>

        <div className="pb-4">
          <GlobalSearch />
        </div>

        <div className="px-2 pb-6">
          <LanguageSwitcher locale={locale} />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
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
          <p className="truncate px-2 text-xs text-stone-300">
            {profile.full_name || "Utilizator"}
          </p>
          <form action={logout}>
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

      <main className="flex-1 p-6 md:p-8 print:p-0">{children}</main>
    </div>
  );
}
