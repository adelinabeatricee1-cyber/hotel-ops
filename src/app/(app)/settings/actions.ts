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
  const coverImageUrl = String(formData.get("cover_image_url") ?? "").trim();
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
      cover_image_url: coverImageUrl || null,
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
