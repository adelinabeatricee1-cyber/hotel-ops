"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";

export async function updateGuestSettings(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const wifiNetwork = String(formData.get("wifi_network") ?? "").trim();
  const wifiPassword = String(formData.get("wifi_password") ?? "").trim();
  const receptionPhone = String(formData.get("reception_phone") ?? "").trim();
  const googleReviewUrl = String(formData.get("google_review_url") ?? "").trim();
  const cancellationPolicy = String(formData.get("cancellation_policy") ?? "").trim();
  const freeCancellationHoursRaw = String(formData.get("free_cancellation_hours") ?? "").trim();
  const bookingSlugRaw = String(formData.get("booking_slug") ?? "").trim();

  const bookingSlug = bookingSlugRaw
    ? bookingSlugRaw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    : "";

  if (bookingSlugRaw && !bookingSlug) {
    return { error: "Adresa paginii de rezervare nu poate fi goală după curățare." };
  }

  const { error } = await supabase
    .from("hotels")
    .update({
      wifi_network: wifiNetwork || null,
      wifi_password: wifiPassword || null,
      reception_phone: receptionPhone || null,
      google_review_url: googleReviewUrl || null,
      cancellation_policy: cancellationPolicy || null,
      free_cancellation_hours: freeCancellationHoursRaw ? Number(freeCancellationHoursRaw) : 48,
      booking_slug: bookingSlug || null,
    })
    .eq("id", profile.hotel_id);

  if (error) {
    return {
      error: error.code === "23505" ? "Această adresă este deja folosită de alt hotel." : error.message,
    };
  }

  revalidatePath("/settings");
  return { error: undefined, success: true };
}

export async function uploadCoverImage(formData: FormData): Promise<{ error?: string }> {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Alege o poză." };
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${profile.hotel_id}/cover-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("hotel-covers").upload(path, file, {
    contentType: file.type || undefined,
  });

  if (uploadError) {
    return { error: "Nu am putut încărca poza." };
  }

  const { data: publicUrl } = supabase.storage.from("hotel-covers").getPublicUrl(path);

  const { error } = await supabase
    .from("hotels")
    .update({ cover_image_url: publicUrl.publicUrl })
    .eq("id", profile.hotel_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return {};
}

export async function clearCoverImage(): Promise<{ error?: string }> {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("hotels")
    .update({ cover_image_url: null })
    .eq("id", profile.hotel_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return {};
}

export async function setCoverImageUrl(url: string): Promise<{ error?: string }> {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("hotels")
    .update({ cover_image_url: url.trim() || null })
    .eq("id", profile.hotel_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return {};
}
