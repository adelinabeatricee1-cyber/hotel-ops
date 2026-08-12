export type RoomStatus = "clean" | "dirty" | "inprogress" | "blocked";
export type TaskType = "housekeeping" | "maintenance";
export type TaskStatus = "todo" | "inprogress" | "done";
export type BookingSource = "direct" | "booking" | "expedia";
export type BookingStatus = "confirmed" | "checked_in" | "checked_out" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type StaffRole = "admin" | "manager" | "staff";
export type ParkingStatus = "available" | "occupied";
export type ShiftType = "morning" | "afternoon" | "night";

export interface Hotel {
  id: string;
  name: string;
  monthly_revenue_target: number | null;
  wifi_network: string | null;
  wifi_password: string | null;
  reception_phone: string | null;
  cover_image_url: string | null;
  booking_slug: string | null;
  google_review_url: string | null;
  cancellation_policy: string | null;
  free_cancellation_hours: number;
  created_at: string;
}

export interface Profile {
  id: string;
  hotel_id: string;
  full_name: string | null;
  role: StaffRole;
  created_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  number: string;
  floor: number | null;
  type: string | null;
  status: RoomStatus;
  nightly_rate: number | null;
  created_at: string;
}

export interface Staff {
  id: string;
  hotel_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  created_at: string;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface Task {
  id: string;
  hotel_id: string;
  room_id: string | null;
  type: TaskType;
  assigned_to: string | null;
  status: TaskStatus;
  notes: string | null;
  checklist: ChecklistItem[];
  photo_url: string | null;
  created_at: string;
}

export interface TaskWithRelations extends Task {
  room: Pick<Room, "id" | "number" | "floor"> | null;
  staff: Pick<Staff, "id" | "name"> | null;
}

export interface Booking {
  id: string;
  hotel_id: string;
  room_id: string | null;
  guest_name: string;
  phone: string | null;
  checkin: string;
  checkout: string;
  source: BookingSource;
  status: BookingStatus;
  price: number | null;
  payment_status: PaymentStatus;
  amount_paid: number;
  invoice_number: number | null;
  invoice_issued_at: string | null;
  guest_id: string | null;
  loyalty_awarded: boolean;
  external_booking_id: string | null;
  guest_access_token: string;
  group_id: string | null;
  cancelled_at: string | null;
  cancelled_by_guest: boolean;
  created_at: string;
}

export interface BookingWithRoom extends Booking {
  room: Pick<Room, "id" | "number" | "floor"> | null;
}

export interface Guest {
  id: string;
  hotel_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyalty_points: number;
  visit_count: number;
  created_at: string;
}

export interface Supply {
  id: string;
  hotel_id: string;
  name: string;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
}

export interface Shift {
  id: string;
  hotel_id: string;
  staff_id: string;
  date: string;
  shift_type: ShiftType;
  created_at: string;
}

export interface ParkingSpot {
  id: string;
  hotel_id: string;
  label: string;
  status: ParkingStatus;
  guest_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProfileHotel {
  id: string;
  profile_id: string;
  hotel_id: string;
  role: StaffRole;
  created_at: string;
}

export interface ProfileHotelWithName extends ProfileHotel {
  hotel: Pick<Hotel, "id" | "name"> | null;
}

export type InviteRole = "manager" | "staff";

export interface Invite {
  id: string;
  hotel_id: string;
  email: string | null;
  role: InviteRole;
  token: string;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

export interface RoomRateOverride {
  id: string;
  hotel_id: string;
  room_id: string;
  date: string;
  rate: number;
  created_at: string;
}
