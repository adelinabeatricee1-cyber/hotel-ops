import Link from "next/link";
import {
  Sparkles,
  Brush,
  Loader,
  Ban,
  ListTodo,
  Hourglass,
  Wallet,
  LogIn,
  LogOut,
  Percent,
  SquareParking,
  Package,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  BedDouble,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import { getDictionary } from "@/lib/i18n/get-locale";
import { resolveMonth, todayDateString } from "@/lib/date-utils";
import type { RoomStatus, Supply, TaskStatus } from "@/types/database";
import { DailyDigestButton } from "./daily-digest-button";
import { TargetCard } from "./reports/target-card";
import { ensureCheckoutHousekeepingTasks } from "./tasks/actions";

const ROOM_STATUS_META: Record<RoomStatus, { icon: LucideIcon; ring: string; iconWrap: string }> = {
  clean: { icon: Sparkles, ring: "border-emerald-100", iconWrap: "bg-emerald-100 text-emerald-600" },
  dirty: { icon: Brush, ring: "border-amber-100", iconWrap: "bg-amber-100 text-amber-600" },
  inprogress: { icon: Loader, ring: "border-sky-100", iconWrap: "bg-sky-100 text-sky-600" },
  blocked: { icon: Ban, ring: "border-red-100", iconWrap: "bg-red-100 text-red-600" },
};

const TASK_STATUS_META: Record<Exclude<TaskStatus, "done">, { icon: LucideIcon; iconWrap: string }> = {
  todo: { icon: ListTodo, iconWrap: "bg-fuchsia-100 text-fuchsia-600" },
  inprogress: { icon: Hourglass, iconWrap: "bg-sky-100 text-sky-700" },
};

const QUICK_LINKS: { href: string; label: string; icon: LucideIcon; managedOnly?: boolean }[] = [
  { href: "/bookings", label: "Rezervări", icon: CalendarDays, managedOnly: true },
  { href: "/tasks", label: "Housekeeping", icon: ClipboardList },
  { href: "/parking", label: "Parcare", icon: SquareParking },
  { href: "/supplies", label: "Provizii", icon: Package },
  { href: "/schedule", label: "Program tură", icon: CalendarClock },
  { href: "/reports", label: "Rapoarte", icon: BarChart3, managedOnly: true },
];

function formatToday() {
  return new Date().toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default async function DashboardPage() {
  const { hotel, profile } = await requireProfile();
  const { t } = await getDictionary();
  const canSeePayments = profile.role === "admin" || profile.role === "manager";
  await ensureCheckoutHousekeepingTasks();
  const supabase = await createClient();
  const today = todayDateString();
  const month = resolveMonth(undefined);

  const [
    { data: rooms },
    { data: tasks },
    { data: unpaidBookings },
    { count: arrivalsN },
    { count: departuresN },
    { data: occupiedRoomIds },
    { data: parkingSpots },
    { data: lowSupplies },
    { count: shiftsN },
    { data: monthBookings },
  ] = await Promise.all([
    supabase.from("rooms").select("status"),
    supabase.from("tasks").select("status").neq("status", "done"),
    canSeePayments
      ? supabase.from("bookings").select("price, amount_paid").neq("payment_status", "paid")
      : Promise.resolve({ data: [] as { price: number | null; amount_paid: number }[] }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("checkin", today)
      .in("status", ["confirmed", "checked_in"]),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("checkout", today)
      .in("status", ["confirmed", "checked_in"]),
    supabase
      .from("bookings")
      .select("room_id")
      .neq("status", "cancelled")
      .lte("checkin", today)
      .gt("checkout", today),
    supabase.from("parking_spots").select("status"),
    supabase.from("supplies").select("*").returns<Supply[]>(),
    supabase.from("shifts").select("id", { count: "exact", head: true }).eq("date", today),
    canSeePayments
      ? supabase
          .from("bookings")
          .select("price")
          .neq("status", "cancelled")
          .gte("checkin", month.startDate)
          .lte("checkin", month.endDate)
      : Promise.resolve({ data: [] as { price: number | null }[] }),
  ]);

  const roomCounts: Record<RoomStatus, number> = { clean: 0, dirty: 0, inprogress: 0, blocked: 0 };
  for (const room of rooms ?? []) {
    roomCounts[room.status as RoomStatus] += 1;
  }

  const taskCounts: Record<TaskStatus, number> = { todo: 0, inprogress: 0, done: 0 };
  for (const task of tasks ?? []) {
    taskCounts[task.status as TaskStatus] += 1;
  }

  const totalRooms = rooms?.length ?? 0;

  const amountDue = (unpaidBookings ?? []).reduce(
    (sum, b) => sum + Math.max((b.price ?? 0) - b.amount_paid, 0),
    0,
  );
  const unpaidCount = unpaidBookings?.length ?? 0;

  const occupiedCount = new Set((occupiedRoomIds ?? []).map((b) => b.room_id)).size;
  const occupancyRate = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;

  const totalParking = parkingSpots?.length ?? 0;
  const occupiedParking = (parkingSpots ?? []).filter((p) => p.status === "occupied").length;

  const lowStockItems = (lowSupplies ?? []).filter((s) => s.quantity <= s.low_stock_threshold);

  const monthRevenue = (monthBookings ?? []).reduce((sum, b) => sum + (b.price ?? 0), 0);

  return (
    <div className="relative -m-6 md:-m-8">
      <div
        className="absolute inset-x-0 top-0 h-[440px] bg-cover bg-center sm:h-[520px]"
        style={
          hotel.cover_image_url
            ? { backgroundImage: `url(${hotel.cover_image_url})` }
            : undefined
        }
      >
        <div
          className={
            hotel.cover_image_url
              ? "absolute inset-0 bg-gradient-to-b from-olive-950/80 via-olive-900/55 to-slate-50"
              : "absolute inset-0 bg-gradient-to-b from-olive-700 via-olive-700/80 to-slate-50"
          }
        />
        {!hotel.cover_image_url && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
            viewBox="0 0 400 200"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <g fill="none" stroke="white" strokeWidth="2">
              <rect x="40" y="60" width="120" height="120" />
              <rect x="240" y="30" width="140" height="150" />
              {Array.from({ length: 4 }).map((_, row) =>
                Array.from({ length: 3 }).map((_, col) => (
                  <rect
                    key={`a-${row}-${col}`}
                    x={55 + col * 30}
                    y={75 + row * 25}
                    width="14"
                    height="14"
                  />
                )),
              )}
              {Array.from({ length: 5 }).map((_, row) =>
                Array.from({ length: 4 }).map((_, col) => (
                  <rect
                    key={`b-${row}-${col}`}
                    x={255 + col * 30}
                    y={45 + row * 25}
                    width="14"
                    height="14"
                  />
                )),
              )}
            </g>
          </svg>
        )}
      </div>

      <div className="relative p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 text-white">
          <div>
            <p className="text-sm capitalize text-white/70">{formatToday()}</p>
            <h1 className="mt-1 text-2xl font-bold drop-shadow-sm sm:text-3xl">
              {t.dashboard.welcome}, {hotel.name}
            </h1>
            <p className="mt-1 text-sm text-white/80">{t.dashboard.summary}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
            <Percent className="h-5 w-5" />
            <div>
              <p className="text-lg font-bold leading-none">{occupancyRate.toFixed(0)}%</p>
              <p className="text-[11px] text-white/70">ocupare azi</p>
            </div>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-white drop-shadow-sm">Astăzi</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-md">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <LogIn className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{arrivalsN ?? 0}</p>
              <p className="text-xs text-slate-500">Check-in-uri azi</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-md">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <LogOut className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{departuresN ?? 0}</p>
              <p className="text-xs text-slate-500">Check-out-uri azi</p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-white p-4 shadow-md">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                <SquareParking className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {occupiedParking}/{totalParking}
              </p>
              <p className="text-xs text-slate-500">Locuri de parcare ocupate</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-md">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <CalendarClock className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{shiftsN ?? 0}</p>
              <p className="text-xs text-slate-500">Persoane în tură azi</p>
            </div>
          </div>
          {canSeePayments && (
            <div className="mt-4 max-w-sm">
              <DailyDigestButton
                data={{
                  hotelName: hotel.name,
                  dateLabel: formatToday(),
                  arrivalsN: arrivalsN ?? 0,
                  departuresN: departuresN ?? 0,
                  occupancyRate,
                  amountDue,
                  unpaidCount,
                  lowStockItems: lowStockItems.map((s) => ({
                    name: s.name,
                    quantity: s.quantity,
                    unit: s.unit,
                  })),
                }}
                defaultPhone={hotel.reception_phone}
              />
            </div>
          )}
        </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">
          {t.dashboard.roomsHeading} ({totalRooms})
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(Object.keys(ROOM_STATUS_META) as RoomStatus[]).map((status) => {
            const meta = ROOM_STATUS_META[status];
            const Icon = meta.icon;
            return (
              <div
                key={status}
                className={`rounded-xl border bg-white p-4 shadow-sm ${meta.ring}`}
              >
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${meta.iconWrap}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{roomCounts[status]}</p>
                <p className="text-xs text-slate-500">{t.dashboard.roomStatus[status]}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">{t.dashboard.tasksHeading}</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["todo", "inprogress"] as const).map((status) => {
            const meta = TASK_STATUS_META[status];
            const Icon = meta.icon;
            return (
              <div key={status} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${meta.iconWrap}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{taskCounts[status]}</p>
                <p className="text-xs text-slate-500">{t.dashboard.taskStatus[status]}</p>
              </div>
            );
          })}
        </div>
      </section>

      {canSeePayments && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700">{t.dashboard.paymentsHeading}</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Wallet className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{amountDue.toFixed(2)} RON</p>
              <p className="text-xs text-slate-500">
                {t.dashboard.dueLabel} ({unpaidCount})
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Wallet className="h-4.5 w-4.5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{monthRevenue.toFixed(2)} RON</p>
              <p className="text-xs text-slate-500">Venituri luna curentă</p>
            </div>
          </div>
          <TargetCard target={hotel.monthly_revenue_target} revenue={monthRevenue} />
        </section>
      )}

      {lowStockItems.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Provizii cu stoc redus
          </h2>
          <div className="mt-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm">
            <ul className="divide-y divide-slate-100">
              {lowStockItems.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="font-semibold text-red-600">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/supplies"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-olive-700 hover:text-olive-800"
            >
              Vezi toate proviziile
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-700">Acțiuni rapide</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_LINKS.filter((link) => !link.managedOnly || canSeePayments).map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-olive-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-700">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {totalRooms === 0 && (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white p-5">
          <BedDouble className="h-6 w-6 text-slate-400" />
          <p className="text-sm text-slate-500">
            Nu ai adăugat încă nicio cameră.{" "}
            <Link href="/rooms" className="font-medium text-olive-700 hover:text-olive-800">
              Adaugă prima cameră
            </Link>
            {" "}pentru a vedea date reale aici.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
