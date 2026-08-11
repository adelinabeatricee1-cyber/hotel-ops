"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinHotel(_prevState: { error?: string } | undefined, formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!token) {
    return { error: "Link de invitație invalid." };
  }

  if (!fullName || !email || !password) {
    return { error: "Numele, emailul și parola sunt obligatorii." };
  }

  if (password.length < 6) {
    return { error: "Parola trebuie să aibă cel puțin 6 caractere." };
  }

  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!data.session) {
    return {
      error:
        "Cont creat. Verifică emailul pentru confirmare, apoi accesează din nou acest link de invitație ca să finalizezi înscrierea.",
    };
  }

  const { error: redeemError } = await supabase.rpc("redeem_invite", {
    p_token: token,
    p_full_name: fullName,
  });

  if (redeemError) {
    return { error: `Contul a fost creat, dar invitația nu a putut fi folosită: ${redeemError.message}` };
  }

  redirect("/");
}
