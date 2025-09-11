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
ALTER TABLE payment_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API operations)
CREATE POLICY "Service role can do everything" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON service_area
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON business_hours
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON slot_overrides
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON capacity_counters
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON payments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON jobs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON reviews
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON payment_channels
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read their own data
-- Note: In production, you might want to implement more specific policies
-- based on JWT claims for line_user_id matching

CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Public read access to configuration" ON service_area
  FOR SELECT USING (true);

CREATE POLICY "Public read access to business hours" ON business_hours
  FOR SELECT USING (true);

CREATE POLICY "Public read access to capacity counters" ON capacity_counters
  FOR SELECT USING (true);

CREATE POLICY "Public read access to payment channels" ON payment_channels
  FOR SELECT USING (is_active = true);

-- More restrictive policies for production:
-- Users should only see their own bookings based on JWT claims
-- For now, we'll rely on application-level filtering via service role

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;