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

-- ---------------------------------------------------------------------------
-- Booking.com reference: no real sync (that requires Booking.com's
-- Connectivity partner API, which isn't self-serve), just a place to keep
-- their reservation ID for manual lookup in the Booking.com extranet.
-- ---------------------------------------------------------------------------

alter table bookings add column if not exists external_booking_id text;

-- ---------------------------------------------------------------------------
-- Monthly revenue target (single reusable goal, tracked against each
-- month's actual revenue on the Reports page).
-- ---------------------------------------------------------------------------

alter table hotels add column if not exists monthly_revenue_target numeric(10, 2);

-- ---------------------------------------------------------------------------
-- Parking spots: same operational access model as rooms/tasks (everyone in
-- the hotel can manage them, not just admin/manager).
-- ---------------------------------------------------------------------------

create table if not exists parking_spots (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  label text not null,
  status text not null default 'available' check (status in ('available', 'occupied')),
  guest_name text,
  notes text,
  created_at timestamptz not null default now(),
  unique (hotel_id, label)
);

create index if not exists parking_spots_hotel_id_idx on parking_spots (hotel_id);

alter table parking_spots enable row level security;

drop policy if exists "parking_spots: all own hotel" on parking_spots;
create policy "parking_spots: all own hotel" on parking_spots
  for all using (hotel_id = auth_hotel_id()) with check (hotel_id = auth_hotel_id());

-- ---------------------------------------------------------------------------
-- Guest-facing booking status page: a shareable, no-login link per booking
-- (not a guest account/app — see get_booking_by_token() below).
-- ---------------------------------------------------------------------------

alter table bookings add column if not exists guest_access_token uuid not null default gen_random_uuid();

create unique index if not exists bookings_guest_access_token_idx on bookings (guest_access_token);

create or replace function get_booking_by_token(p_token uuid)
returns table (
  guest_name text,
  checkin date,
  checkout date,
  room_number text,
  price numeric,
  amount_paid numeric,
  payment_status text,
  invoice_number int,
  hotel_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select b.guest_name, b.checkin, b.checkout, r.number, b.price, b.amount_paid,
           b.payment_status, b.invoice_number, h.name
    from bookings b
    left join rooms r on r.id = b.room_id
    join hotels h on h.id = b.hotel_id
    where b.guest_access_token = p_token;
end;
$$;

grant execute on function get_booking_by_token(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Direct booking: a public page where guests book straight from the hotel,
-- no OTA commission. Rooms need a nightly_rate to be bookable online, and
-- the hotel needs a booking_slug set (Settings) to expose the page.
-- ---------------------------------------------------------------------------

alter table rooms add column if not exists nightly_rate numeric(10, 2);

alter table hotels add column if not exists booking_slug text unique;
alter table hotels drop constraint if exists hotels_booking_slug_format;
alter table hotels add constraint hotels_booking_slug_format
  check (booking_slug is null or booking_slug ~ '^[a-z0-9-]+$');

create or replace function get_hotel_public_info(p_slug text)
returns table (hotel_id uuid, hotel_name text, cover_image_url text)
language sql
security definer
stable
set search_path = public
as $$
  select id, name, cover_image_url from hotels where booking_slug = p_slug;
$$;

grant execute on function get_hotel_public_info(text) to anon, authenticated;

create or replace function get_available_rooms(p_slug text, p_checkin date, p_checkout date)
returns table (room_id uuid, number text, type text, nightly_rate numeric)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_hotel_id uuid;
begin
  select id into v_hotel_id from hotels where booking_slug = p_slug;

  if v_hotel_id is null then
    return;
  end if;

  return query
    select r.id, r.number, r.type, r.nightly_rate
    from rooms r
    where r.hotel_id = v_hotel_id
      and r.nightly_rate is not null
      and not exists (
        select 1 from bookings b
        where b.room_id = r.id
          and b.status <> 'cancelled'
          and b.checkin < p_checkout
          and b.checkout > p_checkin
      )
    order by r.nightly_rate;
end;
$$;

grant execute on function get_available_rooms(text, date, date) to anon, authenticated;

create or replace function create_direct_booking(
  p_slug text,
  p_room_id uuid,
  p_checkin date,
  p_checkout date,
  p_guest_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
  v_rate numeric;
  v_nights int;
  v_token uuid;
begin
  if p_checkout <= p_checkin then
    raise exception 'invalid dates';
  end if;

  if coalesce(trim(p_guest_name), '') = '' then
    raise exception 'guest name required';
  end if;

  select id into v_hotel_id from hotels where booking_slug = p_slug;
  if v_hotel_id is null then
    raise exception 'invalid hotel';
  end if;

  select nightly_rate into v_rate from rooms
    where id = p_room_id and hotel_id = v_hotel_id;
  if v_rate is null then
    raise exception 'room not bookable';
  end if;

  if exists (
    select 1 from bookings b
    where b.room_id = p_room_id
      and b.status <> 'cancelled'
      and b.checkin < p_checkout
      and b.checkout > p_checkin
  ) then
    raise exception 'room no longer available for these dates';
  end if;

  v_nights := p_checkout - p_checkin;

  insert into bookings (hotel_id, room_id, guest_name, phone, checkin, checkout, source, status, price)
  values (v_hotel_id, p_room_id, trim(p_guest_name), nullif(trim(p_phone), ''), p_checkin, p_checkout, 'direct', 'confirmed', v_rate * v_nights)
  returning guest_access_token into v_token;

  return v_token;
end;
$$;

grant execute on function create_direct_booking(text, uuid, date, date, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Dynamic per-date pricing: an admin can override a room's default
-- nightly_rate for specific dates (weekends, holidays, events).
-- ---------------------------------------------------------------------------

create table if not exists room_rate_overrides (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  room_id uuid not null references rooms (id) on delete cascade,
  date date not null,
  rate numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  unique (room_id, date)
);

create index if not exists room_rate_overrides_room_id_idx on room_rate_overrides (room_id);

alter table room_rate_overrides enable row level security;

drop policy if exists "room_rate_overrides: admin/manager own hotel" on room_rate_overrides;
create policy "room_rate_overrides: admin/manager own hotel" on room_rate_overrides
  for all
  using (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'))
  with check (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

-- Sums the resolved per-night rate (override if set, else the room's
-- default nightly_rate) across a stay. Returns null if the room has no
-- default rate (i.e. isn't bookable online at all).
create or replace function calc_room_price(p_room_id uuid, p_checkin date, p_checkout date)
returns numeric
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_default numeric;
  v_total numeric := 0;
  v_day date;
  v_rate numeric;
begin
  select nightly_rate into v_default from rooms where id = p_room_id;
  if v_default is null then
    return null;
  end if;

  v_day := p_checkin;
  while v_day < p_checkout loop
    select rate into v_rate from room_rate_overrides
      where room_id = p_room_id and date = v_day;
    v_total := v_total + coalesce(v_rate, v_default);
    v_day := v_day + 1;
  end loop;

  return v_total;
end;
$$;

grant execute on function calc_room_price(uuid, date, date) to anon, authenticated;

drop function if exists get_available_rooms(text, date, date);

create or replace function get_available_rooms(p_slug text, p_checkin date, p_checkout date)
returns table (room_id uuid, number text, type text, nightly_rate numeric, total_price numeric)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_hotel_id uuid;
begin
  select id into v_hotel_id from hotels where booking_slug = p_slug;

  if v_hotel_id is null then
    return;
  end if;

  return query
    select r.id, r.number, r.type, r.nightly_rate, calc_room_price(r.id, p_checkin, p_checkout)
    from rooms r
    where r.hotel_id = v_hotel_id
      and r.nightly_rate is not null
      and not exists (
        select 1 from bookings b
        where b.room_id = r.id
          and b.status <> 'cancelled'
          and b.checkin < p_checkout
          and b.checkout > p_checkin
      )
    order by r.nightly_rate;
end;
$$;

grant execute on function get_available_rooms(text, date, date) to anon, authenticated;

create or replace function create_direct_booking(
  p_slug text,
  p_room_id uuid,
  p_checkin date,
  p_checkout date,
  p_guest_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
  v_price numeric;
  v_token uuid;
begin
  if p_checkout <= p_checkin then
    raise exception 'invalid dates';
  end if;

  if coalesce(trim(p_guest_name), '') = '' then
    raise exception 'guest name required';
  end if;

  select id into v_hotel_id from hotels where booking_slug = p_slug;
  if v_hotel_id is null then
    raise exception 'invalid hotel';
  end if;

  if not exists (select 1 from rooms where id = p_room_id and hotel_id = v_hotel_id) then
    raise exception 'invalid room';
  end if;

  v_price := calc_room_price(p_room_id, p_checkin, p_checkout);
  if v_price is null then
    raise exception 'room not bookable';
  end if;

  if exists (
    select 1 from bookings b
    where b.room_id = p_room_id
      and b.status <> 'cancelled'
      and b.checkin < p_checkout
      and b.checkout > p_checkin
  ) then
    raise exception 'room no longer available for these dates';
  end if;

  insert into bookings (hotel_id, room_id, guest_name, phone, checkin, checkout, source, status, price)
  values (v_hotel_id, p_room_id, trim(p_guest_name), nullif(trim(p_phone), ''), p_checkin, p_checkout, 'direct', 'confirmed', v_price)
  returning guest_access_token into v_token;

  return v_token;
end;
$$;

grant execute on function create_direct_booking(text, uuid, date, date, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Guest portal v2: hotel-wide guest info (Wi-Fi, reception contact) plus
-- token-scoped actions a guest can trigger without an account. Each RPC
-- re-derives hotel_id/room_id from the booking's token server-side, so a
-- guest can only ever act on their own booking.
-- ---------------------------------------------------------------------------

alter table hotels add column if not exists wifi_network text;
alter table hotels add column if not exists wifi_password text;
alter table hotels add column if not exists reception_phone text;
alter table hotels add column if not exists cover_image_url text;

create or replace function get_booking_by_token(p_token uuid)
returns table (
  guest_name text,
  checkin date,
  checkout date,
  room_number text,
  price numeric,
  amount_paid numeric,
  payment_status text,
  invoice_number int,
  hotel_name text,
  wifi_network text,
  wifi_password text,
  reception_phone text,
  parking_label text,
  cover_image_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select b.guest_name, b.checkin, b.checkout, r.number, b.price, b.amount_paid,
           b.payment_status, b.invoice_number, h.name,
           h.wifi_network, h.wifi_password, h.reception_phone,
           (select p.label from parking_spots p
              where p.hotel_id = b.hotel_id and p.guest_name = b.guest_name
                and p.status = 'occupied'
              limit 1),
           h.cover_image_url
    from bookings b
    left join rooms r on r.id = b.room_id
    join hotels h on h.id = b.hotel_id
    where b.guest_access_token = p_token;
end;
$$;

grant execute on function get_booking_by_token(uuid) to anon, authenticated;

create or replace function request_guest_housekeeping(p_token uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings%rowtype;
begin
  select * into v_booking from bookings where guest_access_token = p_token;

  if v_booking.id is null then
    raise exception 'invalid token';
  end if;

  insert into tasks (hotel_id, room_id, type, status, notes)
  values (
    v_booking.hotel_id,
    v_booking.room_id,
    'housekeeping',
    'todo',
    'Solicitare oaspete (' || v_booking.guest_name || '): ' || coalesce(nullif(trim(p_note), ''), 'curățenie cameră')
  );
end;
$$;

grant execute on function request_guest_housekeeping(uuid, text) to anon, authenticated;

create or replace function request_guest_parking(p_token uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings%rowtype;
  v_existing text;
  v_spot_id uuid;
  v_label text;
begin
  select * into v_booking from bookings where guest_access_token = p_token;

  if v_booking.id is null then
    raise exception 'invalid token';
  end if;

  select label into v_existing from parking_spots
    where hotel_id = v_booking.hotel_id and guest_name = v_booking.guest_name and status = 'occupied'
    limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  select id, label into v_spot_id, v_label from parking_spots
    where hotel_id = v_booking.hotel_id and status = 'available'
    order by label
    limit 1;

  if v_spot_id is null then
    return null;
  end if;

  update parking_spots set status = 'occupied', guest_name = v_booking.guest_name
    where id = v_spot_id;

  return v_label;
end;
$$;

grant execute on function request_guest_parking(uuid) to anon, authenticated;

create or replace function submit_guest_feedback(p_token uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings%rowtype;
begin
  if coalesce(trim(p_message), '') = '' then
    raise exception 'empty message';
  end if;

  select * into v_booking from bookings where guest_access_token = p_token;

  if v_booking.id is null then
    raise exception 'invalid token';
  end if;

  insert into tasks (hotel_id, room_id, type, status, notes)
  values (
    v_booking.hotel_id,
    v_booking.room_id,
    'maintenance',
    'todo',
    'Feedback oaspete (' || v_booking.guest_name || '): ' || trim(p_message)
  );
end;
$$;

grant execute on function submit_guest_feedback(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Post-checkout review requests: a Google review link staff can send guests
-- shortly after they leave, from a "Cere recenzie" button on Rezervări.
-- ---------------------------------------------------------------------------

alter table hotels add column if not exists google_review_url text;

-- ---------------------------------------------------------------------------
-- Housekeeping checklist + photo proof: each housekeeping task gets a
-- checklist of standard cleaning steps (stored as JSON so staff can check
-- items off) and an optional proof photo before it can be marked done.
-- ---------------------------------------------------------------------------

alter table tasks add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table tasks add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('task-photos', 'task-photos', true)
on conflict (id) do nothing;

drop policy if exists "task-photos: authenticated insert" on storage.objects;
create policy "task-photos: authenticated insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'task-photos');

drop policy if exists "task-photos: public read" on storage.objects;
create policy "task-photos: public read" on storage.objects
  for select using (bucket_id = 'task-photos');

-- ---------------------------------------------------------------------------
-- Supply inventory: everyday consumables (towels, soap, cleaning products)
-- tracked per hotel, same operational access model as rooms/tasks/parking.
-- ---------------------------------------------------------------------------

create table if not exists supplies (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  name text not null,
  unit text not null default 'buc',
  quantity int not null default 0,
  low_stock_threshold int not null default 5,
  created_at timestamptz not null default now(),
  unique (hotel_id, name)
);

create index if not exists supplies_hotel_id_idx on supplies (hotel_id);

alter table supplies enable row level security;

drop policy if exists "supplies: all own hotel" on supplies;
create policy "supplies: all own hotel" on supplies
  for all using (hotel_id = auth_hotel_id()) with check (hotel_id = auth_hotel_id());

-- ---------------------------------------------------------------------------
-- Staff shift scheduling: a weekly grid of who works which shift, each day.
-- Everyone in the hotel can see the schedule; only admin/manager build it
-- (same access model as the staff directory itself).
-- ---------------------------------------------------------------------------

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  staff_id uuid not null references staff (id) on delete cascade,
  date date not null,
  shift_type text not null check (shift_type in ('morning', 'afternoon', 'night')),
  created_at timestamptz not null default now(),
  unique (staff_id, date)
);

create index if not exists shifts_hotel_id_idx on shifts (hotel_id);
create index if not exists shifts_date_idx on shifts (date);

alter table shifts enable row level security;

drop policy if exists "shifts: select own hotel" on shifts;
create policy "shifts: select own hotel" on shifts
  for select using (hotel_id = auth_hotel_id());

drop policy if exists "shifts: admin/manager write" on shifts;
create policy "shifts: admin/manager write" on shifts
  for insert with check (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

drop policy if exists "shifts: admin/manager update" on shifts;
create policy "shifts: admin/manager update" on shifts
  for update using (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

drop policy if exists "shifts: admin/manager delete" on shifts;
create policy "shifts: admin/manager delete" on shifts
  for delete using (hotel_id = auth_hotel_id() and auth_role() in ('admin', 'manager'));

-- ---------------------------------------------------------------------------
-- Group bookings: multiple rooms under one reservation. Modeled as several
-- bookings rows (one per room, so per-room housekeeping/status/pricing keeps
-- working unchanged) tagged with a shared group_id.
-- ---------------------------------------------------------------------------

alter table bookings add column if not exists group_id uuid;
create index if not exists bookings_group_id_idx on bookings (group_id);

-- ---------------------------------------------------------------------------
-- Multi-property support: a profile can belong to more than one hotel.
-- `profiles.hotel_id`/`profiles.role` stay the single source of truth that
-- every existing RLS policy already keys off (via auth_hotel_id()/auth_role())
-- — switching "active property" just updates those two columns on the
-- profile, so no other policy needs to change. profile_hotels only tracks
-- which properties a profile may switch into.
-- ---------------------------------------------------------------------------

create table if not exists profile_hotels (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  hotel_id uuid not null references hotels (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (profile_id, hotel_id)
);

create index if not exists profile_hotels_profile_id_idx on profile_hotels (profile_id);

alter table profile_hotels enable row level security;

drop policy if exists "profile_hotels: select own" on profile_hotels;
create policy "profile_hotels: select own" on profile_hotels
  for select using (profile_id = auth.uid());

-- Backfill: every existing profile at least has access to its current hotel.
insert into profile_hotels (profile_id, hotel_id, role)
select id, hotel_id, role from profiles
on conflict (profile_id, hotel_id) do nothing;

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

  insert into profile_hotels (profile_id, hotel_id, role)
  values (auth.uid(), new_hotel_id, 'admin');

  return new_hotel_id;
end;
$$;

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

  insert into profile_hotels (profile_id, hotel_id, role)
  values (v_user_id, v_invite.hotel_id, v_invite.role)
  on conflict (profile_id, hotel_id) do update set role = excluded.role;

  update invites set used_at = now(), used_by = v_user_id where id = v_invite.id;

  return v_invite.hotel_id;
end;
$$;

-- Creates a brand-new property (hotel) owned by the current admin and grants
-- them access to it, without switching the active property.
create or replace function create_property(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_new_hotel_id uuid;
begin
  select role into v_role from profiles where id = auth.uid();

  if v_role is distinct from 'admin' then
    raise exception 'only admins can add properties';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'name required';
  end if;

  insert into hotels (name) values (trim(p_name)) returning id into v_new_hotel_id;

  insert into profile_hotels (profile_id, hotel_id, role)
  values (auth.uid(), v_new_hotel_id, 'admin');

  return v_new_hotel_id;
end;
$$;

grant execute on function create_property(text) to authenticated;

-- Switches the current profile's active property. Every table's RLS policy
-- reads auth_hotel_id()/auth_role(), which resolve from profiles, so this
-- single update is enough to change what the whole app shows.
create or replace function switch_property(p_hotel_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from profile_hotels
    where profile_id = auth.uid() and hotel_id = p_hotel_id;

  if v_role is null then
    raise exception 'not a member of this property';
  end if;

  update profiles set hotel_id = p_hotel_id, role = v_role where id = auth.uid();
end;
$$;

grant execute on function switch_property(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Guest-initiated cancellation: the hotel sets a policy (free text +
-- a "free until N hours before check-in" window shown to the guest); the
-- guest can cancel their own not-yet-arrived booking straight from the
-- guest portal, no staff action required.
-- ---------------------------------------------------------------------------

alter table hotels add column if not exists cancellation_policy text;
alter table hotels add column if not exists free_cancellation_hours int not null default 48;

alter table bookings add column if not exists cancelled_at timestamptz;
alter table bookings add column if not exists cancelled_by_guest boolean not null default false;

drop function if exists get_booking_by_token(uuid);

create or replace function get_booking_by_token(p_token uuid)
returns table (
  guest_name text,
  checkin date,
  checkout date,
  room_number text,
  price numeric,
  amount_paid numeric,
  payment_status text,
  invoice_number int,
  hotel_name text,
  wifi_network text,
  wifi_password text,
  reception_phone text,
  parking_label text,
  cover_image_url text,
  status text,
  cancellation_policy text,
  free_cancellation_hours int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select b.guest_name, b.checkin, b.checkout, r.number, b.price, b.amount_paid,
           b.payment_status, b.invoice_number, h.name,
           h.wifi_network, h.wifi_password, h.reception_phone,
           (select p.label from parking_spots p
              where p.hotel_id = b.hotel_id and p.guest_name = b.guest_name
                and p.status = 'occupied'
              limit 1),
           h.cover_image_url,
           b.status,
           h.cancellation_policy,
           h.free_cancellation_hours
    from bookings b
    left join rooms r on r.id = b.room_id
    join hotels h on h.id = b.hotel_id
    where b.guest_access_token = p_token;
end;
$$;

grant execute on function get_booking_by_token(uuid) to anon, authenticated;

create or replace function cancel_booking_by_guest(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings%rowtype;
begin
  select * into v_booking from bookings where guest_access_token = p_token;

  if v_booking.id is null then
    raise exception 'invalid token';
  end if;

  if v_booking.status in ('cancelled', 'checked_in', 'checked_out') then
    raise exception 'booking cannot be cancelled online anymore';
  end if;

  if v_booking.checkin <= current_date then
    raise exception 'too close to check-in to cancel online';
  end if;

  update bookings
    set status = 'cancelled', cancelled_at = now(), cancelled_by_guest = true
    where id = v_booking.id;
end;
$$;

grant execute on function cancel_booking_by_guest(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Hotel cover photo upload: lets admin/manager upload an image file directly
-- (instead of only pasting a URL) for the dashboard hero and guest portal
-- background. Same public-bucket pattern as task-photos.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('hotel-covers', 'hotel-covers', true)
on conflict (id) do nothing;

drop policy if exists "hotel-covers: authenticated insert" on storage.objects;
create policy "hotel-covers: authenticated insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'hotel-covers');

drop policy if exists "hotel-covers: authenticated delete own" on storage.objects;
create policy "hotel-covers: authenticated delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'hotel-covers');

drop policy if exists "hotel-covers: public read" on storage.objects;
create policy "hotel-covers: public read" on storage.objects
  for select using (bucket_id = 'hotel-covers');
