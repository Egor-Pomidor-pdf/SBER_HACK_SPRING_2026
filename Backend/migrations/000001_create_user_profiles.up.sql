CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL,
    remaining_kcal      INT NOT NULL DEFAULT 0,
    remaining_protein_g INT NOT NULL DEFAULT 0,
    remaining_fat_g     INT NOT NULL DEFAULT 0,
    remaining_carbs_g   INT NOT NULL DEFAULT 0,
    daily_kcal      INT NOT NULL DEFAULT 2000,
    goal            VARCHAR(20) NOT NULL DEFAULT 'maintain',
    dietary_restrictions TEXT NOT NULL DEFAULT '',
    lat             DOUBLE PRECISION NOT NULL DEFAULT 0,
    lng             DOUBLE PRECISION NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- seed test users
INSERT INTO user_profiles (id, user_id, remaining_kcal, remaining_protein_g, remaining_fat_g, remaining_carbs_g, daily_kcal, goal, dietary_restrictions, lat, lng)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '550e8400-e29b-41d4-a716-446655440000', 1200, 80, 45, 150, 2000, 'lose', '', 55.7512, 37.6184),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '550e8400-e29b-41d4-a716-446655440001', 2500, 150, 90, 300, 3000, 'gain', 'без глютена', 55.7522, 37.6200),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '550e8400-e29b-41d4-a716-446655440002', 1800, 100, 60, 200, 1800, 'maintain', 'аллергия на орехи', 55.7530, 37.6150);
