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
  created_at: string;
}

export interface BookingWithRoom extends Booking {
  room: Pick<Room, "id" | "number" | "floor"> | null;
}
