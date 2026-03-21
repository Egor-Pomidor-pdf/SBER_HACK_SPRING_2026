-- Add weight_kg to user_profiles
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS weight_kg FLOAT DEFAULT 70.0;

-- Add address and delivery_time_mins to kuper_stores
ALTER TABLE kuper_stores
    ADD COLUMN IF NOT EXISTS store_address TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS delivery_time_mins INTEGER DEFAULT 30;

-- Index is already created in 000005, but ensure it exists
CREATE INDEX IF NOT EXISTS idx_kuper_stores_ration_id ON kuper_stores(ration_id);
