import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/current-user";
import type { Guest } from "@/types/database";
import { AddGuestForm } from "./add-guest-form";
import { GuestRow } from "./guest-row";

export default async function GuestsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .order("loyalty_points", { ascending: false })
    .returns<Guest[]>();

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <Heart className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Clienți fideli</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        1 punct la fiecare 10 RON plătiți. Punctele se acordă automat când o rezervare e marcată
        „Plătit&rdquo; și e legată de un client.
      </p>

      <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <AddGuestForm />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        {guests && guests.length > 0 ? (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                <th className="pb-2">Nume</th>
                <th className="pb-2">Telefon</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Sejururi</th>
                <th className="pb-2">Puncte</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <GuestRow key={guest.id} guest={guest} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">Niciun client adăugat încă.</p>
        )}
      </div>
    </div>
  );
}
