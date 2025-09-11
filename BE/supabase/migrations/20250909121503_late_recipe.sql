-- Insert default service area (Khon Kaen University area)
INSERT INTO service_area (center, radius_m) 
VALUES (ST_SetSRID(ST_MakePoint(102.821, 16.474), 4326)::geography, 1500)
ON CONFLICT DO NOTHING;

-- Insert business hours (Monday to Friday, 9 AM to 6 PM)
INSERT INTO business_hours (weekday, open_time, close_time, slot_minutes, default_quota) VALUES
(1, '09:00:00', '18:00:00', 60, 5), -- Monday
(2, '09:00:00', '18:00:00', 60, 5), -- Tuesday
(3, '09:00:00', '18:00:00', 60, 5), -- Wednesday
(4, '09:00:00', '18:00:00', 60, 5), -- Thursday
(5, '09:00:00', '18:00:00', 60, 5)  -- Friday
ON CONFLICT (weekday) DO NOTHING;

-- Insert weekend hours (Saturday only, shorter hours)
INSERT INTO business_hours (weekday, open_time, close_time, slot_minutes, default_quota) VALUES
(6, '10:00:00', '16:00:00', 60, 3)  -- Saturday
ON CONFLICT (weekday) DO NOTHING;

-- Insert default payment channels
INSERT INTO payment_channels (type, name, value, display_order) VALUES
('promptpay', 'พร้อมเพย์', '0812345678', 1),
('bank_account', 'กสิกรไทย', '123-4-56789-0', 2),
('qr_code', 'QR Code', 'qr_payment.png', 3)
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123 - change in production!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (email, password_hash, name, role) VALUES
('admin@example.com', '$2b$10$rBp4nL8w8DnGKBvo8.9EJ.0KmOGqT4vGjyJ9DgY8cR0xF2zP9W8nG', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample test user (for development)
INSERT INTO users (line_user_id, display_name, phone) VALUES
('test_user_001', 'ทดสอบ ระบบ', '0812345678')
ON CONFLICT (line_user_id) DO NOTHING;

-- Log successful seeding
SELECT 
  'Seed data inserted successfully:' as message,
  (SELECT COUNT(*) FROM service_area) as service_areas,
  (SELECT COUNT(*) FROM business_hours) as business_hours,
  (SELECT COUNT(*) FROM payment_channels) as payment_channels,
  (SELECT COUNT(*) FROM admin_users) as admin_users,
  (SELECT COUNT(*) FROM users) as test_users;