import Link from "next/link";
import { BedDouble } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";

interface InviteInfo {
  hotel_name: string | null;
  role: string | null;
  valid: boolean;
}

function InvalidInviteCard({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-700 via-stone-800 to-olive-900 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/95 p-8 text-center shadow-2xl shadow-stone-900/30 backdrop-blur">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-olive-600 to-olive-700 text-white shadow-lg shadow-olive-600/30">
          <BedDouble className="h-5 w-5" />
        </div>
        <h1 className="mt-3 text-lg font-bold text-slate-900">Hotel Ops</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <Link
          href="/login"
          className="mt-5 inline-block font-semibold text-olive-700 hover:text-olive-600"
        >
          Mergi la autentificare
        </Link>
      </div>
    </div>
  );
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const supabase = await createClient();

  if (!token) {
    return <InvalidInviteCard message="Acest link de invitație este invalid sau incomplet." />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return (
        <InvalidInviteCard message="Ești deja autentificat/ă cu un cont care aparține unui hotel. Deconectează-te mai întâi dacă vrei să folosești această invitație cu alt cont." />
      );
    }
  }

  const { data } = await supabase.rpc("get_invite_info", { p_token: token });

  const info = (data as InviteInfo[] | null)?.[0];

  if (!info || !info.valid || !info.hotel_name || !info.role) {
    return (
      <InvalidInviteCard message="Acest link de invitație a expirat sau a fost deja folosit. Cere administratorului hotelului un link nou." />
    );
  }

  return <JoinForm token={token} hotelName={info.hotel_name} role={info.role} />;
}
