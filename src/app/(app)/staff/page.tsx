import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/current-user";
import type { Invite, Staff } from "@/types/database";
import { AddStaffForm } from "./add-staff-form";
import { InviteSection } from "./invite-section";
import { StaffRow } from "./staff-row";

export default async function StaffPage() {
  const { profile } = await requireProfile();
  const canManage = profile.role === "admin" || profile.role === "manager";
  const supabase = await createClient();

  const [{ data: staff }, { data: invites }] = await Promise.all([
    supabase.from("staff").select("*").order("name").returns<Staff[]>(),
    canManage
      ? supabase
          .from("invites")
          .select("*")
          .is("used_at", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .returns<Invite[]>()
      : Promise.resolve({ data: [] as Invite[] }),
  ]);

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
          <Users className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Personal</h1>
      </div>

      {canManage && (
        <>
          <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <AddStaffForm />
          </div>
          <InviteSection invites={invites ?? []} />
        </>
      )}

      <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
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
                <StaffRow key={member.id} member={member} canManage={canManage} />
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
