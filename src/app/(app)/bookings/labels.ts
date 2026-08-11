import { Globe, Building2, Plane } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BookingSource, PaymentStatus } from "@/types/database";

export const SOURCE_LABELS: Record<BookingSource, string> = {
  direct: "Direct",
  booking: "Booking.com",
  expedia: "Expedia",
};

export const SOURCE_ICONS: Record<BookingSource, LucideIcon> = {
  direct: Building2,
  booking: Globe,
  expedia: Plane,
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Neplătit",
  partial: "Parțial",
  paid: "Plătit",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
};
