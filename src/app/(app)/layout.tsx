import type { ReactNode } from "react";
import { requireProfile } from "@/lib/current-user";
import { getDictionary } from "@/lib/i18n/get-locale";
import { createClient } from "@/lib/supabase/server";
import type { ProfileHotelWithName } from "@/types/database";
import { logout } from "../(auth)/actions";
import { AppShell } from "./app-shell";

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
    <AppShell
      hotelId={hotel.id}
      hotelName={hotel.name}
      profileName={profile.full_name}
      properties={properties ?? []}
      canManage={canManage}
      canAddProperty={profile.role === "admin"}
      locale={locale}
      t={t}
      logoutAction={logout}
    >
      {children}
    </AppShell>
  );
}
