import { useState } from "react";
import type { CartItem } from "../contracts";

interface Props {
  items: CartItem[];
  storeName: string;
  storeType: "supermarket" | "darkstore";
  checkoutUrl: string;
  onClose: () => void;
}

interface DeliveryService {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  bg: string;
  deliveryLabel: string;
  extraPercent: number;
}

// Агрегаторы для супермаркетов (Пятёрочка, Перекрёсток, ВкусВилл, Магнит)
const AGGREGATOR_SERVICES: DeliveryService[] = [
  {
    id: "kuper",
    name: "Купер",
    icon: "🛒",
    color: "#E3000F",
    gradient: "linear-gradient(135deg,#E3000F,#FF4040)",
    bg: "#FFF0F0",
    deliveryLabel: "30–60 мин",
    extraPercent: 0,
  },
  {
    id: "yandex",
    name: "Яндекс Доставка",
    icon: "📦",
    color: "#FFCC00",
    gradient: "linear-gradient(135deg,#E6B800,#FFCC00)",
    bg: "#FFFBE6",
    deliveryLabel: "25–45 мин",
    extraPercent: 3,
  },
];

// Дарксторы — доставляют сами, выбора нет
const DARKSTORE_INFO: Record<string, { icon: string; color: string; gradient: string }> = {
  "Яндекс Лавка": { icon: "🟡", color: "#E6B800", gradient: "linear-gradient(135deg,#E6B800,#FFCC00)" },
  "Самокат":       { icon: "🛴", color: "#FF6633", gradient: "linear-gradient(135deg,#E85A20,#FF6633)" },
};

