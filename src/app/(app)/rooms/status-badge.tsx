import { Sparkles, Brush, Loader, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RoomStatus } from "@/types/database";

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  clean: "Curată",
  dirty: "De curățat",
  inprogress: "În curs",
  blocked: "Blocată",
};

export const ROOM_STATUS_ICONS: Record<RoomStatus, LucideIcon> = {
  clean: Sparkles,
  dirty: Brush,
  inprogress: Loader,
  blocked: Ban,
};

const ROOM_STATUS_STYLES: Record<RoomStatus, string> = {
  clean: "bg-emerald-100 text-emerald-700",
  dirty: "bg-amber-100 text-amber-700",
  inprogress: "bg-sky-100 text-sky-700",
  blocked: "bg-red-100 text-red-700",
};

export const ROOM_STATUS_BORDER: Record<RoomStatus, string> = {
  clean: "border-t-emerald-400",
  dirty: "border-t-amber-400",
  inprogress: "border-t-sky-400",
  blocked: "border-t-red-400",
};

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const Icon = ROOM_STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROOM_STATUS_STYLES[status]}`}
    >
      <Icon className="h-3 w-3" />
      {ROOM_STATUS_LABELS[status]}
    </span>
  );
}
