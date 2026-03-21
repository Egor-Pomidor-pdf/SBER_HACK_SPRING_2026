import { useState } from "react";
import type { StoreResult, Restaurant, CartData } from "../contracts";
import SwipeCardDeck from "./SwipeCardDeck";
import CartEditModal from "./CartEditModal";
import { MOCK_CART } from "../mocks";

type Tab = "order" | "snack";

interface Props {
  stores: StoreResult[];
  restaurants: Restaurant[];
  onClose: () => void;
}

// ─── Walk modal ───────────────────────────────────────────────────────────────

interface WalkModalProps {
  name: string;
  address: string;
  distance_m: number;
  onClose: () => void;
}

function WalkModal({ name, address, distance_m, onClose }: WalkModalProps) {
  const walkMin = Math.round(distance_m / 80);
  const walkKcal = Math.round(distance_m * 0.065);
  const [choice, setChoice] = useState<"walk" | "order" | null>(null);

  // Celebration screen
  if (choice === "walk") {
    return (
      <>
        <div style={s.walkOverlay} onClick={onClose} />
        <div style={s.walkSheet}>
          <div style={s.walkHandleWrap}>
            <div style={s.walkHandle} />
          </div>
          <div style={s.celebWrap}>
            <div style={s.celebEmoji}>🎉</div>
            <div style={s.celebTitle}>Вот это да!</div>
            <div style={s.celebText}>
              Ты сожжёшь <span style={s.celebAccent}>{walkKcal} ккал</span> пока
              дойдёшь до {name}.{"\n"}
              Это как {Math.round(walkKcal / 4)} мин лёгкой пробежки!
            </div>
            <div style={s.celebStatsRow}>
              <div style={s.celebStat}>
                <div style={s.celebStatNum}>{walkKcal}</div>
                <div style={s.celebStatLabel}>ккал сожжёшь</div>
              </div>
              <div style={s.celebStatDivider} />
              <div style={s.celebStat}>
                <div style={s.celebStatNum}>{walkMin}</div>
                <div style={s.celebStatLabel}>минут ходьбы</div>
              </div>
              <div style={s.celebStatDivider} />
              <div style={s.celebStat}>
                <div style={s.celebStatNum}>{distLabel(distance_m)}</div>
                <div style={s.celebStatLabel}>до магазина</div>
              </div>
            </div>
            <div style={s.celebTip}>
              Молодец! Активность — часть твоего пути к цели 💪
            </div>
            <button style={s.celebBtn} onClick={onClose}>
              Отлично, иду!
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        style={s.walkOverlay}
        onClick={choice === "order" ? onClose : onClose}
      />
      <div style={s.walkSheet}>
        <div style={s.walkHandleWrap}>
          <div style={s.walkHandle} />
        </div>

        <div style={s.walkHeader}>
          <div style={s.walkTitle}>{name}</div>
          <button style={s.walkCloseBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2L12 12M12 2L2 12"
                stroke="#7A8A85"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Info rows */}
        <div style={s.walkInfoBlock}>
          <div style={s.walkInfoRow}>
            <span style={s.walkInfoIcon}>📍</span>
            <div>
              <div style={s.walkInfoLabel}>Адрес</div>
              <div style={s.walkInfoVal}>{address}</div>
            </div>
          </div>
          <div style={s.walkDivider} />
          <div style={s.walkInfoRow}>
            <span style={s.walkInfoIcon}>🚶</span>
            <div>
              <div style={s.walkInfoLabel}>Пешком</div>
              <div style={s.walkInfoVal}>
                {distLabel(distance_m)} · ~{walkMin} мин
              </div>
            </div>
          </div>
          <div style={s.walkDivider} />
          <div style={s.walkInfoRow}>
            <span style={s.walkInfoIcon}>🔥</span>
            <div>
              <div style={s.walkInfoLabel}>Потратишь калорий</div>
              <div
                style={{
                  ...s.walkInfoVal,
                  color: "var(--green)",
                  fontWeight: 700,
                }}
              >
                {walkKcal} ккал
              </div>
            </div>
          </div>
        </div>

        {/* Drawn map */}
        <DrawnMap distance_m={distance_m} storeName={name} />

        {/* Choice buttons */}
        <div style={s.choiceRow}>
          <button style={s.walkBtn} onClick={() => setChoice("walk")}>
            🚶 Пойду пешком
          </button>
          <button style={s.orderBtn} onClick={onClose}>
            🚗 Закажу доставку
          </button>
        </div>
      </div>
    </>
  );
}

// ─── SVG drawn map ────────────────────────────────────────────────────────────

function DrawnMap({
  distance_m,
  storeName,
}: {
  distance_m: number;
  storeName: string;
}) {
  const w = 320,
    h = 170;
  const homeX = 44,
    homeY = 128;
  const storeX = Math.min(homeX + distance_m / 6, w - 44);
  const storeY = 56;
  const midX = (homeX + storeX) / 2;
  const midY = homeY - 40;

  return (
    <div style={s.mapWrap}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <rect width={w} height={h} fill="#F0F4F0" rx="12" />
        {[60, 110, 160, 210, 260].map((x) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2={h}
            stroke="#DDE8DD"
            strokeWidth="1"
          />
        ))}
        {[40, 80, 120, 160].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2={w}
            y2={y}
            stroke="#DDE8DD"
            strokeWidth="1"
          />
        ))}
        <path
          d={`M ${homeX} ${homeY} Q ${midX} ${midY} ${storeX} ${storeY}`}
          stroke="#21A038"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          fill="none"
          strokeLinecap="round"
        />
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#21A038"
        >
          {distLabel(distance_m)}
        </text>
        <circle
          cx={homeX}
          cy={homeY}
          r="14"
          fill="#fff"
          stroke="#21A038"
          strokeWidth="1.5"
        />
        <text x={homeX} y={homeY + 5} textAnchor="middle" fontSize="14">
          🏠
        </text>
        <circle cx={storeX} cy={storeY} r="14" fill="#21A038" />
        <text x={storeX} y={storeY + 5} textAnchor="middle" fontSize="14">
          🏪
        </text>
        <text
          x={storeX}
          y={storeY - 20}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#1a7a30"
        >
          {storeName.length > 12 ? storeName.slice(0, 12) + "…" : storeName}
        </text>
        <text
          x={homeX}
          y={homeY + 28}
          textAnchor="middle"
          fontSize="9"
          fill="#7A8A85"
        >
          Вы здесь
        </text>
      </svg>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function GigaEatModal({ stores, restaurants, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("order");
  const [showDeck, setShowDeck] = useState(false);

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.sheet}>
        <div style={s.handleWrap}>
          <div style={s.handle} />
        </div>
        <div style={s.header}>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3L13 13M13 3L3 13"
                stroke="#7A8A85"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div style={s.toggle}>
            <button
              style={{
                ...s.toggleBtn,
                ...(tab === "order" ? s.toggleActiveGreen : {}),
              }}
              onClick={() => setTab("order")}
            >
              Заказать
            </button>
            <button
              style={{
                ...s.toggleBtn,
                ...(tab === "snack" ? s.toggleActiveOrange : {}),
              }}
              onClick={() => setTab("snack")}
            >
              Перекусить
            </button>
          </div>
          <button style={s.deckBtn} onClick={() => setShowDeck(true)}>
            <DeckIcon />
          </button>
        </div>
        <div style={s.scroll}>
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

// ─── Order list ───────────────────────────────────────────────────────────────

function OrderList({ stores }: { stores: StoreResult[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [walkStore, setWalkStore] = useState<StoreResult | null>(null);
  const [cartData, setCartData] = useState<{ store: StoreResult; cart: CartData } | null>(null);

  function handleSelectStore(store: StoreResult) {
    // In real app, call createRationCart(rationId, store.store_id)
    // For mock, generate cart from store's available products
    const mockCart: CartData = {
      ...MOCK_CART,
      items: store.available.map((p) => ({
        ingredient_name: p.name,
        product_name: `${p.name} ${p.weight_g}г`,
        price_rub: p.price_rub,
        found: true,
        quantity: 1,
      })).concat(
        store.missing.map((name) => ({
          ingredient_name: name,
          product_name: null,
          price_rub: 0,
          found: false,
          quantity: 1,
        }))
      ),
      total_price_rub: store.total_price,
      found_count: store.available.length,
      total_count: store.available.length + store.missing.length,
    };
    setCartData({ store, cart: mockCart });
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stores.map((store) => {
          const isOpen = openId === store.store_id;
          return (
            <div
              key={store.store_id}
              style={{ ...s.row, ...(isOpen ? s.rowOpenGreen : {}) }}
            >
              <div
                style={s.rowHeader}
                onClick={() => setOpenId(isOpen ? null : store.store_id)}
              >
                <div style={s.iconBox}>
                  <StoreIcon active={isOpen} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      ...s.rowName,
                      color: isOpen ? "#21A038" : "var(--text-primary)",
                    }}
                  >
                    {store.name}
                  </div>
                  <div style={s.metaRow}>
                    <span style={s.deliveryChip}>
                      <CourierIcon /> ~{store.delivery_min} мин
                    </span>
                    {store.type === "darkstore" ? (
                      <>
                        <span style={s.metaSep}>|</span>
                        <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>
                          своя доставка
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={s.metaSep}>|</span>
                        <span style={s.distText}>
                          {distLabel(store.distance_m)}{" "}
                          <span
                            style={s.walkLink}
                            onClick={(e) => {
                              e.stopPropagation();
                              setWalkStore(store);
                            }}
                          >
                            пешком →
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div style={s.rowRight}>
                  <div style={s.rowPrice}>
                    {store.total_price.toLocaleString("ru")} ₽
                  </div>
                  <Chevron
                    open={isOpen}
                    color={isOpen ? "#21A038" : "#B0BDB8"}
                  />
                </div>
              </div>
              {isOpen && (
                <div style={s.expanded}>
                  <div style={s.productsStrip}>
                    {store.available.map((p, i) => (
                      <div key={i} style={s.productCard}>
                        <div style={s.productEmoji}>
                          {STORE_EMOJIS[i % STORE_EMOJIS.length]}
                        </div>
                        <div style={s.productName}>{p.name}</div>
                        <div style={s.productKbju}>
                          {p.kcal}кк · Б{p.protein} · Ж{p.fat} · У{p.carbs}
                        </div>
                        <div style={s.priceGreen}>{p.price_rub} ₽</div>
                      </div>
                    ))}
                  </div>
                  {store.available.length > 3 && (
                    <div style={s.scrollHint}>← листайте →</div>
                  )}
                  {store.missing.length > 0 && (
                    <div style={s.missingRow}>
                      Нет в наличии:{" "}
                      <span style={{ color: "#E05A2B", fontWeight: 700 }}>
                        {store.missing.join(", ")}
                      </span>
                    </div>
                  )}
                  <button style={s.ctaGreen} onClick={() => handleSelectStore(store)}>Выбрать магазин</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {walkStore && (
        <WalkModal
          name={walkStore.name}
          address={storeAddress(walkStore.name)}
          distance_m={walkStore.distance_m}
          onClose={() => setWalkStore(null)}
        />
      )}

      {cartData && (
        <CartEditModal
          items={cartData.cart.items}
          storeName={cartData.store.name}
          storeType={cartData.store.type ?? "supermarket"}
          checkoutUrl={cartData.cart.checkout_url}
          onClose={() => setCartData(null)}
        />
      )}
    </>
  );
}

// ─── Snack list ───────────────────────────────────────────────────────────────

function SnackList({ restaurants }: { restaurants: Restaurant[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {restaurants.map((rest, ri) => {
        const isOpen = openId === rest.id;
        return (
          <div
            key={rest.id}
            style={{ ...s.row, ...(isOpen ? s.rowOpenOrange : {}) }}
          >
            <div
              style={s.rowHeader}
              onClick={() => setOpenId(isOpen ? null : rest.id)}
            >
              <div
                style={{
                  ...s.iconBox,
                  background: isOpen ? "#fff" : "#FFF3E8",
                  fontSize: 20,
                }}
              >
                {REST_EMOJIS[ri % REST_EMOJIS.length]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    ...s.rowName,
                    color: isOpen ? "#E8763A" : "var(--text-primary)",
                  }}
                >
                  {rest.name}
                </div>
                <div style={s.metaRow}>
                  <span style={s.distText}>{distLabel(rest.distance_m)}</span>
                  <span style={s.metaSep}>·</span>
                  <span style={{ fontSize: 11, color: "#7A8A85" }}>
                    🔥 {rest.walk_kcal} ккал пешком
                  </span>
                </div>
              </div>
              <Chevron open={isOpen} color={isOpen ? "#E8763A" : "#B0BDB8"} />
            </div>
            {isOpen && (
              <div style={s.expanded}>
                <div style={s.productsStrip}>
                  {rest.dishes.map((d, i) => (
                    <div key={i} style={s.productCard}>
                      <div style={s.productEmoji}>
                        {DISH_EMOJIS[i % DISH_EMOJIS.length]}
                      </div>
                      <div style={s.productName}>{d.name}</div>
                      <div style={s.productKbju}>
                        {d.kcal}кк · Б{d.protein} · Ж{d.fat} · У{d.carbs}
                      </div>
                      <div style={s.priceOrange}>{d.price_rub} ₽</div>
                    </div>
                  ))}
                </div>
                {rest.dishes.length > 3 && (
                  <div style={s.scrollHint}>← листайте →</div>
                )}
                <button style={s.ctaOrange}>Построить маршрут</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function distLabel(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${m} м`;
}

function storeAddress(name: string): string {
  const map: Record<string, string> = {
    Пятёрочка: "Кутузовский пр-т, 30",
    Перекрёсток: "Кутузовский пр-т, 18",
    ВкусВилл: "Большая Дорогомиловская, 5",
    Магнит: "Кутузовский пр-т, 12",
  };
  return map[name] ?? "ул. Неизвестная, 1";
}

function Chevron({ open, color }: { open: boolean; color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        transition: "transform 0.2s",
        transform: open ? "rotate(180deg)" : "none",
        flexShrink: 0,
      }}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StoreIcon({ active }: { active: boolean }) {
  const c = active ? "#21A038" : "#7A8A85";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="7"
        width="20"
        height="14"
        rx="2"
        stroke={c}
        strokeWidth="1.8"
      />
      <path
        d="M16 7V5a4 4 0 0 0-8 0v2"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CourierIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }}
    >
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 18H2V9l5-5h9l4 5v4h-2M4 18h10M16 18h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect
        x="2"
        y="6"
        width="13"
        height="10"
        rx="2.5"
        fill="var(--green)"
        opacity="0.18"
      />
      <rect
        x="0.5"
        y="3.5"
        width="13"
        height="10"
        rx="2.5"
        fill="var(--green)"
        opacity="0.35"
      />
      <rect
        x="4"
        y="5"
        width="14"
        height="10"
        rx="2.5"
        stroke="var(--green)"
        strokeWidth="1.4"
        fill="white"
      />
      <path
        d="M7.5 10.5h5M7.5 13h3"
        stroke="var(--green)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const STORE_EMOJIS = ["🥩", "🥛", "🌾", "🥚", "🧀", "🥦", "🍳"];
const REST_EMOJIS = ["🍜", "🍕", "🍱", "🥩", "🌮"];
const DISH_EMOJIS = ["🥞", "🍚", "🍲", "🥗", "🍣", "🥘", "🫕"];

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  // Main modal
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
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    zIndex: 101,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  handleWrap: {
    display: "flex",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 4,
    flexShrink: 0,
  },
  handle: { width: 36, height: 4, background: "#E8EEEB", borderRadius: 2 },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 14px 12px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "var(--bg)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  toggleActiveGreen: {
    background: "#fff",
    color: "#21A038",
    boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
  },
  toggleActiveOrange: {
    background: "#fff",
    color: "#E8763A",
    boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
  },
  deckBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "var(--green-light)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { overflowY: "auto", flex: 1, padding: "12px 14px 32px" },

  // Rows
  row: { background: "var(--bg)", borderRadius: 16, overflow: "hidden" },
  rowOpenGreen: { background: "#EAF7EE", border: "1.5px solid #21A038" },
  rowOpenOrange: { background: "#FFF3EB", border: "1.5px solid #E8763A" },
  rowHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 14px",
    cursor: "pointer",
  },
  iconBox: {
    width: 38,
    height: 38,
    background: "#fff",
    borderRadius: 10,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    marginBottom: 4,
  },
  metaRow: { display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" },
  deliveryChip: {
    fontSize: 11,
    color: "#7A8A85",
    display: "flex",
    alignItems: "center",
  },
  metaSep: { fontSize: 11, color: "#B0BDB8" },
  distText: { fontSize: 11, color: "#7A8A85" },
  walkLink: {
    fontSize: 11,
    color: "#21A038",
    fontWeight: 700,
    textDecoration: "underline",
    cursor: "pointer",
  },
  rowRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  rowPrice: { fontSize: 14, fontWeight: 800 },

  // Expanded
  expanded: { padding: "0 10px 12px" },
  productsStrip: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 8,
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
    marginBottom: 4,
  },
  productCard: {
    minWidth: 100,
    maxWidth: 110,
    flexShrink: 0,
    background: "#fff",
    borderRadius: 12,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  productEmoji: { fontSize: 22 },
  productName: { fontSize: 11, fontWeight: 700, lineHeight: 1.3 },
  productKbju: { fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.4 },
  priceGreen: { fontSize: 13, fontWeight: 800, color: "#21A038", marginTop: 2 },
  priceOrange: {
    fontSize: 13,
    fontWeight: 800,
    color: "#E8763A",
    marginTop: 2,
  },
  scrollHint: {
    fontSize: 10,
    color: "var(--text-muted)",
    textAlign: "center",
    marginBottom: 8,
  },
  missingRow: { fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 },
  ctaGreen: {
    width: "100%",
    padding: 12,
    background: "#21A038",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  ctaOrange: {
    width: "100%",
    padding: 12,
    background: "#E8763A",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  // Walk modal
  walkOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 200,
  },
  walkSheet: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    zIndex: 201,
    paddingBottom: 32,
  },
  walkHandleWrap: {
    display: "flex",
    justifyContent: "center",
    paddingTop: 10,
    marginBottom: 4,
  },
  walkHandle: { width: 36, height: 4, background: "#E8EEEB", borderRadius: 2 },
  walkHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 16px 12px",
    borderBottom: "1px solid var(--border)",
  },
  walkTitle: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" },
  walkCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "var(--bg)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  walkInfoBlock: {
    margin: "12px 16px 0",
    background: "var(--bg)",
    borderRadius: 14,
    padding: "4px 14px",
  },
  walkInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
  },
  walkInfoIcon: { fontSize: 20, flexShrink: 0 },
  walkInfoLabel: {
    fontSize: 11,
    color: "var(--text-secondary)",
    marginBottom: 2,
  },
  walkInfoVal: { fontSize: 14, fontWeight: 700 },
  walkDivider: { height: 1, background: "var(--border)" },
  mapWrap: {
    margin: "10px 16px 0",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid var(--border)",
  },

  // Choice buttons
  choiceRow: { display: "flex", gap: 10, padding: "14px 16px 0" },
  walkBtn: {
    flex: 1,
    padding: "13px 0",
    background: "var(--green)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  orderBtn: {
    flex: 1,
    padding: "13px 0",
    background: "var(--bg)",
    color: "var(--text-secondary)",
    border: "1.5px solid var(--border)",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  // Celebration screen
  celebWrap: {
    padding: "20px 24px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  celebEmoji: { fontSize: 56, marginBottom: 12 },
  celebTitle: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    marginBottom: 10,
  },
  celebText: {
    fontSize: 14,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    marginBottom: 20,
    whiteSpace: "pre-line",
  },
  celebAccent: { color: "var(--green)", fontWeight: 700 },
  celebStatsRow: {
    display: "flex",
    alignItems: "center",
    background: "var(--green-light)",
    borderRadius: 16,
    padding: "14px 20px",
    gap: 0,
    width: "100%",
    marginBottom: 16,
  },
  celebStat: { flex: 1, textAlign: "center" },
  celebStatNum: {
    fontSize: 20,
    fontWeight: 800,
    color: "var(--green)",
    letterSpacing: "-0.03em",
  },
  celebStatLabel: {
    fontSize: 10,
    color: "var(--green)",
    fontWeight: 500,
    marginTop: 2,
  },
  celebStatDivider: {
    width: 1,
    height: 32,
    background: "rgba(33,160,56,0.25)",
  },
  celebTip: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    marginBottom: 24,
  },
  celebBtn: {
    width: "100%",
    padding: 15,
    background: "var(--green)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },
};
