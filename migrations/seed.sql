-- Seed test user profiles for demo
INSERT INTO user_profiles (id, user_id, remaining_kcal, remaining_protein_g, remaining_fat_g, remaining_carbs_g, daily_kcal, goal, dietary_restrictions, lat, lng)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 1500, 90, 50, 180, 2000, 'lose', '', 55.7512, 37.6184),
    ('a0000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440001', 2200, 130, 80, 260, 2500, 'maintain', 'без глютена', 55.7558, 37.6173),
    ('a0000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440002', 2800, 160, 100, 320, 3000, 'gain', 'аллергия на орехи', 55.7522, 37.6156)
ON CONFLICT (user_id) DO NOTHING;
