import React, { useState } from "react";
import type { StoreResult, Restaurant } from "../contracts.ts";

interface Props {
  tab: "order" | "snack";
  items: StoreResult[] | Restaurant[];
  onClose: () => void;
}

function distanceLabel(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${m} м`;
}

function isStore(item: StoreResult | Restaurant): item is StoreResult {
  return "store_id" in item;
}

export default function SwipeCardDeck({ tab, items, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);

  const current = items[idx] as StoreResult | Restaurant;
  const done = idx >= items.length;

  function swipe(dir: "left" | "right") {
    setSwipeDir(dir);
    setTimeout(() => {
      setSwipeDir(null);
      setIdx((i) => i + 1);
    }, 320);
  }

  const cardStyle: React.CSSProperties = {
    ...styles.card,
    transform:
      swipeDir === "left"
        ? "translateX(-120%) rotate(-18deg)"
        : swipeDir === "right"
          ? "translateX(120%) rotate(18deg)"
          : "none",
    opacity: swipeDir ? 0 : 1,
    transition: swipeDir ? "transform 0.3s ease, opacity 0.3s ease" : "none",
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.container}>
        <div style={styles.topRow}>
          <span style={styles.label}>
            {tab === "order" ? "🛒 Выбери магазин" : "🍽️ Выбери заведение"}
          </span>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.stage}>
          {done ? (
            <div style={styles.doneCard}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={styles.doneTitle}>Всё просмотрено!</div>
              <button style={styles.restartBtn} onClick={() => setIdx(0)}>
                Начать заново
              </button>
            </div>
          ) : (
            <>
              
              {idx + 1 < items.length && (
                <div style={{ ...styles.card, ...styles.shadowCard2 }} />
              )}
              {idx + 2 < items.length && (
                <div style={{ ...styles.card, ...styles.shadowCard1 }} />
              )}

              
              <div style={cardStyle}>
                <CardContent item={current} tab={tab} />
              </div>
            </>
          )}
        </div>

        {!done && (
          <div style={styles.actions}>
            <button
              style={{ ...styles.actionBtn, ...styles.skipBtn }}
              onClick={() => swipe("left")}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M8 8L20 20M20 8L8 20"
                  stroke="#E05A2B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div style={styles.counter}>
              {idx + 1} / {items.length}
            </div>
            <button
              style={{ ...styles.actionBtn, ...styles.likeBtn }}
              onClick={() => swipe("right")}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M5 14.5L11 20.5L23 8"
                  stroke="var(--green)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CardContent({
  item,
  tab,
}: {
  item: StoreResult | Restaurant;
  tab: "order" | "snack";
}) {
  if (tab === "order" && isStore(item)) {
    return (
      <div style={styles.cardInner}>
        <div style={styles.cardEmoji}>🏪</div>
        <div style={styles.cardName}>{item.name}</div>
        <div style={styles.cardDistance}>{distanceLabel(item.distance_m)}</div>
        <div style={styles.cardPrice}>
          {item.total_price.toLocaleString("ru-RU")} ₽
        </div>
        <div style={styles.cardDelivery}>~{item.delivery_min} мин доставка</div>
        <div style={styles.cardDivider} />
        <div style={styles.cardProductsLabel}>Топ товары:</div>
        {item.available.slice(0, 3).map((p, i) => (
          <div key={i} style={styles.cardProductRow}>
            <span style={styles.cardProductName}>{p.name}</span>
            <span style={styles.cardProductPrice}>{p.price_rub} ₽</span>
          </div>
        ))}
        {item.missing.length > 0 && (
          <div style={styles.cardMissing}>Нет: {item.missing.join(", ")}</div>
        )}
      </div>
    );
  }

  if (tab === "snack" && !isStore(item)) {
    return (
      <div style={styles.cardInner}>
        <div style={styles.cardEmoji}>🍜</div>
        <div style={styles.cardName}>{item.name}</div>
        <div style={styles.cardDistance}>{distanceLabel(item.distance_m)}</div>
        <div style={styles.cardWalkKcal}>🔥 {item.walk_kcal} ккал пешком</div>
        <div style={styles.cardDivider} />
        <div style={styles.cardProductsLabel}>Меню:</div>
        {item.dishes.map((d, i) => (
          <div key={i} style={styles.cardProductRow}>
            <div>
              <div style={styles.cardProductName}>{d.name}</div>
              <div style={styles.cardKbju}>{d.kcal} кк</div>
            </div>
            <span style={styles.cardProductPrice}>{d.price_rub} ₽</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 200,
  },
  container: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    height: "92dvh",
    zIndex: 201,
    display: "flex",
    flexDirection: "column",
    padding: "0 20px 32px",
    paddingTop: 16,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    color: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: 700,
  },
  closeBtn: {
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    width: 36,
    height: 36,
    borderRadius: "50%",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    position: "absolute",
    width: "100%",
    background: "var(--surface)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 48px rgba(0,0,0,0.24)",
  },
  shadowCard1: {
    transform: "translateY(12px) scale(0.94)",
    opacity: 0.5,
    zIndex: -1,
  },
  shadowCard2: {
    transform: "translateY(22px) scale(0.88)",
    opacity: 0.25,
    zIndex: -2,
  },
  cardInner: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  cardEmoji: { fontSize: 40, marginBottom: 4 },
  cardName: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em" },
  cardDistance: { fontSize: 14, color: "var(--green)", fontWeight: 600 },
  cardPrice: {
    fontSize: 26,
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.03em",
  },
  cardDelivery: { fontSize: 13, color: "var(--text-secondary)" },
  cardWalkKcal: { fontSize: 13, color: "var(--text-secondary)" },
  cardDivider: { height: 1, background: "var(--border)", margin: "10px 0" },
  cardProductsLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 4,
  },
  cardProductRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
  },
  cardProductName: { fontSize: 14, fontWeight: 500 },
  cardProductPrice: { fontSize: 14, fontWeight: 700, color: "var(--green)" },
  cardKbju: { fontSize: 11, color: "var(--text-secondary)" },
  cardMissing: {
    fontSize: 12,
    color: "#E05A2B",
    fontWeight: 500,
    marginTop: 4,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingTop: 20,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
  },
  skipBtn: { background: "#FFF1EE" },
  likeBtn: { background: "var(--green-light)" },
  counter: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 600 },
  doneCard: {
    background: "var(--surface)",
    borderRadius: 24,
    padding: 40,
    textAlign: "center",
    width: "100%",
  },
  doneTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  restartBtn: {
    background: "var(--green)",
    color: "#fff",
    padding: "12px 32px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
  },
};
