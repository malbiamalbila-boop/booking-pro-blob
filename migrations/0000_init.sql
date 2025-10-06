CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE reservation_status AS ENUM ('inquiry','confirmed','waitlist','no_show','cancelled','closed');
CREATE TYPE handover_type AS ENUM ('checkout','checkin');
CREATE TYPE telemetry_event_type AS ENUM ('ignition_on','ignition_off','speeding','geofence_entry','geofence_exit','battery_low','movement');
CREATE TYPE document_kind AS ENUM ('rental_summary','handover_report','damage_report','contract','other');

CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(12) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  address text,
  city varchar(64),
  country varchar(64) NOT NULL DEFAULT 'BA',
  phone varchar(32),
  email varchar(120),
  timezone varchar(64) DEFAULT 'Europe/Sarajevo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX branches_code_idx ON branches(code);

CREATE TABLE vehicle_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(16) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  seats integer,
  doors integer,
  transmission varchar(32),
  fuel_type varchar(32),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX vehicle_classes_code_idx ON vehicle_classes(code);

CREATE TABLE rate_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(24) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  currency varchar(3) NOT NULL DEFAULT 'BAM',
  channel varchar(32) DEFAULT 'direct',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX rate_plans_code_idx ON rate_plans(code);

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vin varchar(32) NOT NULL UNIQUE,
  plate varchar(16) NOT NULL UNIQUE,
  display_name varchar(120) NOT NULL,
  branch_id uuid REFERENCES branches(id),
  vehicle_class_id uuid NOT NULL REFERENCES vehicle_classes(id),
  year integer,
  color varchar(32),
  mileage integer DEFAULT 0,
  status varchar(24) DEFAULT 'available',
  telematics_unit_id varchar(64),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX vehicles_branch_idx ON vehicles(branch_id);
CREATE INDEX vehicles_class_idx ON vehicles(vehicle_class_id);

CREATE TABLE availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason varchar(120),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX availability_vehicle_idx ON availability_blocks(vehicle_id, starts_at);

CREATE TABLE prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_plan_id uuid NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  vehicle_class_id uuid NOT NULL REFERENCES vehicle_classes(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  los_min integer DEFAULT 1,
  los_max integer,
  weekday_mask integer DEFAULT 127,
  base_amount numeric(10,2) NOT NULL,
  weekend_multiplier numeric(6,3) DEFAULT 1,
  currency varchar(3) DEFAULT 'BAM',
  event_name varchar(120),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX prices_rate_class_idx ON prices(rate_plan_id, vehicle_class_id);

CREATE TABLE extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(24) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  description text,
  daily_price numeric(10,2),
  flat_price numeric(10,2),
  currency varchar(3) DEFAULT 'BAM',
  requires_international boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE extras_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extra_id uuid NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX extras_inventory_unique ON extras_inventory(extra_id, branch_id);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(160) NOT NULL,
  email varchar(160),
  phone varchar(32),
  address text,
  city varchar(64),
  country varchar(64),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  vat_number varchar(64),
  billing_address text,
  contact_email varchar(160),
  contact_phone varchar(32),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  license_number varchar(64),
  license_country varchar(64),
  birth_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(24) NOT NULL UNIQUE,
  description text,
  discount_type varchar(24) DEFAULT 'percent',
  discount_value numeric(6,2) DEFAULT 0,
  valid_from timestamptz,
  valid_to timestamptz,
  usage_limit integer,
  created_at timestamptz DEFAULT now(),
  notes text
);

CREATE TABLE corp_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code varchar(24) NOT NULL,
  name varchar(160) NOT NULL,
  description text,
  rate_plan_id uuid REFERENCES rate_plans(id),
  notes text,
  valid_from timestamptz,
  valid_to timestamptz
);

CREATE INDEX corp_contracts_unique ON corp_contracts(company_id, code);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(160) NOT NULL UNIQUE,
  name varchar(160),
  branch_id uuid REFERENCES branches(id),
  phone varchar(32),
  locale varchar(8) DEFAULT 'bs',
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  password_hash text,
  last_login_at timestamptz
);

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL UNIQUE,
  description text
);

CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(24) NOT NULL UNIQUE,
  status reservation_status NOT NULL DEFAULT 'inquiry',
  pickup_branch_id uuid NOT NULL REFERENCES branches(id),
  dropoff_branch_id uuid NOT NULL REFERENCES branches(id),
  pickup_at timestamptz NOT NULL,
  dropoff_at timestamptz NOT NULL,
  customer_id uuid REFERENCES customers(id),
  company_id uuid REFERENCES companies(id),
  rate_plan_id uuid REFERENCES rate_plans(id),
  corp_contract_id uuid REFERENCES corp_contracts(id),
  coupon_id uuid REFERENCES coupons(id),
  channel varchar(32) DEFAULT 'ops',
  currency varchar(3) NOT NULL DEFAULT 'BAM',
  quote_expires_at timestamptz,
  total_amount numeric(10,2) DEFAULT 0,
  internal_notes text,
  customer_notes text,
  audit_trail jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX reservations_status_idx ON reservations(status);
CREATE INDEX reservations_period_idx ON reservations(pickup_at, dropoff_at);

CREATE TABLE reservation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id),
  vehicle_class_id uuid NOT NULL REFERENCES vehicle_classes(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  currency varchar(3) DEFAULT 'BAM',
  base_amount numeric(10,2) DEFAULT 0,
  taxes_amount numeric(10,2) DEFAULT 0,
  fees_amount numeric(10,2) DEFAULT 0,
  extras_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  price_snapshot jsonb DEFAULT '{}'::jsonb,
  notes text
);

CREATE INDEX reservation_items_reservation_idx ON reservation_items(reservation_id);

CREATE TABLE handover_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  type handover_type NOT NULL,
  performed_by uuid REFERENCES users(id),
  odometer integer,
  fuel_level integer,
  cleanliness varchar(32),
  photos jsonb DEFAULT '[]'::jsonb,
  damages jsonb DEFAULT '[]'::jsonb,
  signature_blob varchar(256),
  internal_charges_note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE damages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id),
  vehicle_id uuid REFERENCES vehicles(id),
  reported_at timestamptz DEFAULT now(),
  severity varchar(32),
  description text,
  photo_keys jsonb DEFAULT '[]'::jsonb,
  estimate_amount numeric(10,2),
  currency varchar(3) DEFAULT 'BAM',
  status varchar(32) DEFAULT 'open'
);

CREATE TABLE claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id),
  filed_at timestamptz DEFAULT now(),
  claim_type varchar(32),
  status varchar(32) DEFAULT 'open',
  amount numeric(10,2),
  currency varchar(3) DEFAULT 'BAM',
  notes text
);

CREATE TABLE fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id),
  issued_at timestamptz DEFAULT now(),
  authority varchar(120),
  reference varchar(120),
  amount numeric(10,2),
  currency varchar(3) DEFAULT 'BAM',
  status varchar(32) DEFAULT 'open',
  notes text
);

CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id),
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  type varchar(32) DEFAULT 'delivery',
  address text,
  contact_name varchar(120),
  contact_phone varchar(32),
  notes text
);

CREATE TABLE telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  type telemetry_event_type NOT NULL,
  source varchar(64) DEFAULT 'traccar',
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX telemetry_vehicle_idx ON telemetry_events(vehicle_id, recorded_at);

CREATE TABLE settings (
  key varchar(80) PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  url text NOT NULL,
  secret varchar(120) NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_triggered_at timestamptz
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action varchar(120) NOT NULL,
  entity varchar(120) NOT NULL,
  entity_id varchar(120) NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX audit_logs_entity_idx ON audit_logs(entity, entity_id);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  type document_kind NOT NULL DEFAULT 'other',
  title varchar(160),
  blob_key varchar(256) NOT NULL,
  mime_type varchar(128) DEFAULT 'application/pdf',
  size_bytes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

CREATE INDEX documents_reservation_idx ON documents(reservation_id);

CREATE TABLE document_translations (
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  locale varchar(8) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (document_id, locale)
);

CREATE TABLE notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id),
  channel varchar(24) DEFAULT 'email',
  payload jsonb DEFAULT '{}'::jsonb,
  scheduled_at timestamptz DEFAULT now(),
  attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  status varchar(24) DEFAULT 'pending'
);
