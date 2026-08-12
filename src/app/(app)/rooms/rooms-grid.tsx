"use client";

import { useState, useTransition } from "react";
import { CheckSquare, Square, X } from "lucide-react";
import type { Room, RoomStatus } from "@/types/database";
import { setRoomStatusBulk } from "./actions";
import { ROOM_STATUS_LABELS } from "./status-badge";
import { RoomCard } from "./room-card";

const STATUS_ORDER: RoomStatus[] = ["clean", "dirty", "inprogress", "blocked"];

export function RoomsGrid({ rooms }: { rooms: Room[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelect(roomId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === rooms.length ? new Set() : new Set(rooms.map((r) => r.id))));
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function handleBulkStatus(status: RoomStatus) {
    startTransition(async () => {
      await setRoomStatusBulk([...selected], status);
      setSelected(new Set());
    });
  }

  return (
    <div>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          {selectMode ? <X className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
          {selectMode ? "Anulează selecția" : "Selectează mai multe"}
        </button>
        {selectMode && (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-olive-700 hover:text-olive-800"
          >
            <Square className="h-3.5 w-3.5" />
            {selected.size === rooms.length ? "Deselectează tot" : "Selectează tot"}
          </button>
        )}
      </div>

      {selectMode && selected.size > 0 && (
        <div className="sticky top-2 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-olive-200 bg-olive-50 px-4 py-2.5 shadow-sm">
          <span className="text-xs font-semibold text-olive-800">{selected.size} selectate</span>
          <span className="text-xs text-olive-600">Marchează:</span>
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isPending}
              onClick={() => handleBulkStatus(status)}
              className="rounded-md border border-olive-300 bg-white px-2 py-1 text-xs font-medium text-olive-800 hover:bg-olive-100 disabled:opacity-50"
            >
              {ROOM_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}

      {rooms.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              selected={selected.has(room.id)}
              onToggleSelect={selectMode ? toggleSelect : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-slate-500">
          Nicio cameră găsită. Adaugă prima cameră mai sus.
        </p>
      )}
    </div>
  );
}
