"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { InviteRole } from "@/types/database";

export async function createStaff(_prevState: { error?: string } | undefined, formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) {
    return { error: "Numele este obligatoriu." };
  }

  const { error } = await supabase.from("staff").insert({
    hotel_id: profile.hotel_id,
    name,
    role: role || null,
    phone: phone || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/staff");
  return { error: undefined };
}

export async function deleteStaff(staffId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("staff").delete().eq("id", staffId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/staff");
}

export async function createInvite(
  _prevState: { error?: string; token?: string } | undefined,
  formData: FormData,
) {
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const role = String(formData.get("role") ?? "staff") as InviteRole;
  const email = String(formData.get("email") ?? "").trim();

  const { data, error } = await supabase
    .from("invites")
    .insert({
      hotel_id: profile.hotel_id,
      role,
      email: email || null,
      created_by: profile.id,
    })
    .select("token")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/staff");
  return { error: undefined, token: data.token as string };
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invites").delete().eq("id", inviteId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/staff");
}
