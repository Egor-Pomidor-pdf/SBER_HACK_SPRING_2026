CREATE TABLE kuper_stores (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ration_id   UUID NOT NULL REFERENCES daily_rations(id) ON DELETE CASCADE,
    store_id    VARCHAR(100) NOT NULL,
    store_name  VARCHAR(255) NOT NULL,
    distance_m  INT NOT NULL DEFAULT 0,
    is_selected BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kuper_stores_ration_id ON kuper_stores (ration_id);
