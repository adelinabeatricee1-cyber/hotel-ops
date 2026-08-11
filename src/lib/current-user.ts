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
    // Authenticated (e.g. via an email confirmation link) but never
    // finished signup, so there's no hotel/profile yet. Sign out instead
    // of bouncing straight back to /login, which would just redirect here
    // again and loop forever.
    await supabase.auth.signOut();
    redirect("/login?error=no-profile");
  }

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", profile.hotel_id)
    .single<Hotel>();

  if (!hotel) {
    await supabase.auth.signOut();
    redirect("/login?error=no-profile");
  }

  return { profile, hotel };
}
