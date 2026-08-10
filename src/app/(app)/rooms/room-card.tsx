"use client";

import { useTransition } from "react";
import type { Room, RoomStatus } from "@/types/database";
import { deleteRoom, setRoomStatus } from "./actions";
import { ROOM_STATUS_LABELS, RoomStatusBadge } from "./status-badge";

const STATUS_ORDER: RoomStatus[] = ["clean", "dirty", "inprogress", "blocked"];

export function RoomCard({ room }: { room: Room }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: RoomStatus) {
    startTransition(() => setRoomStatus(room.id, status));
  }

  function handleDelete() {
    if (!confirm(`Ștergi camera ${room.number}?`)) return;
    startTransition(() => deleteRoom(room.id));
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Camera {room.number}</p>
          <p className="text-xs text-slate-500">
            {room.type ? `${room.type} · ` : ""}
            {room.floor !== null ? `Etaj ${room.floor}` : "Fără etaj"}
          </p>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            disabled={isPending || status === room.status}
            onClick={() => handleStatusChange(status)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ROOM_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="mt-3 text-xs text-red-600 hover:underline disabled:opacity-40"
      >
        Șterge camera
      </button>
    </div>
  );
}
