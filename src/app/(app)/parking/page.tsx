import { SquareParking } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ParkingSpot } from "@/types/database";
import { AddSpotForm } from "./add-spot-form";
import { ParkingSpotCard } from "./parking-spot-card";

export default async function ParkingPage() {
  const supabase = await createClient();
  const { data: spots } = await supabase
    .from("parking_spots")
    .select("*")
    .order("label")
    .returns<ParkingSpot[]>();

  const occupiedCount = (spots ?? []).filter((s) => s.status === "occupied").length;
  const totalCount = spots?.length ?? 0;

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
          <SquareParking className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Parcare {totalCount > 0 && `(${occupiedCount}/${totalCount} ocupate)`}
        </h1>
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <AddSpotForm />
      </div>

      {spots && spots.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {spots.map((spot) => (
            <ParkingSpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-slate-500">
          Niciun loc de parcare adăugat încă. Adaugă primul mai sus.
        </p>
      )}
    </div>
  );
}
