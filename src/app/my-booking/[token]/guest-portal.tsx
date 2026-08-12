"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Sparkles,
  Car,
  Wifi,
  MessageCircleMore,
  MessageSquareWarning,
  Receipt,
  Check,
  Copy,
  CalendarClock,
  XCircle,
} from "lucide-react";
import { cancelBooking, requestHousekeeping, requestParking, submitFeedback } from "./actions";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "@/app/(app)/bookings/labels";
import type { BookingStatus, PaymentStatus } from "@/types/database";

function ActionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f6e9ec] text-[#7a2540]">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-stone-900">{title}</p>
          <p className="text-xs text-stone-500">{subtitle}</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function daysBetween(a: Date, b: Date) {
  const ms = new Date(b.toDateString()).getTime() - new Date(a.toDateString()).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function TodayBanner({ checkin, checkout }: { checkin: string; checkout: string }) {
  const today = new Date();
  const checkinDate = new Date(`${checkin}T00:00:00`);
  const checkoutDate = new Date(`${checkout}T00:00:00`);

  const untilCheckin = daysBetween(today, checkinDate);
  const untilCheckout = daysBetween(today, checkoutDate);

  const dateLabel = (d: Date) => d.toLocaleDateString("ro-RO", { day: "numeric", month: "long" });

  let message: string;
  if (untilCheckin > 0) {
    message =
      untilCheckin === 1
        ? `Te așteptăm mâine, ${dateLabel(checkinDate)}. Check-in de la ora 14:00.`
        : `Te așteptăm pe ${dateLabel(checkinDate)}. Check-in de la ora 14:00.`;
  } else if (untilCheckout > 0) {
    message =
      untilCheckout === 1
        ? `Sejur plăcut! Checkout mâine, ${dateLabel(checkoutDate)}, până la ora 11:00.`
        : `Sejur plăcut! Mai ai ${untilCheckout} nopți — checkout pe ${dateLabel(checkoutDate)}.`;
  } else if (untilCheckout === 0) {
    message = "Astăzi este ziua de checkout — până la ora 11:00. Sperăm să te revedem curând!";
  } else {
    message = "Sperăm că ai avut un sejur plăcut!";
  }

  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f3ead9] p-4 text-[#5a4a2f]">
      <CalendarClock className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">Pentru tine astăzi</p>
        <p className="mt-0.5 text-sm">{message}</p>
      </div>
    </div>
  );
}

function HousekeepingCard({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(requestHousekeeping, undefined);
  const [note, setNote] = useState("");

  if (state?.success) {
    return (
      <ActionCard
        icon={<Sparkles className="h-5 w-5" />}
        title="Housekeeping"
        subtitle="Prosoape, curățenie, consumabile"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <Check className="h-4 w-4" />
          Cerere trimisă — echipa a fost anunțată.
        </p>
      </ActionCard>
    );
  }

  return (
    <ActionCard
      icon={<Sparkles className="h-5 w-5" />}
      title="Housekeeping"
      subtitle="Prosoape, curățenie, consumabile"
    >
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="token" value={token} />
        <input
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: prosoape curate, apă"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-[#7a2540] focus:outline-none focus:ring-2 focus:ring-[#7a2540]/10"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[#7a2540] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#651e34] disabled:opacity-60"
        >
          {pending ? "Se trimite..." : "Trimite cerere"}
        </button>
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      </form>
    </ActionCard>
  );
}

function ParkingCard({ token, initialLabel }: { token: string; initialLabel: string | null }) {
  const [label, setLabel] = useState(initialLabel);
  const [notFound, setNotFound] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRequest() {
    setNotFound(false);
    startTransition(async () => {
      const result = await requestParking(token);
      if (result.label) {
        setLabel(result.label);
      } else {
        setNotFound(true);
      }
    });
  }

  return (
    <ActionCard icon={<Car className="h-5 w-5" />} title="Parcare" subtitle="Loc alocat pentru sejurul tău">
      {label ? (
        <p className="text-sm text-stone-700">
          Locul tău: <span className="font-semibold text-stone-900">{label}</span>
        </p>
      ) : (
        <div>
          <button
            type="button"
            onClick={handleRequest}
            disabled={isPending}
            className="w-full rounded-lg bg-[#7a2540] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#651e34] disabled:opacity-60"
          >
            {isPending ? "Se caută..." : "Solicită loc de parcare"}
          </button>
          {notFound && (
            <p className="mt-2 text-xs text-red-600">
              Niciun loc liber momentan — contactează recepția.
            </p>
          )}
        </div>
      )}
    </ActionCard>
  );
}

function FeedbackCard({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(submitFeedback, undefined);
  const [message, setMessage] = useState("");

  if (state?.success) {
    return (
      <ActionCard
        icon={<MessageSquareWarning className="h-5 w-5" />}
        title="Feedback / problemă"
        subtitle="Trimite acum, nu după checkout"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <Check className="h-4 w-4" />
          Mulțumim! Mesajul a fost trimis recepției.
        </p>
      </ActionCard>
    );
  }

  return (
    <ActionCard
      icon={<MessageSquareWarning className="h-5 w-5" />}
      title="Feedback / problemă"
      subtitle="Trimite acum, nu după checkout"
    >
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="token" value={token} />
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Spune-ne ce e în neregulă sau ce ai nevoie"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-[#7a2540] focus:outline-none focus:ring-2 focus:ring-[#7a2540]/10"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[#7a2540] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#651e34] disabled:opacity-60"
        >
          {pending ? "Se trimite..." : "Trimite"}
        </button>
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      </form>
    </ActionCard>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <p>
        {label}: <span className="font-semibold text-stone-900">{value}</span>
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 hover:border-[#7a2540] hover:text-[#7a2540]"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copiat" : "Copiază"}
      </button>
    </div>
  );
}

function WifiCard({ network, password }: { network: string | null; password: string | null }) {
  return (
    <ActionCard icon={<Wifi className="h-5 w-5" />} title="Wi-Fi" subtitle="Acces gratuit pe durata sejurului">
      <div className="space-y-2 text-sm text-stone-700">
        {network && <CopyField label="Rețea" value={network} />}
        {password && <CopyField label="Parolă" value={password} />}
      </div>
    </ActionCard>
  );
}

function ReceptionCard({ phone, guestName }: { phone: string; guestName: string }) {
  const text = encodeURIComponent(`Bună, sunt ${guestName}. `);
  return (
    <ActionCard
      icon={<MessageCircleMore className="h-5 w-5" />}
      title="Scrie recepției"
      subtitle="Răspuns rapid pe WhatsApp"
    >
      <a
        href={`https://wa.me/${phone}?text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-lg bg-[#7a2540] px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#651e34]"
      >
        Deschide WhatsApp
      </a>
    </ActionCard>
  );
}

function CancellationCard({
  token,
  status,
  checkin,
  cancellationPolicy,
  freeCancellationHours,
}: {
  token: string;
  status: BookingStatus;
  checkin: string;
  cancellationPolicy: string | null;
  freeCancellationHours: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(status === "cancelled");
  const [now] = useState(() => Date.now());

  const checkinDate = new Date(`${checkin}T00:00:00`);
  const canCancelOnline = !cancelled && status === "confirmed" && checkinDate.getTime() > now;
  const hoursUntilCheckin = (checkinDate.getTime() - now) / (1000 * 60 * 60);
  const isFree = hoursUntilCheckin >= freeCancellationHours;

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelBooking(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCancelled(true);
      setConfirming(false);
    });
  }

  if (cancelled) {
    return (
      <ActionCard icon={<XCircle className="h-5 w-5" />} title="Anulare" subtitle="Rezervare anulată">
        <p className="text-sm text-stone-500">
          Această rezervare a fost anulată. Ne pare rău că nu ne vom vedea de data aceasta!
        </p>
      </ActionCard>
    );
  }

  if (!canCancelOnline) {
    return null;
  }

  return (
    <ActionCard icon={<XCircle className="h-5 w-5" />} title="Anulare" subtitle="Gestionează rezervarea">
      {cancellationPolicy && <p className="text-xs text-stone-500">{cancellationPolicy}</p>}
      <p className="mt-1 text-xs text-stone-400">
        {isFree ? "Anulare gratuită acum." : "În afara ferestrei de anulare gratuită."}
      </p>
      {confirming ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm font-medium text-stone-700">Sigur anulezi rezervarea?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "Se anulează..." : "Da, anulează"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Renunță
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Anulează rezervarea
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </ActionCard>
  );
}

function StayCard({
  roomNumber,
  checkin,
  checkout,
  price,
  amountPaid,
  paymentStatus,
  invoiceNumber,
}: {
  roomNumber: string | null;
  checkin: string;
  checkout: string;
  price: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  invoiceNumber: number | null;
}) {
  const due = Math.max(price - amountPaid, 0);

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("ro-RO", { day: "numeric", month: "long" });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:col-span-2">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f6e9ec] text-[#7a2540]">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-stone-900">Sejurul tău</p>
          <p className="text-xs text-stone-500">
            {roomNumber ? `Camera ${roomNumber} · ` : ""}
            {formatDate(checkin)} → {formatDate(checkout)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
        <div className="text-sm text-stone-600">
          <p>
            Total <span className="font-semibold text-stone-900">{price.toFixed(2)} RON</span>
          </p>
          {due > 0 && (
            <p className="text-xs text-stone-500">Rest de plată: {due.toFixed(2)} RON</p>
          )}
          {invoiceNumber && <p className="text-xs text-stone-400">Factură #{invoiceNumber}</p>}
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${PAYMENT_STATUS_STYLES[paymentStatus]}`}
        >
          {PAYMENT_STATUS_LABELS[paymentStatus]}
        </span>
      </div>
    </div>
  );
}

export function GuestPortal({
  token,
  guestName,
  hotelName,
  roomNumber,
  checkin,
  checkout,
  price,
  amountPaid,
  paymentStatus,
  invoiceNumber,
  wifiNetwork,
  wifiPassword,
  receptionPhone,
  parkingLabel,
  coverImageUrl,
  status,
  cancellationPolicy,
  freeCancellationHours,
}: {
  token: string;
  guestName: string;
  hotelName: string;
  roomNumber: string | null;
  checkin: string;
  checkout: string;
  price: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  invoiceNumber: number | null;
  wifiNetwork: string | null;
  wifiPassword: string | null;
  receptionPhone: string | null;
  parkingLabel: string | null;
  coverImageUrl: string | null;
  status: BookingStatus;
  cancellationPolicy: string | null;
  freeCancellationHours: number;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white print:rounded-none"
        style={
          coverImageUrl
            ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div
          className={
            coverImageUrl
              ? "absolute inset-0 bg-gradient-to-br from-[#4a1526]/85 to-[#4a1526]/70"
              : "absolute inset-0 bg-gradient-to-br from-[#7a2540] to-[#4a1526]"
          }
        />
        <div className="relative">
          <p className="text-sm text-white/70">{hotelName}</p>
          <h1 className="mt-1 text-2xl font-bold">Bun venit, {guestName}!</h1>
          <p className="mt-1 text-sm text-white/80">
            Tot ce ai nevoie pentru sejurul tău, într-un singur loc.
          </p>
        </div>
      </div>

      <div className="print:hidden">
        <TodayBanner checkin={checkin} checkout={checkout} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 print:hidden">
        <HousekeepingCard token={token} />
        <ParkingCard token={token} initialLabel={parkingLabel} />
        {(wifiNetwork || wifiPassword) && (
          <WifiCard network={wifiNetwork} password={wifiPassword} />
        )}
        {receptionPhone && <ReceptionCard phone={receptionPhone} guestName={guestName} />}
        <FeedbackCard token={token} />
        <CancellationCard
          token={token}
          status={status}
          checkin={checkin}
          cancellationPolicy={cancellationPolicy}
          freeCancellationHours={freeCancellationHours}
        />
        <StayCard
          roomNumber={roomNumber}
          checkin={checkin}
          checkout={checkout}
          price={price}
          amountPaid={amountPaid}
          paymentStatus={paymentStatus}
          invoiceNumber={invoiceNumber}
        />
      </div>

      <div className="mt-4 hidden print:block">
        <StayCard
          roomNumber={roomNumber}
          checkin={checkin}
          checkout={checkout}
          price={price}
          amountPaid={amountPaid}
          paymentStatus={paymentStatus}
          invoiceNumber={invoiceNumber}
        />
      </div>
    </div>
  );
}
