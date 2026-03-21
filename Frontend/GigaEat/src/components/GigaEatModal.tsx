import React, { useState } from "react";
import type { StoreResult, Restaurant } from "../contracts.ts";
import SwipeCardDeck from "./SwipeCardDeck";

type Tab = "order" | "snack";

interface Props {
  stores: StoreResult[];
  restaurants: Restaurant[];
  onClose: () => void;
}

function kbjuLine(p: number, f: number, c: number, kcal: number) {
  return `${kcal} кк · Б${p}·Ж${f}·У${c}`;
}

function distanceLabel(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${m} м`;
}

export default function GigaEatModal({ stores, restaurants, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("order");
  const [showDeck, setShowDeck] = useState(false);

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.sheet}>
        
        <div style={styles.header}>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div style={styles.toggle}>
            <button
              style={{
                ...styles.toggleBtn,
                ...(tab === "order" ? styles.toggleActive : {}),
              }}
              onClick={() => setTab("order")}
            >
              Заказать
            </button>
            <button
              style={{
                ...styles.toggleBtn,
                ...(tab === "snack" ? styles.toggleActive : {}),
              }}
              onClick={() => setTab("snack")}
            >
              Перекусить
            </button>
          </div>

          <button
            style={styles.deckBtn}
            onClick={() => setShowDeck(true)}
            aria-label="Выбрать как в Tinder"
          >
            <CardStackIcon />
          </button>
        </div>

        
        <div style={styles.scroll}>
          {tab === "order" ? (
            <OrderList stores={stores} />
          ) : (
            <SnackList restaurants={restaurants} />
          )}
        </div>
      </div>

      
      {showDeck && (
        <SwipeCardDeck
          tab={tab}
          items={tab === "order" ? stores : restaurants}
          onClose={() => setShowDeck(false)}
        />
      )}
    </>
  );
}


function OrderList({ stores }: { stores: StoreResult[] }) {
  return (
    <div>
      {stores.map((store) => (
        <div key={store.store_id} style={styles.storeBlock}>
          <div style={styles.storeHeader}>
            <span style={styles.storeName}>{store.name}</span>
            <div style={styles.storeMeta}>
              <span style={styles.storeDistance}>
                {distanceLabel(store.distance_m)}
              </span>
              <span style={styles.dot}>·</span>
              <span style={styles.storeDelivery}>
                ~{store.delivery_min} мин
              </span>
              <span style={styles.storePrice}>
                {store.total_price.toLocaleString("ru-RU")} ₽
              </span>
            </div>
          </div>

          <div style={styles.productsGrid}>
            {store.available.map((p, i) => (
              <div key={i} style={styles.productCard}>
                <div style={styles.productEmoji}>🥩</div>
                <div style={styles.productName}>{p.name}</div>
                <div style={styles.productKbju}>
                  {kbjuLine(p.protein, p.fat, p.carbs, p.kcal)}
                </div>
                <div style={styles.productPrice}>{p.price_rub} ₽</div>
              </div>
            ))}
          </div>

          {store.missing.length > 0 && (
            <div style={styles.missingRow}>
              <span style={styles.missingLabel}>Нет в наличии: </span>
              <span style={styles.missingItems}>
                {store.missing.join(", ")}
              </span>
            </div>
          )}

          <button style={styles.orderBtn}>Выбрать магазин</button>
        </div>
      ))}
    </div>
  );
}


const DISH_EMOJIS = ["🍜", "🥗", "🍱", "🥘", "🫕"];

function SnackList({ restaurants }: { restaurants: Restaurant[] }) {
  return (
    <div>
      {restaurants.map((rest, ri) => (
        <div key={rest.id} style={styles.storeBlock}>
          <div style={styles.storeHeader}>
            <span style={styles.storeName}>{rest.name}</span>
            <div style={styles.storeMeta}>
              <span style={styles.storeDistance}>
                {distanceLabel(rest.distance_m)}
              </span>
              <span style={styles.dot}>·</span>
              <span style={styles.walkKcal}>
                🔥 {rest.walk_kcal} ккал пешком
              </span>
            </div>
          </div>

          <div style={styles.productsGrid}>
            {rest.dishes.map((d, i) => (
              <div key={i} style={styles.productCard}>
                <div style={styles.productEmoji}>
                  {DISH_EMOJIS[(ri + i) % DISH_EMOJIS.length]}
                </div>
                <div style={styles.productName}>{d.name}</div>
                <div style={styles.productKbju}>
                  {kbjuLine(d.protein, d.fat, d.carbs, d.kcal)}
                </div>
                <div style={styles.productPrice}>{d.price_rub} ₽</div>
              </div>
            ))}
          </div>

          <button style={styles.orderBtn}>Маршрут</button>
        </div>
      ))}
    </div>
  );
}


function CardStackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect
        x="3"
        y="7"
        width="16"
        height="12"
        rx="3"
        fill="var(--green)"
        opacity="0.2"
      />
      <rect
        x="1"
        y="4"
        width="16"
        height="12"
        rx="3"
        fill="var(--green)"
        opacity="0.4"
      />
      <rect
        x="5"
        y="6"
        width="16"
        height="12"
        rx="3"
        stroke="var(--green)"
        strokeWidth="1.5"
        fill="white"
      />
      <path
        d="M9 12h6M9 15h4"
        stroke="var(--green)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 100,
  },
  sheet: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    height: "90dvh",
    background: "var(--surface)",
    borderRadius: "24px 24px 0 0",
    zIndex: 101,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px 12px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "var(--bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toggle: {
    display: "flex",
    background: "var(--bg)",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    padding: "7px 18px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-secondary)",
    background: "transparent",
    transition: "all 0.18s ease",
    letterSpacing: "-0.01em",
  },
  toggleActive: {
    background: "var(--surface)",
    color: "var(--green)",
    boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
  },
  deckBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "var(--green-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scroll: {
    overflowY: "auto",
    flex: 1,
    padding: "12px 16px 32px",
  },
  storeBlock: {
    marginBottom: 20,
    background: "var(--bg)",
    borderRadius: "var(--radius)",
    padding: 14,
  },
  storeHeader: {
    marginBottom: 12,
  },
  storeName: {
    fontSize: 15,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
    display: "block",
    marginBottom: 4,
  },
  storeMeta: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  storeDistance: {
    fontSize: 12,
    color: "var(--green)",
    fontWeight: 600,
  },
  dot: {
    color: "var(--text-muted)",
    fontSize: 12,
  },
  storeDelivery: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  storePrice: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  walkKcal: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  productsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginBottom: 10,
  },
  productCard: {
    background: "var(--surface)",
    borderRadius: 10,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  productEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  productName: {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--text-primary)",
    lineHeight: 1.3,
    minHeight: 26,
  },
  productKbju: {
    fontSize: 9,
    color: "var(--text-secondary)",
    lineHeight: 1.3,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--green)",
    marginTop: 2,
  },
  missingRow: {
    marginBottom: 10,
    fontSize: 11,
    lineHeight: 1.4,
  },
  missingLabel: {
    color: "var(--text-secondary)",
  },
  missingItems: {
    color: "#E05A2B",
    fontWeight: 600,
  },
  orderBtn: {
    width: "100%",
    padding: "11px",
    background: "var(--green)",
    color: "#fff",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    transition: "opacity 0.15s",
  },
};
