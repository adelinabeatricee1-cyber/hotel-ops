"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Tag, Trash2 } from "lucide-react";
import type { Room, RoomStatus } from "@/types/database";
import { deleteRoom, setNightlyRate, setRoomStatus } from "./actions";
import { ROOM_STATUS_BORDER, ROOM_STATUS_LABELS, RoomStatusBadge } from "./status-badge";

const STATUS_ORDER: RoomStatus[] = ["clean", "dirty", "inprogress", "blocked"];

export function RoomCard({
  room,
  selected = false,
  onToggleSelect,
}: {
  room: Room;
  selected?: boolean;
  onToggleSelect?: (roomId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rate, setRate] = useState(room.nightly_rate !== null ? String(room.nightly_rate) : "");

  function handleStatusChange(status: RoomStatus) {
    startTransition(() => setRoomStatus(room.id, status));
  }

  function handleRateBlur() {
    const value = rate.trim() ? Number(rate) : null;
    startTransition(() => setNightlyRate(room.id, value));
  }

  function handleDelete() {
    if (!confirm(`Ștergi camera ${room.number}?`)) return;
    startTransition(() => deleteRoom(room.id));
  }

  return (
    <div
      className={`rounded-xl border border-slate-100 border-t-4 bg-white p-4 shadow-sm transition hover:shadow-md ${ROOM_STATUS_BORDER[room.status]}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(room.id)}
              className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-olive-600 focus:ring-olive-500"
              aria-label={`Selectează camera ${room.number}`}
            />
          )}
          <div>
            <p className="text-lg font-bold text-slate-900">Camera {room.number}</p>
            <p className="text-xs text-slate-500">
              {room.type ? `${room.type} · ` : ""}
              {room.floor !== null ? `Etaj ${room.floor}` : "Fără etaj"}
            </p>
          </div>
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
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-olive-300 hover:bg-olive-50 hover:text-olive-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-600"
          >
            {ROOM_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <label htmlFor={`rate-${room.id}`} className="text-xs text-slate-500">
          Preț/noapte:
        </label>
        <input
          id={`rate-${room.id}`}
          type="number"
          min="0"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          onBlur={handleRateBlur}
          placeholder="—"
          className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-xs"
        />
        <span className="text-xs text-slate-500">RON</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {room.nightly_rate !== null ? (
          <Link
            href={`/rooms/${room.id}/rates`}
            className="inline-flex items-center gap-1 text-xs font-medium text-olive-700 hover:text-olive-900"
          >
            <Tag className="h-3 w-3" />
            Tarife pe zile
          </Link>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" />
          Șterge camera
        </button>
      </div>
    </div>
  );
}