export default function CartEditModal({ items: initialItems, storeName, storeType, checkoutUrl, onClose }: Props) {
  const [items, setItems] = useState<CartItem[]>(
    initialItems.map((it) => ({ ...it, quantity: it.quantity ?? 1 }))
  );
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set());
  const [selectedAggregator, setSelectedAggregator] = useState<string>("kuper");

  const isDarkstore = storeType === "darkstore";
  const darkInfo = DARKSTORE_INFO[storeName] ?? { icon: "📦", color: "#21A038", gradient: "linear-gradient(135deg,#1D9034,#2BBE4E)" };

  const activeItems = items.filter((_, i) => !removedIds.has(i));
  const foundItems = activeItems.filter((it) => it.found);
  const notFoundItems = activeItems.filter((it) => !it.found);
  const basePrice = foundItems.reduce((sum, it) => sum + it.price_rub * (it.quantity ?? 1), 0);

  const aggregator = !isDarkstore ? AGGREGATOR_SERVICES.find((s) => s.id === selectedAggregator)! : null;
  const extraPercent = aggregator ? aggregator.extraPercent : 0;
  const totalPrice = Math.round(basePrice * (1 + extraPercent / 100));

  const checkoutName = isDarkstore ? storeName : aggregator!.name;
  const checkoutColor = isDarkstore ? darkInfo.color : aggregator!.color;
  const checkoutGradient = isDarkstore ? darkInfo.gradient : aggregator!.gradient;

  function updateQuantity(index: number, delta: number) {
    setItems((prev) => prev.map((it, i) => {
      if (i !== index) return it;
      const newQ = Math.max(0, (it.quantity ?? 1) + delta);
      if (newQ === 0) {
        setRemovedIds((s) => new Set(s).add(i));
        return it;
      }
      return { ...it, quantity: newQ };
    }));
  }

  function removeItem(index: number) {
    setRemovedIds((s) => new Set(s).add(index));
  }

  function restoreItem(index: number) {
    setRemovedIds((s) => {
      const n = new Set(s);
      n.delete(index);
      return n;
    });
  }

  const hasChanges = removedIds.size > 0 || items.some((it, i) =>
    !removedIds.has(i) && (it.quantity ?? 1) !== (initialItems[i]?.quantity ?? 1)
  );

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.sheet}>
        <div style={s.handleWrap}>
          <div style={s.handle} />
        </div>

        <div style={s.header}>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="#7A8A85" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <div style={s.headerCenter}>
            <div style={s.headerTitle}>Корзина</div>
            <div style={s.headerSub}>{storeName}</div>
          </div>
          <div style={{ width: 32 }} />
        </div>

        {/* Summary banner */}
        <div style={s.summaryBanner}>
          <div style={s.summaryRow}>
            <div style={s.summaryItem}>
              <div style={s.summaryNum}>{foundItems.length}</div>
              <div style={s.summaryLabel}>товаров</div>
            </div>
            <div style={s.summaryDivider} />
            <div style={s.summaryItem}>
              <div style={s.summaryNum}>{totalPrice.toLocaleString("ru")} ₽</div>
              <div style={s.summaryLabel}>итого</div>
            </div>
            {notFoundItems.length > 0 && (
              <>
                <div style={s.summaryDivider} />
                <div style={s.summaryItem}>
                  <div style={{ ...s.summaryNum, color: "#E05A2B" }}>{notFoundItems.length}</div>
                  <div style={s.summaryLabel}>не найдено</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items list */}
        <div style={s.scroll}>
          {items.map((item, index) => {
            const isRemoved = removedIds.has(index);
            if (isRemoved) {
              return (
                <div key={index} style={s.removedRow}>
                  <div style={s.removedText}>
                    <span style={{ textDecoration: "line-through", color: "#B0ACA4" }}>
                      {item.ingredient_name}
                    </span>
                    <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>удалено</span>
                  </div>
                  <button style={s.restoreBtn} onClick={() => restoreItem(index)}>
                    Вернуть
                  </button>
                </div>
              );
            }

            return (
              <div key={index} style={{
                ...s.itemCard,
                ...(item.found ? {} : s.itemNotFound),
              }}>
                <div style={s.itemTop}>
                  <div style={s.itemInfo}>
                    <div style={s.itemName}>{item.ingredient_name}</div>
                    {item.product_name && (
                      <div style={s.productName}>{item.product_name}</div>
                    )}
                    {!item.found && (
                      <div style={s.notFoundLabel}>Не найдено в магазине</div>
                    )}
                  </div>
                  <button style={s.deleteBtn} onClick={() => removeItem(index)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4L12 12M12 4L4 12" stroke="#B0ACA4" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {item.found && (
                  <div style={s.itemBottom}>
                    <div style={s.priceTag}>
                      {(item.price_rub * (item.quantity ?? 1)).toLocaleString("ru")} ₽
                      {(item.quantity ?? 1) > 1 && (
                        <span style={s.pricePerUnit}> ({item.price_rub} ₽/шт)</span>
                      )}
                    </div>
                    <div style={s.qtyControl}>
                      <button
                        style={s.qtyBtn}
                        onClick={() => updateQuantity(index, -1)}
                      >
                        −
                      </button>
                      <span style={s.qtyNum}>{item.quantity ?? 1}</span>
                      <button
                        style={s.qtyBtn}
                        onClick={() => updateQuantity(index, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Delivery service selector — only for supermarkets */}
        {!isDarkstore && (
          <div style={s.serviceSection}>
            <div style={s.serviceSectionTitle}>Заказать через</div>
            <div style={s.serviceRow}>
              {AGGREGATOR_SERVICES.map((svc) => {
                const isActive = selectedAggregator === svc.id;
                return (
                  <button
                    key={svc.id}
                    style={{
                      ...s.serviceCard,
                      background: isActive ? svc.bg : "#F7F5F1",
                      borderColor: isActive ? svc.color : "#E8E4DC",
                      boxShadow: isActive ? `0 2px 12px ${svc.color}22` : "none",
                    }}
                    onClick={() => setSelectedAggregator(svc.id)}
                  >
                    <div style={s.serviceTop}>
                      <span style={s.serviceIcon}>{svc.icon}</span>
                      <span style={{
                        ...s.serviceName,
                        color: isActive ? svc.color : "#5A5A5A",
                        fontWeight: isActive ? 800 : 600,
                      }}>{svc.name}</span>
                      {isActive && (
                        <span style={{ ...s.serviceCheckmark, background: svc.color }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <div style={s.serviceBottom}>
                      <span style={s.serviceDeliveryTime}>{svc.deliveryLabel}</span>
                      {svc.extraPercent > 0 && (
                        <span style={s.serviceMarkup}>+{svc.extraPercent}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Darkstore self-delivery badge */}
        {isDarkstore && (
          <div style={s.darkstoreBadge}>
            <span style={{ fontSize: 16 }}>{darkInfo.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>
                Доставка от {storeName}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                Собственная курьерская служба
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={s.footer}>
          {hasChanges && (
            <div style={s.changesNote}>
              Корзина изменена
            </div>
          )}
          {extraPercent > 0 && (
            <div style={s.markupNote}>
              Наценка {checkoutName}: +{extraPercent}% ({(totalPrice - basePrice).toLocaleString("ru")} ₽)
            </div>
          )}
          <div style={s.footerRow}>
            <div style={s.footerTotal}>
              <div style={s.footerTotalLabel}>Итого</div>
              <div style={s.footerTotalVal}>{totalPrice.toLocaleString("ru")} ₽</div>
            </div>
            <button
              style={{
                ...s.checkoutBtn,
                background: checkoutGradient,
                color: checkoutColor === "#FFCC00" || checkoutColor === "#E6B800" ? "#1A1A2E" : "#fff",
              }}
              onClick={() => window.open(checkoutUrl, "_blank")}
            >
              Заказать в {checkoutName}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 200,
  },
  sheet: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    maxHeight: "92dvh",
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    zIndex: 201,
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
    padding: "6px 16px 12px",
    borderBottom: "1px solid #F0EDE8",
    flexShrink: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#F4F6F5",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { textAlign: "center" },
  headerTitle: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" },
  headerSub: { fontSize: 11, color: "#888", marginTop: 2 },

  summaryBanner: {
    margin: "12px 16px 0",
    background: "#E8F7EC",
    borderRadius: 14,
    padding: "12px 14px",
    flexShrink: 0,
  },
  summaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: { textAlign: "center", flex: 1 },
  summaryNum: { fontSize: 16, fontWeight: 800, color: "#21A038", letterSpacing: "-0.02em" },
  summaryLabel: { fontSize: 10, color: "#1A7A30", marginTop: 2, fontWeight: 500 },
  summaryDivider: { width: 1, height: 28, background: "rgba(33,160,56,0.2)" },

  scroll: { flex: 1, overflowY: "auto", padding: "10px 16px" },

  itemCard: {
    background: "#F7F5F1",
    borderRadius: 14,
    padding: "12px 14px",
    marginBottom: 8,
  },
  itemNotFound: {
    background: "#FFF5F0",
    border: "1px dashed #E8B4A0",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  productName: { fontSize: 11, color: "#888", marginBottom: 2 },
  notFoundLabel: {
    fontSize: 11,
    color: "#E05A2B",
    fontWeight: 600,
    marginTop: 4,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#E8E4DC",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  priceTag: { fontSize: 15, fontWeight: 800, color: "#21A038" },
  pricePerUnit: { fontSize: 11, color: "#888", fontWeight: 500 },
  qtyControl: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: "#fff",
    borderRadius: 10,
    border: "1.5px solid #E8EEEB",
    overflow: "hidden",
  },
  qtyBtn: {
    width: 32,
    height: 32,
    background: "transparent",
    border: "none",
    fontSize: 16,
    fontWeight: 700,
    color: "#21A038",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNum: {
    width: 28,
    textAlign: "center",
    fontSize: 14,
    fontWeight: 800,
    color: "#1A1A2E",
  },

  removedRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "#F7F5F1",
    borderRadius: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  removedText: { fontSize: 13 },
  restoreBtn: {
    fontSize: 12,
    fontWeight: 700,
    color: "#21A038",
    background: "#E8F7EC",
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    cursor: "pointer",
  },

  // ─── Aggregator selector ────────────────────────────────────────────────────
  serviceSection: {
    padding: "10px 16px 6px",
    borderTop: "1px solid #F0EDE8",
    flexShrink: 0,
  },
  serviceSectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#1A1A2E",
    marginBottom: 10,
    letterSpacing: "-0.02em",
  },
  serviceRow: {
    display: "flex",
    gap: 8,
  },
  serviceCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "12px 14px 10px",
    borderRadius: 16,
    border: "2px solid #E8E4DC",
    cursor: "pointer",
    background: "#F7F5F1",
    gap: 8,
  },
  serviceTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  serviceIcon: {
    fontSize: 18,
  },
  serviceName: {
    fontSize: 13,
    letterSpacing: "-0.02em",
    flex: 1,
  },
  serviceCheckmark: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  serviceBottom: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  serviceDeliveryTime: {
    fontSize: 11,
    color: "#888",
    fontWeight: 500,
  },
  serviceMarkup: {
    fontSize: 10,
    color: "#E06030",
    fontWeight: 700,
    background: "#FFF3EE",
    padding: "2px 6px",
    borderRadius: 6,
  },

  // ─── Darkstore badge ───────────────────────────────────────────────────────
  darkstoreBadge: {
    margin: "0 16px",
    padding: "12px 16px",
    background: "#F7F5F1",
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderTop: "1px solid #F0EDE8",
    flexShrink: 0,
  },

  // ─── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    padding: "10px 16px 28px",
    borderTop: "1px solid #F0EDE8",
    flexShrink: 0,
    background: "#fff",
  },
  changesNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#E06030",
    fontWeight: 600,
    marginBottom: 6,
  },
  markupNote: {
    textAlign: "center",
    fontSize: 10,
    color: "#888",
    marginBottom: 6,
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 11, color: "#888" },
  footerTotalVal: { fontSize: 20, fontWeight: 800, color: "#1A1A2E", letterSpacing: "-0.03em" },
  checkoutBtn: {
    padding: "14px 20px",
    background: "linear-gradient(135deg,#1D9034,#2BBE4E)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    whiteSpace: "nowrap",
  },
};
