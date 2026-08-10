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
