CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE user_profiles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL UNIQUE,
    remaining_kcal      INT NOT NULL DEFAULT 0,
    remaining_protein_g INT NOT NULL DEFAULT 0,
    remaining_fat_g     INT NOT NULL DEFAULT 0,
    remaining_carbs_g   INT NOT NULL DEFAULT 0,
    daily_kcal          INT NOT NULL DEFAULT 2000,
    goal                VARCHAR(20) NOT NULL DEFAULT 'maintain',
    dietary_restrictions TEXT NOT NULL DEFAULT '',
    lat                 DOUBLE PRECISION NOT NULL DEFAULT 0,
    lng                 DOUBLE PRECISION NOT NULL DEFAULT 0,
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles (user_id);
