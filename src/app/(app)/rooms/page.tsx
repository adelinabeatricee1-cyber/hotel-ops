import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/date-utils";
import type { Room, RoomStatus } from "@/types/database";
import { AddRoomForm } from "./add-room-form";
import { RoomsGrid } from "./rooms-grid";
import { ROOM_STATUS_LABELS } from "./status-badge";

const STATUS_FILTERS: RoomStatus[] = ["clean", "dirty", "inprogress", "blocked"];

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const today = todayDateString();

  let query = supabase.from("rooms").select("*").order("floor").order("number");
  if (status && STATUS_FILTERS.includes(status as RoomStatus)) {
    query = query.eq("status", status);
  }

  const [{ data: rooms }, { data: occupiedBookings }] = await Promise.all([
    query.returns<Room[]>(),
    supabase
      .from("bookings")
      .select("room_id")
      .neq("status", "cancelled")
      .lte("checkin", today)
      .gt("checkout", today),
  ]);

  const occupiedRoomIds = new Set(
    (occupiedBookings ?? []).map((b) => b.room_id).filter((id): id is string => Boolean(id)),
  );

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
          <DoorOpen className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Camere</h1>
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <AddRoomForm />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterLink status={undefined} active={!status}>
          Toate
        </FilterLink>
        {STATUS_FILTERS.map((s) => (
          <FilterLink key={s} status={s} active={status === s}>
            {ROOM_STATUS_LABELS[s]}
          </FilterLink>
        ))}
      </div>

      <RoomsGrid rooms={rooms ?? []} occupiedRoomIds={occupiedRoomIds} />
    </div>
  );
}

function FilterLink({
  status,
  active,
  children,
}: {
  status?: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={status ? `/rooms?status=${status}` : "/rooms"}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-gradient-to-r from-olive-600 to-olive-700 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:border-olive-300 hover:text-olive-800"
      }`}
    >
      {children}
    </Link>
  );
}
