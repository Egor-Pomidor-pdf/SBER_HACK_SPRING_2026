CREATE TABLE kuper_carts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ration_id       UUID NOT NULL REFERENCES daily_rations(id) ON DELETE CASCADE,
    store_id        UUID NOT NULL REFERENCES kuper_stores(id) ON DELETE CASCADE,
    total_price_rub INT NOT NULL DEFAULT 0,
    found_count     INT NOT NULL DEFAULT 0,
    total_count     INT NOT NULL DEFAULT 0,
    checkout_url    VARCHAR(500) NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kuper_carts_ration ON kuper_carts (ration_id);
