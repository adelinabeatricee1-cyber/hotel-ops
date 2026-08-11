"use server";

import { createClient } from "@/lib/supabase/server";

export async function requestHousekeeping(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const token = String(formData.get("token") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_guest_housekeeping", {
    p_token: token,
    p_note: note,
  });

  if (error) {
    return { error: "Nu am putut trimite cererea. Încearcă din nou." };
  }

  return { error: undefined, success: true };
}

export async function submitFeedback(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const token = String(formData.get("token") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (!message) {
    return { error: "Scrie un mesaj." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_guest_feedback", {
    p_token: token,
    p_message: message,
  });

  if (error) {
    return { error: "Nu am putut trimite mesajul. Încearcă din nou." };
  }

  return { error: undefined, success: true };
}

export async function requestParking(token: string): Promise<{ label: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_guest_parking", { p_token: token });

  if (error) {
    throw new Error(error.message);
  }

  return { label: (data as string | null) ?? null };
}
