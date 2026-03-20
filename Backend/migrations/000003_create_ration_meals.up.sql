CREATE TABLE ration_meals (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ration_id  UUID NOT NULL REFERENCES daily_rations(id) ON DELETE CASCADE,
    meal_type  VARCHAR(20) NOT NULL,
    name       VARCHAR(255) NOT NULL,
    kcal       INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_ration_meals_ration ON ration_meals (ration_id);
