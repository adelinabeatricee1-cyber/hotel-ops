"use client";

import { useTransition } from "react";
import { Users } from "lucide-react";
import type { Room, RoomStatus } from "@/types/database";
import { setRoomStatus } from "./actions";
import { ROOM_STATUS_LABELS } from "./status-badge";

const STATUS_ORDER: RoomStatus[] = ["clean", "dirty", "inprogress", "blocked"];

const TILE_STYLES: Record<RoomStatus, string> = {
  clean: "bg-emerald-500 hover:bg-emerald-600",
  dirty: "bg-amber-500 hover:bg-amber-600",
  inprogress: "bg-sky-500 hover:bg-sky-600",
  blocked: "bg-red-500 hover:bg-red-600",
};

function nextStatus(current: RoomStatus): RoomStatus {
  const i = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

export function RoomFloorPlan({
  rooms,
  occupiedRoomIds,
}: {
  rooms: Room[];
  occupiedRoomIds: Set<string>;
}) {
  const [isPending, startTransition] = useTransition();

  const floors = new Map<string, Room[]>();
  for (const room of rooms) {
    const key = room.floor !== null ? String(room.floor) : "Fără etaj";
    if (!floors.has(key)) floors.set(key, []);
    floors.get(key)!.push(room);
  }

  const floorKeys = [...floors.keys()].sort((a, b) => {
    if (a === "Fără etaj") return 1;
    if (b === "Fără etaj") return -1;
    return Number(a) - Number(b);
  });

  function handleClick(room: Room) {
    startTransition(() => setRoomStatus(room.id, nextStatus(room.status)));
  }

  if (rooms.length === 0) {
    return <p className="mt-8 text-sm text-slate-500">Nicio cameră de afișat.</p>;
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-xs text-slate-600 shadow-sm">
        <span className="font-medium text-slate-500">Legendă:</span>
        {STATUS_ORDER.map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${TILE_STYLES[status].split(" ")[0]}`} />
            {ROOM_STATUS_LABELS[status]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          Ocupată azi
        </span>
        <span className="ml-auto text-slate-400">Click pe o cameră schimbă statusul.</span>
      </div>

      {floorKeys.map((floorKey) => (
        <div key={floorKey}>
          <p className="text-xs font-semibold text-slate-500">
            {floorKey === "Fără etaj" ? floorKey : `Etaj ${floorKey}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {floors.get(floorKey)!.map((room) => (
              <button
                key={room.id}
                type="button"
                disabled={isPending}
                onClick={() => handleClick(room)}
                title={`${ROOM_STATUS_LABELS[room.status]} — click pentru a schimba`}
                className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm transition disabled:opacity-60 ${TILE_STYLES[room.status]}`}
              >
                {occupiedRoomIds.has(room.id) && (
                  <Users className="absolute right-1 top-1 h-3 w-3" />
                )}
                {room.number}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
