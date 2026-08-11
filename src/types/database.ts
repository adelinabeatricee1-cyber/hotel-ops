export type RoomStatus = "clean" | "dirty" | "inprogress" | "blocked";
export type TaskType = "housekeeping" | "maintenance";
export type TaskStatus = "todo" | "inprogress" | "done";
export type BookingSource = "direct" | "booking" | "expedia";
export type BookingStatus = "confirmed" | "checked_in" | "checked_out" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type StaffRole = "admin" | "manager" | "staff";

export interface Hotel {
  id: string;
  name: string;
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

export interface Task {
  id: string;
  hotel_id: string;
  room_id: string | null;
  type: TaskType;
  assigned_to: string | null;
  status: TaskStatus;
  notes: string | null;
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
