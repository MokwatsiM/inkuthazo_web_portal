-- Insert sample data
INSERT INTO members (id, full_name, email, phone, join_date, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'John Doe', 'john.doe@example.com', '+27123456789', '2023-01-15T08:00:00Z', 'active'),
('550e8400-e29b-41d4-a716-446655440001', 'Jane Smith', 'jane.smith@example.com', '+27123456790', '2023-02-20T09:30:00Z', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'Peter Jones', 'peter.jones@example.com', '+27123456791', '2023-03-10T10:15:00Z', 'active');

INSERT INTO contributions (member_id, amount, date, type) VALUES
('550e8400-e29b-41d4-a716-446655440000', 500.00, '2024-01-15T08:00:00Z', 'monthly'),
('550e8400-e29b-41d4-a716-446655440001', 1000.00, '2024-01-20T09:30:00Z', 'registration'),
('550e8400-e29b-41d4-a716-446655440002', 500.00, '2024-02-10T10:15:00Z', 'monthly');

INSERT INTO payouts (member_id, amount, date, reason, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 5000.00, '2024-02-15T08:00:00Z', 'Family member funeral assistance', 'paid'),
('550e8400-e29b-41d4-a716-446655440001', 7500.00, '2024-02-20T09:30:00Z', 'Member funeral benefit', 'pending');