-- seed_data.sql
-- QueueM Demo Data

-- 3 Demo Hospitals
INSERT INTO hospitals (id, name, address, city, api_endpoint) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'City General Hospital', '123 Main Street', 'New Delhi', 'https://api.citygen.demo/queue'),
  ('bbbb2222-2222-2222-2222-222222222222', 'Metro Heart Institute', '456 Health Avenue', 'Mumbai', 'https://api.metroheart.demo/queue'),
  ('cccc3333-3333-3333-3333-333333333333', 'Apollo Medical Center', '789 Care Boulevard', 'Bangalore', 'https://api.apollomed.demo/queue')
ON CONFLICT DO NOTHING;

-- Locations linked to hospitals
INSERT INTO locations (id, hospital_id, name, address, type) VALUES
  ('1111aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-1111-1111-1111-111111111111', 'City General - Main Wing', '123 Main Street, New Delhi', 'hospital'),
  ('2222bbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb2222-2222-2222-2222-222222222222', 'Metro Heart - Cardiology Block', '456 Health Avenue, Mumbai', 'hospital'),
  ('3333cccc-cccc-cccc-cccc-cccccccccccc', 'cccc3333-3333-3333-3333-333333333333', 'Apollo - Emergency Wing', '789 Care Boulevard, Bangalore', 'hospital')
ON CONFLICT DO NOTHING;

-- Services at each location
INSERT INTO services (id, location_id, name, avg_service_time_seconds, active) VALUES
  ('s111aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1111aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'General Consultation', 600, true),
  ('s222bbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2222bbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cardiology Checkup', 900, true),
  ('s333cccc-cccc-cccc-cccc-cccccccccccc', '3333cccc-cccc-cccc-cccc-cccccccccccc', 'Emergency Triage', 300, true)
ON CONFLICT DO NOTHING;

-- 2 Counters per location
INSERT INTO counters (id, location_id, counter_number, status) VALUES
  ('c1-111111-1111-1111-1111-111111111111', '1111aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'open'),
  ('c2-111111-1111-1111-1111-111111111112', '1111aaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'open'),
  ('c3-222222-2222-2222-2222-222222222221', '2222bbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'open'),
  ('c4-222222-2222-2222-2222-222222222222', '2222bbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'open'),
  ('c5-333333-3333-3333-3333-333333333331', '3333cccc-cccc-cccc-cccc-cccccccccccc', 1, 'open'),
  ('c6-333333-3333-3333-3333-333333333332', '3333cccc-cccc-cccc-cccc-cccccccccccc', 2, 'open')
ON CONFLICT DO NOTHING;
