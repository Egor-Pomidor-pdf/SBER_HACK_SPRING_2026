ALTER TABLE ration_meals
    DROP COLUMN IF EXISTS protein_g,
    DROP COLUMN IF EXISTS fat_g,
    DROP COLUMN IF EXISTS carbs_g;
