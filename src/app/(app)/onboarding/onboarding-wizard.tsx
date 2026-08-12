"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, DoorOpen, PartyPopper, UserPlus } from "lucide-react";
import type { Invite } from "@/types/database";
import { InviteSection } from "../staff/invite-section";
import { bulkCreateRooms } from "./actions";

const STEPS = [
  { label: "Camere", icon: DoorOpen },
  { label: "Personal", icon: UserPlus },
  { label: "Gata", icon: PartyPopper },
];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === step;
        const done = i < step;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-olive-600 text-white"
                  : active
                    ? "bg-olive-100 text-olive-700 ring-2 ring-olive-500"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}

function RoomsStep({ onNext }: { onNext: () => void }) {
  const [state, formAction, pending] = useActionState(bulkCreateRooms, undefined);
  const justAdded = !pending && state !== undefined && state.error === undefined;

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">Adaugă camerele hotelului</h2>
      <p className="mt-1 text-sm text-slate-500">
        Generăm rapid camerele — poți edita fiecare cameră individual mai târziu, din pagina
        Camere.
      </p>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="count" className="block text-xs font-medium text-slate-600">
            Câte camere?
          </label>
          <input
            id="count"
            name="count"
            type="number"
            min="1"
            max="200"
            required
            defaultValue="10"
            className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <div>
          <label htmlFor="start_number" className="block text-xs font-medium text-slate-600">
            Numărul primei camere
          </label>
          <input
            id="start_number"
            name="start_number"
            type="number"
            min="1"
            required
            defaultValue="101"
            className="mt-1 w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <div>
          <label htmlFor="floor" className="block text-xs font-medium text-slate-600">
            Etaj (opțional)
          </label>
          <input
            id="floor"
            name="floor"
            type="number"
            className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <div>
          <label htmlFor="nightly_rate" className="block text-xs font-medium text-slate-600">
            Preț/noapte (opțional)
          </label>
          <input
            id="nightly_rate"
            name="nightly_rate"
            type="number"
            min="0"
            step="0.01"
            placeholder="RON"
            className="mt-1 w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:from-olive-500 hover:to-olive-600 disabled:opacity-60"
        >
          {pending ? "Se creează..." : "Creează camerele"}
        </button>
      </form>

      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {justAdded && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <Check className="h-4 w-4" />
          Camerele au fost adăugate.
        </p>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <button type="button" onClick={onNext} className="text-xs font-medium text-slate-400 hover:text-slate-600">
          Sari peste pasul acesta
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-lg bg-olive-700 px-4 py-2 text-sm font-semibold text-white hover:bg-olive-800"
        >
          Continuă
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StaffStep({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">Invită personalul</h2>
      <p className="mt-1 text-sm text-slate-500">
        Generează un link de invitație și trimite-l colegilor (WhatsApp, email) — își creează
        singuri contul, direct în hotelul tău. Poți face asta oricând mai târziu, din pagina
        Personal.
      </p>
      <div className="mt-4">
        <InviteSection invites={[] as Invite[]} />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <button type="button" onClick={onNext} className="text-xs font-medium text-slate-400 hover:text-slate-600">
          Sari peste pasul acesta
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-lg bg-olive-700 px-4 py-2 text-sm font-semibold text-white hover:bg-olive-800"
        >
          Continuă
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DoneStep() {
  const router = useRouter();
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <PartyPopper className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">Aplicația e gata de lucru!</h2>
      <p className="mt-1 text-sm text-slate-500">
        Poți reveni oricând să adaugi camere, personal, tarife sau setări din meniul din stânga.
      </p>
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-olive-600 to-olive-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-olive-500 hover:to-olive-600"
      >
        Mergi la Dashboard
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex justify-center">
        <StepIndicator step={step} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        {step === 0 && <RoomsStep onNext={() => setStep(1)} />}
        {step === 1 && <StaffStep onNext={() => setStep(2)} />}
        {step === 2 && <DoneStep />}
      </div>
    </div>
  );
}
