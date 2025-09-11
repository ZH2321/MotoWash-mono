-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create ENUMs
CREATE TYPE booking_status AS ENUM (
  'HOLD_PENDING_PAYMENT',
  'AWAIT_SHOP_CONFIRM',
  'CONFIRMED',
  'PICKUP_ASSIGNED',
  'PICKED_UP',
  'IN_WASH',
  'READY_FOR_RETURN',
  'ON_THE_WAY_RETURN',
  'COMPLETED',
  'REVIEWED',
  'REJECTED',
  'HOLD_EXPIRED',
  'CANCELLED',
  'NO_SHOW'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'FAILED',
  'REFUNDED'
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id text UNIQUE NOT NULL,
  display_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service area configuration
CREATE TABLE IF NOT EXISTS service_area (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center geography(Point, 4326) NOT NULL,
  radius_m int NOT NULL DEFAULT 1000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Business hours configuration
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday int NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  open_time time NOT NULL,
  close_time time NOT NULL,
  slot_minutes int NOT NULL DEFAULT 60,
  default_quota int NOT NULL DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(weekday)
);

-- Slot overrides for specific dates
CREATE TABLE IF NOT EXISTS slot_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  slot_start timestamptz NOT NULL,
  quota int,
  closed boolean DEFAULT false,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, slot_start)
);

-- Capacity counters for atomic reservations
CREATE TABLE IF NOT EXISTS capacity_counters (
  slot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  slot_start timestamptz NOT NULL,
  quota int NOT NULL DEFAULT 5,
  reserved_count int NOT NULL DEFAULT 0,
  confirmed_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date, slot_start),
  CHECK (reserved_count >= 0),
  CHECK (confirmed_count >= 0),
  CHECK (reserved_count <= quota)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  vehicle_id uuid, -- Future: vehicle information
  services jsonb NOT NULL DEFAULT '[]',
  pickup_point geography(Point, 4326),
  dropoff_point geography(Point, 4326),
  same_point boolean DEFAULT true,
  slot_start timestamptz NOT NULL,
  slot_end timestamptz,
  status booking_status NOT NULL DEFAULT 'HOLD_PENDING_PAYMENT',
  price_estimate int NOT NULL DEFAULT 0,
  deposit_minor int NOT NULL DEFAULT 2000, -- 20 THB in minor units
  notes text,
  hold_expires_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  method text DEFAULT 'bank_transfer',
  amount_minor int NOT NULL,
  status payment_status NOT NULL DEFAULT 'PENDING',
  paid_at timestamptz,
  slip_url text,
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job assignments and tracking
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  assignee text,
  phase text, -- 'pickup', 'wash', 'return'
  photos jsonb DEFAULT '[]',
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id)
);

-- Payment channels configuration
CREATE TABLE IF NOT EXISTS payment_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'promptpay', 'bank_account', 'qr_code'
  name text NOT NULL,
  value text NOT NULL, -- phone number, account number, or file path
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_slot_start ON bookings(slot_start);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_hold_expires ON bookings(hold_expires_at) 
  WHERE status = 'HOLD_PENDING_PAYMENT';

CREATE INDEX IF NOT EXISTS idx_capacity_counters_slot_start ON capacity_counters(slot_start);
CREATE INDEX IF NOT EXISTS idx_capacity_counters_date ON capacity_counters(date);

CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_jobs_booking_id ON jobs(booking_id);

-- Spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_point ON bookings USING GIST(pickup_point);
CREATE INDEX IF NOT EXISTS idx_bookings_dropoff_point ON bookings USING GIST(dropoff_point);
CREATE INDEX IF NOT EXISTS idx_service_area_center ON service_area USING GIST(center);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_area_updated_at BEFORE UPDATE ON service_area
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacity_counters_updated_at BEFORE UPDATE ON capacity_counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_channels_updated_at BEFORE UPDATE ON payment_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();