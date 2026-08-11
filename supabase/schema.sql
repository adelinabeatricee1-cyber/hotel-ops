-- Hotel Ops schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Links an auth.users row to a hotel ("users" table from the spec).
-- Supabase already provides auth.users for credentials; this table adds the
-- hotel_id that makes every other table's data isolated per hotel.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  hotel_id uuid not null references hotels (id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'manager', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  number text not null,
  floor int,
  type text,
  status text not null default 'clean' check (status in ('clean', 'dirty', 'inprogress', 'blocked')),
  created_at timestamptz not null default now(),
  unique (hotel_id, number)
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  name text not null,
  role text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  room_id uuid references rooms (id) on delete cascade,
  type text not null default 'housekeeping' check (type in ('housekeeping', 'maintenance')),
  assigned_to uuid references staff (id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'inprogress', 'done')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  room_id uuid references rooms (id) on delete set null,
  guest_name text not null,
  phone text,
  checkin date not null,
  checkout date not null,
  source text not null default 'direct' check (source in ('direct', 'booking', 'expedia')),
  status text not null default 'confirmed' check (status in ('confirmed', 'checked_in', 'checked_out', 'cancelled')),
  price numeric(10, 2),
  created_at timestamptz not null default now()
);

create index if not exists rooms_hotel_id_idx on rooms (hotel_id);
create index if not exists staff_hotel_id_idx on staff (hotel_id);
create index if not exists tasks_hotel_id_idx on tasks (hotel_id);
create index if not exists tasks_room_id_idx on tasks (room_id);
create index if not exists bookings_hotel_id_idx on bookings (hotel_id);
create index if not exists bookings_room_id_idx on bookings (room_id);

-- ---------------------------------------------------------------------------
-- Helper: current user's hotel_id
-- ---------------------------------------------------------------------------

create or replace function auth_hotel_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select hotel_id from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: every table is scoped to the caller's hotel
-- ---------------------------------------------------------------------------

alter table hotels enable row level security;
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table staff enable row level security;
alter table tasks enable row level security;
alter table bookings enable row level security;

drop policy if exists "hotels: select own" on hotels;
create policy "hotels: select own" on hotels
  for select using (id = auth_hotel_id());

drop policy if exists "profiles: select own hotel" on profiles;
create policy "profiles: select own hotel" on profiles
  for select using (hotel_id = auth_hotel_id());

drop policy if exists "profiles: insert self" on profiles;
create policy "profiles: insert self" on profiles
  for insert with check (id = auth.uid());

drop policy if exists "profiles: update self" on profiles;
create policy "profiles: update self" on profiles
  for update using (id = auth.uid());

drop policy if exists "rooms: all own hotel" on rooms;
create policy "rooms: all own hotel" on rooms
  for all using (hotel_id = auth_hotel_id()) with check (hotel_id = auth_hotel_id());

drop policy if exists "staff: all own hotel" on staff;
create policy "staff: all own hotel" on staff
  for all using (hotel_id = auth_hotel_id()) with check (hotel_id = auth_hotel_id());

drop policy if exists "tasks: all own hotel" on tasks;
create policy "tasks: all own hotel" on tasks
  for all using (hotel_id = auth_hotel_id()) with check (hotel_id = auth_hotel_id());

drop policy if exists "bookings: all own hotel" on bookings;
create policy "bookings: all own hotel" on bookings
  for all using (hotel_id = auth_hotel_id()) with check (hotel_id = auth_hotel_id());

-- ---------------------------------------------------------------------------
-- Signup helper: creates a hotel + profile atomically for a brand-new user.
-- Called from the app right after auth.signUp() succeeds.
-- ---------------------------------------------------------------------------

create or replace function create_hotel_and_profile(hotel_name text, owner_full_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_hotel_id uuid;
begin
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'profile already exists for this user';
  end if;

  insert into hotels (name) values (hotel_name) returning id into new_hotel_id;

  insert into profiles (id, hotel_id, full_name, role)
  values (auth.uid(), new_hotel_id, owner_full_name, 'admin');

  return new_hotel_id;
end;
$$;

grant execute on function create_hotel_and_profile(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Guest billing: payment tracking + sequential invoice numbers per hotel
-- ---------------------------------------------------------------------------

alter table bookings add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'partial', 'paid'));
alter table bookings add column if not exists amount_paid numeric(10, 2) not null default 0;
alter table bookings add column if not exists invoice_number int;
alter table bookings add column if not exists invoice_issued_at timestamptz;

alter table hotels add column if not exists invoice_seq int not null default 0;

