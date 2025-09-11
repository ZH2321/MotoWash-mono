/*
  # SQL Functions for Motorcycle Wash Booking System

  1. Service Area Validation
    - `fn_validate_point_in_service_area` - Check if coordinates are within service area

  2. Capacity Management
    - `fn_reserve_slot` - Atomically reserve a slot
    - `fn_release_slot` - Release a reserved slot
    - `fn_confirm_slot` - Confirm a reserved slot

  3. Utility Functions
    - `update_updated_at_column` - Trigger function for updated_at timestamps
*/

-- Function to validate if a point is within service area
CREATE OR REPLACE FUNCTION fn_validate_point_in_service_area(
  lat double precision,
  lng double precision
) RETURNS boolean AS $$
DECLARE
  service_config record;
BEGIN
  -- Get service area configuration
  SELECT center, radius_m INTO service_config
  FROM service_area
  LIMIT 1;
  
  -- If no service area configured, allow all points
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- Check if point is within service area using PostGIS
  RETURN ST_DWithin(
    service_config.center,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    service_config.radius_m
  );
END;
$$ LANGUAGE plpgsql;

-- Function to atomically reserve a slot
CREATE OR REPLACE FUNCTION fn_reserve_slot(
  p_slot_start timestamptz
) RETURNS boolean AS $$
DECLARE
  slot_date date;
  rows_updated integer;
BEGIN
  slot_date := p_slot_start::date;
  
  -- Try to increment reserved_count atomically
  UPDATE capacity_counters 
  SET reserved_count = reserved_count + 1,
      updated_at = now()
  WHERE slot_start = p_slot_start 
    AND reserved_count < quota;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  -- If no rows updated, slot is full or doesn't exist
  IF rows_updated = 0 THEN
    -- Try to create the slot if it doesn't exist
    INSERT INTO capacity_counters (date, slot_start, quota, reserved_count, confirmed_count)
    SELECT 
      slot_date,
      p_slot_start,
      COALESCE(bh.default_quota, 5),
      1,
      0
    FROM business_hours bh
    WHERE bh.weekday = EXTRACT(DOW FROM p_slot_start)
      AND bh.is_active = true
    ON CONFLICT (date, slot_start) DO NOTHING;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated > 0;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to release a reserved slot
CREATE OR REPLACE FUNCTION fn_release_slot(
  p_slot_start timestamptz
) RETURNS void AS $$
BEGIN
  UPDATE capacity_counters 
  SET reserved_count = GREATEST(reserved_count - 1, 0),
      updated_at = now()
  WHERE slot_start = p_slot_start;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm a reserved slot
CREATE OR REPLACE FUNCTION fn_confirm_slot(
  p_slot_start timestamptz
) RETURNS void AS $$
BEGIN
  UPDATE capacity_counters 
  SET confirmed_count = confirmed_count + 1,
      updated_at = now()
  WHERE slot_start = p_slot_start;
END;
$$ LANGUAGE plpgsql;

-- Function to update service area
CREATE OR REPLACE FUNCTION update_service_area(
  lat double precision,
  lng double precision,
  radius integer
) RETURNS void AS $$
BEGIN
  INSERT INTO service_area (center, radius_m)
  VALUES (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius)
  ON CONFLICT (id) DO UPDATE SET
    center = EXCLUDED.center,
    radius_m = EXCLUDED.radius_m,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_area_updated_at
  BEFORE UPDATE ON service_area
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON business_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacity_counters_updated_at
  BEFORE UPDATE ON capacity_counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_channels_updated_at
  BEFORE UPDATE ON payment_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();