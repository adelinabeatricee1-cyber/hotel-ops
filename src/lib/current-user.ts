import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hotel, Profile } from "@/types/database";

export async function requireProfile(): Promise<{ profile: Profile; hotel: Hotel }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    redirect("/login");
  }

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", profile.hotel_id)
    .single<Hotel>();

  if (!hotel) {
    redirect("/login");
  }

  return { profile, hotel };
}