-- Atomically assigns the next invoice number for a hotel and stamps the
-- booking with it. Safe to call repeatedly: returns the existing number
-- if the booking was already invoiced instead of burning a new one.
create or replace function issue_invoice_number(p_booking_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
  v_existing int;
  v_next int;
begin
  select hotel_id, invoice_number into v_hotel_id, v_existing
  from bookings where id = p_booking_id;

  if v_hotel_id is null or v_hotel_id <> auth_hotel_id() then
    raise exception 'not authorized';
  end if;

  if v_existing is not null then
    return v_existing;
  end if;

  update hotels set invoice_seq = invoice_seq + 1
  where id = v_hotel_id
  returning invoice_seq into v_next;

  update bookings set invoice_number = v_next, invoice_issued_at = now()
  where id = p_booking_id;

  return v_next;
end;
$$;

grant execute on function issue_invoice_number(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff accounts: invite links so an admin can bring teammates into the
-- same hotel with their own login, instead of everyone sharing one account.
-- ---------------------------------------------------------------------------

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  email text,
  role text not null default 'staff' check (role in ('manager', 'staff')),
  token uuid not null default gen_random_uuid() unique,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid references profiles (id) on delete set null
);

create index if not exists invites_hotel_id_idx on invites (hotel_id);

alter table invites enable row level security;

-- Current user's role, for policies that need to distinguish admin/manager
-- from regular staff.
create or replace function auth_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

drop policy if exists "invites: admin/manager manage own hotel" on invites;
create policy "invites: admin/manager manage own hotel" on invites
  for all
  using (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'))
  with check (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

-- Guest financial data (bookings/invoices) is admin/manager only; regular
-- staff (housekeeping etc.) never see pricing or payment status.
drop policy if exists "bookings: all own hotel" on bookings;
drop policy if exists "bookings: admin/manager own hotel" on bookings;
create policy "bookings: admin/manager own hotel" on bookings
  for all
  using (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'))
  with check (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

-- Everyone in the hotel can see the staff directory (needed to assign
-- housekeeping tasks), but only admin/manager can add, edit, or remove
-- people.
drop policy if exists "staff: all own hotel" on staff;
drop policy if exists "staff: select own hotel" on staff;
create policy "staff: select own hotel" on staff
  for select using (hotel_id = auth_hotel_id());

drop policy if exists "staff: admin/manager insert" on staff;
create policy "staff: admin/manager insert" on staff
  for insert with check (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

drop policy if exists "staff: admin/manager update" on staff;
create policy "staff: admin/manager update" on staff
  for update using (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

drop policy if exists "staff: admin/manager delete" on staff;
create policy "staff: admin/manager delete" on staff
  for delete using (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

-- Read-only preview so an invite link can greet an unauthenticated visitor
-- ("You're invited to join <hotel> as <role>") before they sign up.
create or replace function get_invite_info(p_token uuid)
returns table (hotel_name text, role text, valid boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites%rowtype;
begin
  select * into v_invite from invites where token = p_token;

  if v_invite.id is null or v_invite.used_at is not null or v_invite.expires_at < now() then
    return query select null::text, null::text, false;
    return;
  end if;

  return query
    select h.name, v_invite.role, true
    from hotels h where h.id = v_invite.hotel_id;
end;
$$;

grant execute on function get_invite_info(uuid) to anon, authenticated;

-- Redeems an invite for the currently authenticated user: creates their
-- profile in the invite's hotel with the invite's role, then marks the
-- invite used. Mirrors create_hotel_and_profile()'s pattern for signup.
create or replace function redeem_invite(p_token uuid, p_full_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites%rowtype;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'must be authenticated';
  end if;

  if exists (select 1 from profiles where id = v_user_id) then
    raise exception 'profile already exists for this user';
  end if;

  select * into v_invite from invites where token = p_token for update;

  if v_invite.id is null then
    raise exception 'invalid invite';
  end if;

  if v_invite.used_at is not null then
    raise exception 'invite already used';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'invite expired';
  end if;

  insert into profiles (id, hotel_id, full_name, role)
  values (v_user_id, v_invite.hotel_id, p_full_name, v_invite.role);

  update invites set used_at = now(), used_by = v_user_id where id = v_invite.id;

  return v_invite.hotel_id;
end;
$$;

grant execute on function redeem_invite(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Loyal guests + points, auto-awarded when a booking is marked paid.
-- ---------------------------------------------------------------------------

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  loyalty_points int not null default 0,
  visit_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists guests_hotel_id_idx on guests (hotel_id);

alter table guests enable row level security;

drop policy if exists "guests: admin/manager own hotel" on guests;
create policy "guests: admin/manager own hotel" on guests
  for all
  using (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'))
  with check (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

alter table bookings add column if not exists guest_id uuid references guests (id) on delete set null;
alter table bookings add column if not exists loyalty_awarded boolean not null default false;

create index if not exists bookings_guest_id_idx on bookings (guest_id);

-- 1 point per 10 RON, awarded once, the first time a booking flips to paid.
create or replace function handle_booking_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'paid'
     and old.payment_status is distinct from 'paid'
     and new.guest_id is not null
     and not new.loyalty_awarded then
    update guests
      set loyalty_points = loyalty_points + floor(coalesce(new.price, 0) / 10)::int,
          visit_count = visit_count + 1
      where id = new.guest_id;
    new.loyalty_awarded := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_booking_paid on bookings;
create trigger trg_booking_paid
  before update on bookings
  for each row
  execute function handle_booking_paid();
