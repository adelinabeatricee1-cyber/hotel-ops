import { createClient } from "@/lib/supabase/server";
import type { Staff } from "@/types/database";
import { AddStaffForm } from "./add-staff-form";
import { StaffRow } from "./staff-row";

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .order("name")
    .returns<Staff[]>();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Personal</h1>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <AddStaffForm />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        {staff && staff.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                <th className="pb-2">Nume</th>
                <th className="pb-2">Rol</th>
                <th className="pb-2">Telefon</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <StaffRow key={member.id} member={member} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">Niciun membru al personalului adăugat încă.</p>
        )}
      </div>
    </div>
  );
}
