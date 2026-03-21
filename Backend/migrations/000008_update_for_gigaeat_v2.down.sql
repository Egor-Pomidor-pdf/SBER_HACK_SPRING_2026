-- Remove weight_kg from user_profiles
ALTER TABLE user_profiles
    DROP COLUMN IF EXISTS weight_kg;

-- Remove address and delivery_time_mins from kuper_stores
ALTER TABLE kuper_stores
    DROP COLUMN IF EXISTS store_address,
    DROP COLUMN IF EXISTS delivery_time_mins;
