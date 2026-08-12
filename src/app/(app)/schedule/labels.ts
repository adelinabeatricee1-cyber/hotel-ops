import { Sunrise, Sun, Moon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ShiftType } from "@/types/database";

export const SHIFT_TYPE_ORDER: ShiftType[] = ["morning", "afternoon", "night"];

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  morning: "Dimineață",
  afternoon: "După-amiază",
  night: "Noapte",
};

export const SHIFT_TYPE_SHORT: Record<ShiftType, string> = {
  morning: "D",
  afternoon: "A",
  night: "N",
};

export const SHIFT_TYPE_ICONS: Record<ShiftType, LucideIcon> = {
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

export const SHIFT_TYPE_STYLE: Record<ShiftType, string> = {
  morning: "bg-amber-100 text-amber-700 border-amber-200",
  afternoon: "bg-sky-100 text-sky-700 border-sky-200",
  night: "bg-indigo-100 text-indigo-700 border-indigo-200",
};
