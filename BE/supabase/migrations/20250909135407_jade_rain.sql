/*
  # Row Level Security Policies

  1. Users Table
    - Users can read their own data
    - Service role can do everything

  2. Service Area
    - Public read access for configuration
    - Admin-only write access

  3. Business Hours
    - Public read access
    - Admin-only write access

  4. Capacity Counters
    - Public read access for availability checking
    - Service role manages capacity

  5. Bookings
    - Service role manages all operations (simplified for MVP)

  6. Other Tables
    - Service role access for admin operations
*/

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_area ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_channels ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role can do everything"
  ON users
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Service area policies
CREATE POLICY "Public read access to configuration"
  ON service_area
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can do everything"
  ON service_area
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Business hours policies
CREATE POLICY "Public read access to business hours"
  ON business_hours
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can do everything"
  ON business_hours
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Slot overrides policies
CREATE POLICY "Service role can do everything"
  ON slot_overrides
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Capacity counters policies
CREATE POLICY "Public read access to capacity counters"
  ON capacity_counters
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can do everything"
  ON capacity_counters
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Bookings policies (simplified for MVP)
CREATE POLICY "Service role can do everything"
  ON bookings
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Payments policies
CREATE POLICY "Service role can do everything"
  ON payments
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Jobs policies
CREATE POLICY "Service role can do everything"
  ON jobs
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Reviews policies
CREATE POLICY "Service role can do everything"
  ON reviews
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Admin users policies
CREATE POLICY "Service role can do everything"
  ON admin_users
  FOR ALL
  TO public
  USING (role() = 'service_role');

-- Payment channels policies
CREATE POLICY "Public read access to payment channels"
  ON payment_channels
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Service role can do everything"
  ON payment_channels
  FOR ALL
  TO public
  USING (role() = 'service_role');