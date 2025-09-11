/*
  # Seed Data for Motorcycle Wash Booking System

  1. Business Hours
    - Monday to Friday: 09:00-18:00
    - 60-minute slots with quota of 5

  2. Service Area
    - Center: Khon Kaen University area (16.474, 102.821)
    - Radius: 1500 meters

  3. Payment Channels
    - PromptPay and bank transfer options

  4. Admin User
    - Default admin account for testing
*/

-- Insert business hours (Monday to Friday)
INSERT INTO business_hours (weekday, open_time, close_time, slot_minutes, default_quota, is_active)
VALUES 
  (1, '09:00:00', '18:00:00', 60, 5, true), -- Monday
  (2, '09:00:00', '18:00:00', 60, 5, true), -- Tuesday
  (3, '09:00:00', '18:00:00', 60, 5, true), -- Wednesday
  (4, '09:00:00', '18:00:00', 60, 5, true), -- Thursday
  (5, '09:00:00', '18:00:00', 60, 5, true)  -- Friday
ON CONFLICT (weekday) DO UPDATE SET
  open_time = EXCLUDED.open_time,
  close_time = EXCLUDED.close_time,
  slot_minutes = EXCLUDED.slot_minutes,
  default_quota = EXCLUDED.default_quota,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Insert service area (Khon Kaen University area)
INSERT INTO service_area (center, radius_m)
VALUES (ST_SetSRID(ST_MakePoint(102.821, 16.474), 4326)::geography, 1500)
ON CONFLICT (id) DO UPDATE SET
  center = EXCLUDED.center,
  radius_m = EXCLUDED.radius_m,
  updated_at = now();

-- Insert payment channels
INSERT INTO payment_channels (type, name, value, is_active, display_order)
VALUES 
  ('promptpay', 'PromptPay', '0123456789', true, 1),
  ('bank_account', 'ธนาคารกสิกรไทย', '123-4-56789-0 นายตัวอย่าง', true, 2),
  ('qr_code', 'QR Code', 'qr-codes/promptpay-qr.png', true, 3)
ON CONFLICT (type, name) DO UPDATE SET
  value = EXCLUDED.value,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- Insert default admin user (password: admin123)
-- Hash generated with: bcryptjs.hashSync('admin123', 10)
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES ('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();