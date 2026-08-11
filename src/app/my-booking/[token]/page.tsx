import { BedDouble } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/types/database";
import { GuestPortal } from "./guest-portal";
import { PrintButton } from "./print-button";

interface BookingLookup {
  guest_name: string;
  checkin: string;
  checkout: string;
  room_number: string | null;
  price: number | null;
  amount_paid: number;
  payment_status: PaymentStatus;
  invoice_number: number | null;
  hotel_name: string;
  wifi_network: string | null;
  wifi_password: string | null;
  reception_phone: string | null;
  parking_label: string | null;
}

export default async function MyBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_booking_by_token", { p_token: token });
  const booking = (data as BookingLookup[] | null)?.[0];

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f1e6] px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#7a2540] text-white">
            <BedDouble className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-stone-600">
            Acest link nu este valid. Contactează hotelul pentru un link nou.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f1e6] px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-2xl justify-end print:hidden">
        <PrintButton />
      </div>
      <GuestPortal
        token={token}
        guestName={booking.guest_name}
        hotelName={booking.hotel_name}
        roomNumber={booking.room_number}
        checkin={booking.checkin}
        checkout={booking.checkout}
        price={booking.price ?? 0}
        amountPaid={booking.amount_paid}
        paymentStatus={booking.payment_status}
        invoiceNumber={booking.invoice_number}
        wifiNetwork={booking.wifi_network}
        wifiPassword={booking.wifi_password}
        receptionPhone={booking.reception_phone}
        parkingLabel={booking.parking_label}
      />
    </div>
  );
}
