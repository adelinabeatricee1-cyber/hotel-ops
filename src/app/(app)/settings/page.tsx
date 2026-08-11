import { Settings } from "lucide-react";
import { requireAdmin } from "@/lib/current-user";
import { GuestSettingsForm } from "./guest-settings-form";

export default async function SettingsPage() {
  const { hotel } = await requireAdmin();

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <Settings className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Setări</h1>
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Informații pentru oaspeți</h2>
        <p className="mt-1 text-xs text-slate-500">
          Apar pe pagina publică pe care o primește fiecare oaspete (Rezervări → „Link oaspete&rdquo;).
        </p>
        <div className="mt-4">
          <GuestSettingsForm hotel={hotel} />
        </div>
      </div>
    </div>
  );
}
