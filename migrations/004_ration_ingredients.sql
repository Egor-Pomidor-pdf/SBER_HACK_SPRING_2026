CREATE TABLE ration_ingredients (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ration_id  UUID NOT NULL REFERENCES daily_rations(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    quantity   VARCHAR(50) NOT NULL,
    unit       VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_ration_ingredients_ration_id ON ration_ingredients (ration_id);
