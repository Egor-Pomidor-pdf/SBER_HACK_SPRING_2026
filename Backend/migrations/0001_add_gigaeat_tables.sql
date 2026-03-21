-- Migration: Add GigaEat tables
-- Date: 2026-03-21

-- Таблица истории потребления блюд
CREATE TABLE IF NOT EXISTS user_meal_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) NOT NULL,
    meal_name VARCHAR(255) NOT NULL,
    meal_kcal INTEGER NOT NULL,
    consumed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_meal_consumptions_user_id ON user_meal_consumptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meal_consumptions_consumed_at ON user_meal_consumptions(consumed_at);

-- Таблица готовых блюд
CREATE TABLE IF NOT EXISTS ready_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ration_id UUID NOT NULL REFERENCES daily_rations(id) ON DELETE CASCADE,
    meal_type VARCHAR(50) NOT NULL,
    giga_chat_name VARCHAR(255) NOT NULL,
    kcal INTEGER NOT NULL,
    total_price_rub INTEGER NOT NULL,
    store_id VARCHAR(100) NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    store_address TEXT,
    distance_m INTEGER NOT NULL,
    delivery_time_mins INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ready_meals_ration_id ON ready_meals(ration_id);

-- Таблица ингредиентов готовых блюд
CREATE TABLE IF NOT EXISTS ready_meal_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ready_meal_id UUID NOT NULL REFERENCES ready_meals(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    name TEXT NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    protein_g INTEGER NOT NULL DEFAULT 0,
    fat_g INTEGER NOT NULL DEFAULT 0,
    carbs_g INTEGER NOT NULL DEFAULT 0,
    kcal INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ready_meal_ingredients_ready_meal_id ON ready_meal_ingredients(ready_meal_id);

-- Обновление таблицы user_profiles (добавляем поля для аллергий и предпочтений)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferences TEXT[] DEFAULT '{}';

-- Примечание: если нужно добавить КБЖУ в продукты в Mock Kuper, это делается отдельно
