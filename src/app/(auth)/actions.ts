"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email și parolă sunt obligatorii." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email sau parolă incorectă." };
  }

  redirect("/");
}

export async function signup(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const hotelName = String(formData.get("hotel_name") ?? "").trim();

  if (!email || !password || !hotelName) {
    return { error: "Email, parolă și numele hotelului sunt obligatorii." };
  }

  if (password.length < 6) {
    return { error: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!data.user) {
    return {
      error: "Cont creat. Verifică emailul pentru confirmare, apoi autentifică-te.",
    };
  }

  if (!data.session) {
    // Email confirmation is required before we can call the RPC (it needs
    // an authenticated session). The hotel/profile get created on first
    // login instead — see login() fallback would be needed if you enable
    // confirmations; for now this covers the default (confirmations off).
    return {
      error: "Cont creat. Verifică emailul pentru confirmare, apoi autentifică-te.",
    };
  }

  const { error: rpcError } = await supabase.rpc("create_hotel_and_profile", {
    hotel_name: hotelName,
    owner_full_name: fullName || null,
  });

  if (rpcError) {
    return { error: `Contul a fost creat, dar configurarea hotelului a eșuat: ${rpcError.message}` };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
