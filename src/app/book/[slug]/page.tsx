import { BedDouble } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingWidget } from "./booking-widget";

interface HotelPublicInfo {
  hotel_id: string;
  hotel_name: string;
  cover_image_url: string | null;
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_hotel_public_info", { p_slug: slug });
  const hotel = (data as HotelPublicInfo[] | null)?.[0];

  if (!hotel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f1e6] px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#7a2540] text-white">
            <BedDouble className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-stone-600">
            Această pagină de rezervare nu există sau nu mai este activă.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f1e6] px-4 py-8">
      <div className="mx-auto max-w-md">
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={
            hotel.cover_image_url
              ? {
                  backgroundImage: `url(${hotel.cover_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div
            className={
              hotel.cover_image_url
                ? "absolute inset-0 bg-gradient-to-br from-[#4a1526]/85 to-[#4a1526]/70"
                : "absolute inset-0 bg-gradient-to-br from-[#7a2540] to-[#4a1526]"
            }
          />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <BedDouble className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold">{hotel.hotel_name}</p>
            </div>
            <p className="mt-2 text-sm text-white/80">Rezervă direct, fără comision.</p>
          </div>
        </div>

        <div className="mt-4">
          <BookingWidget slug={slug} hotelName={hotel.hotel_name} />
        </div>
      </div>
    </div>
  );
}
