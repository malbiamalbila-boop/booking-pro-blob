
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  plate text unique not null,
  color text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  customer_id uuid references customers(id) on delete set null,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  pickup_location text,
  return_location text,
  price_bam numeric(10,2),
  insurance text,
  notes text,
  status text not null default 'confirmed' check (status in ('pending','confirmed','cancelled','returned')),
  odometer_out integer,
  odometer_in integer,
  fuel_out text,
  fuel_in text,
  created_at timestamptz not null default now(),
  constraint chk_time check (starts_at < ends_at)
);

alter table bookings drop constraint if exists no_overlap_per_vehicle;
alter table bookings add constraint no_overlap_per_vehicle exclude using gist (
  vehicle_id with =,
  tstzrange(starts_at, ends_at, '[)') with &&
) where (status in ('pending','confirmed'));

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  booking_id  uuid references bookings(id) on delete cascade,
  kind        text not null check (kind in ('passport','id','driver_license','other')),
  file_key    text not null,
  mime_type   text not null,
  size_bytes  integer not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by text
);

create index if not exists idx_bookings_vehicle_time on bookings(vehicle_id, starts_at, ends_at, status);
create index if not exists idx_bookings_range on bookings using gist (tstzrange(starts_at, ends_at, '[)'));
create index if not exists idx_documents_customer on documents(customer_id);
create index if not exists idx_documents_booking on documents(booking_id);
