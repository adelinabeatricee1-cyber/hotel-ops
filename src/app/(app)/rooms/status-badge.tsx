import type { RoomStatus } from "@/types/database";

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  clean: "Curată",
  dirty: "De curățat",
  inprogress: "În curs",
  blocked: "Blocată",
};

const ROOM_STATUS_STYLES: Record<RoomStatus, string> = {
  clean: "bg-emerald-100 text-emerald-800",
  dirty: "bg-amber-100 text-amber-800",
  inprogress: "bg-sky-100 text-sky-800",
  blocked: "bg-red-100 text-red-800",
};

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROOM_STATUS_STYLES[status]}`}
    >
      {ROOM_STATUS_LABELS[status]}
    </span>
  );
}
