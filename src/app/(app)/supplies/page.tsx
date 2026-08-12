import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Supply } from "@/types/database";
import { AddSupplyForm } from "./add-supply-form";
import { SupplyCard } from "./supply-card";

export default async function SuppliesPage() {
  const supabase = await createClient();
  const { data: supplies } = await supabase
    .from("supplies")
    .select("*")
    .order("name")
    .returns<Supply[]>();

  const lowStockCount = (supplies ?? []).filter((s) => s.quantity <= s.low_stock_threshold).length;

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive-100 text-olive-700">
          <Package className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Provizii {lowStockCount > 0 && `(${lowStockCount} cu stoc redus)`}
        </h1>
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <AddSupplyForm />
      </div>

      {supplies && supplies.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {supplies.map((supply) => (
            <SupplyCard key={supply.id} supply={supply} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-slate-500">
          Niciun produs adăugat încă. Adaugă primul mai sus.
        </p>
      )}
    </div>
  );
}
