"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, BedDouble, Check, ArrowLeft } from "lucide-react";
import { searchAvailability, submitBooking, type AvailableRoom } from "./actions";

type Step = "search" | "select" | "details" | "done";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
  });
}

export function BookingWidget({ slug, hotelName }: { slug: string; hotelName: string }) {
  const [step, setStep] = useState<Step>("search");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [rooms, setRooms] = useState<AvailableRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const nights =
    checkin && checkout
      ? Math.max(
          Math.round(
            (new Date(checkout).getTime() - new Date(checkin).getTime()) / (1000 * 60 * 60 * 24),
          ),
          0,
        )
      : 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await searchAvailability(slug, checkin, checkout);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRooms(result.rooms);
      setStep("select");
    });
  }

  function handleSelectRoom(room: AvailableRoom) {
    setSelectedRoom(room);
    setStep("details");
  }

  function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoom) return;
    setError(null);
    startTransition(async () => {
      const result = await submitBooking(slug, selectedRoom.room_id, checkin, checkout, guestName, phone);
      if (result.error) {
        setError(result.error);
        return;
      }
      setToken(result.token ?? null);
      setStep("done");
    });
  }

  if (step === "done" && token) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-stone-900">Rezervare confirmată!</h2>
        <p className="mt-2 text-sm text-stone-600">
          Camera {selectedRoom?.number} · {formatDate(checkin)} → {formatDate(checkout)}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          Total: {(selectedRoom?.total_price ?? 0).toFixed(2)} RON
        </p>
        <Link
          href={`/my-booking/${token}`}
          className="mt-5 inline-block w-full rounded-lg bg-[#7a2540] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#651e34]"
        >
          Vezi rezervarea ta
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      {step === "search" && (
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center gap-2 text-stone-700">
            <CalendarDays className="h-5 w-5 text-[#7a2540]" />
            <p className="font-semibold">Verifică disponibilitate</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="checkin" className="block text-xs font-medium text-stone-600">
                Check-in
              </label>
              <input
                id="checkin"
                type="date"
                required
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-[#7a2540] focus:outline-none focus:ring-2 focus:ring-[#7a2540]/10"
              />
            </div>
            <div>
              <label htmlFor="checkout" className="block text-xs font-medium text-stone-600">
                Check-out
              </label>
              <input
                id="checkout"
                type="date"
                required
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-[#7a2540] focus:outline-none focus:ring-2 focus:ring-[#7a2540]/10"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-[#7a2540] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#651e34] disabled:opacity-60"
          >
            {isPending ? "Se caută..." : "Caută camere disponibile"}
          </button>
        </form>
      )}

      {step === "select" && (
        <div>
          <button
            type="button"
            onClick={() => setStep("search")}
            className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Schimbă datele
          </button>
          <p className="text-sm text-stone-600">
            {formatDate(checkin)} → {formatDate(checkout)} · {nights} {nights === 1 ? "noapte" : "nopți"}
          </p>
          {rooms.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              Nicio cameră disponibilă pentru aceste date. Încearcă alt interval.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.room_id}
                  className="flex items-center justify-between rounded-xl border border-stone-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f6e9ec] text-[#7a2540]">
                      <BedDouble className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">Camera {room.number}</p>
                      <p className="text-xs text-stone-500">{room.type || "Standard"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-stone-900">{room.total_price.toFixed(2)} RON</p>
                    <p className="text-xs text-stone-500">
                      {nights > 0 ? (room.total_price / nights).toFixed(2) : room.nightly_rate.toFixed(2)}{" "}
                      RON/noapte în medie
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectRoom(room)}
                      className="mt-1 rounded-lg bg-[#7a2540] px-3 py-1 text-xs font-semibold text-white hover:bg-[#651e34]"
                    >
                      Alege
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "details" && selectedRoom && (
        <form onSubmit={handleSubmitDetails} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep("select")}
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Alege altă cameră
          </button>
          <div className="rounded-xl bg-[#f6e9ec] p-3 text-sm text-[#5a1e33]">
            Camera {selectedRoom.number} · {formatDate(checkin)} → {formatDate(checkout)} ·{" "}
            {selectedRoom.total_price.toFixed(2)} RON total
          </div>
          <div>
            <label htmlFor="guest_name" className="block text-xs font-medium text-stone-600">
              Nume complet
            </label>
            <input
              id="guest_name"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-[#7a2540] focus:outline-none focus:ring-2 focus:ring-[#7a2540]/10"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-stone-600">
              Telefon
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xx xxx xxx"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-[#7a2540] focus:outline-none focus:ring-2 focus:ring-[#7a2540]/10"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-[#7a2540] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#651e34] disabled:opacity-60"
          >
            {isPending ? "Se confirmă..." : "Confirmă rezervarea"}
          </button>
          <p className="text-center text-xs text-stone-400">
            Rezervare directă la {hotelName} — fără comision de platformă.
          </p>
        </form>
      )}
    </div>
  );
}
