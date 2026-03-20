CREATE TABLE kuper_cart_items (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id            UUID NOT NULL REFERENCES kuper_carts(id) ON DELETE CASCADE,
    ingredient_id      UUID NOT NULL REFERENCES ration_ingredients(id) ON DELETE CASCADE,
    kuper_product_id   VARCHAR(100),
    kuper_product_name VARCHAR(255),
    price_rub          INT NOT NULL DEFAULT 0,
    found              BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_kuper_cart_items_cart_id ON kuper_cart_items (cart_id);
