CREATE TABLE daily_rations (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL,
    ration_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    total_kcal   INT NOT NULL DEFAULT 0,
    status       VARCHAR(20) NOT NULL DEFAULT 'generated',
    gigachat_raw JSONB,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_rations_user_date ON daily_rations (user_id, ration_date DESC);
