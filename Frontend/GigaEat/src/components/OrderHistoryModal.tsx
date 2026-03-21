import { useState, useEffect } from "react";
import type { OrderHistoryItem } from "../contracts";
import { getOrderHistory } from "../api/client";

const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface Props {
  userId: string;
  onClose: () => void;
}

export default function OrderHistoryModal({ userId, onClose }: Props) {
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(2); // March = 2 (0-indexed)
  const [calYear, setCalYear] = useState(2026);

  useEffect(() => {
    getOrderHistory(userId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [userId]);

  // Build a set of dates that have orders
  const orderDates = new Set(history.map((h) => h.date));

  // Get orders for selected date
  const selectedOrders = selectedDate
    ? history.filter((h) => h.date === selectedDate)
    : [];

  // Calendar grid
  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  // getDay: 0=Sun, we need Mon=0
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const calendarCells: { day: number | null; dateStr: string; isToday: boolean; hasOrder: boolean; isFuture: boolean }[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push({ day: null, dateStr: "", isToday: false, hasOrder: false, isFuture: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cellDate = new Date(calYear, calMonth, d);
    calendarCells.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      hasOrder: orderDates.has(dateStr),
      isFuture: cellDate > today,
    });
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  }

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.sheet}>
        <div style={s.handleWrap}>
          <div style={s.handle} />
        </div>

        <div style={s.header}>
          <div style={s.headerTitle}>📋 История заказов</div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={s.loadingWrap}>
            <span style={s.spinner} />
            <div style={{ fontSize: 13, color: "#888", marginTop: 12 }}>Загрузка истории...</div>
          </div>
        ) : (
          <div style={s.scroll}>
            {/* Calendar */}
            <div style={s.calCard}>
              <div style={s.calNav}>
                <button style={s.calArrow} onClick={prevMonth}>‹</button>
                <span style={s.calMonthLabel}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button style={s.calArrow} onClick={nextMonth}>›</button>
              </div>

              <div style={s.calGrid}>
                {WEEKDAYS.map((wd) => (
                  <div key={wd} style={s.calWeekday}>{wd}</div>
                ))}
                {calendarCells.map((cell, i) => {
                  if (!cell.day) return <div key={i} />;
                  const isSelected = cell.dateStr === selectedDate;
                  return (
                    <button
                      key={i}
                      style={{
                        ...s.calDay,
                        ...(cell.hasOrder ? s.calDayHasOrder : {}),
                        ...(isSelected ? s.calDaySelected : {}),
                        ...(cell.isToday && !isSelected ? s.calDayToday : {}),
                        ...(cell.isFuture ? s.calDayFuture : {}),
                      }}
                      onClick={() => {
                        if (!cell.isFuture) {
                          setSelectedDate(isSelected ? null : cell.dateStr);
                        }
                      }}
                    >
                      {cell.day}
                      {cell.hasOrder && (
                        <span style={{
                          ...s.calDot,
                          ...(isSelected ? { background: "#fff" } : {}),
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={s.calLegend}>
                <div style={s.legendItem}>
                  <span style={{ ...s.legendDot, background: "#21A038" }} />
                  Заказ оформлен
                </div>
                <div style={s.legendItem}>
                  <span style={{ ...s.legendDot, background: "#F5C842" }} />
                  Рацион составлен
                </div>
                <div style={s.legendItem}>
                  <span style={{ ...s.legendDot, background: "#EDEAE4" }} />
                  Нет данных
                </div>
              </div>
            </div>

            {/* Selected day detail */}
            {selectedDate && (
              <div style={s.detailSection}>
                <div style={s.detailDateHeader}>
                  {formatDateRu(selectedDate)}
                </div>
                {selectedOrders.length === 0 ? (
                  <div style={s.emptyDay}>
                    <span style={{ fontSize: 32, marginBottom: 8 }}>🍽️</span>
                    <div style={{ fontSize: 13, color: "#888" }}>В этот день заказов не было</div>
                  </div>
                ) : (
                  selectedOrders.map((order) => (
                    <div key={order.ration_id} style={s.orderCard}>
                      <div style={s.orderHeader}>
                        <div style={s.orderKcal}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: "#E06030" }}>
                            {order.total_kcal}
                          </span>
                          <span style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>ккал</span>
                        </div>
                        <div style={{
                          ...s.statusBadge,
                          ...(order.status === "ordered" ? s.statusOrdered : s.statusGenerated),
                        }}>
                          {order.status === "ordered" ? "🛒 Заказано" : "📝 Составлено"}
                        </div>
                      </div>

                      {/* Meals */}
                      <div style={s.mealsList}>
                        {order.meals.map((meal, mi) => (
                          <div key={mi} style={s.mealRow}>
                            <div style={s.mealIcon}>
                              {MEAL_ICONS[meal.meal_type] ?? "🍴"}
                            </div>
                            <div style={s.mealInfo}>
                              <div style={s.mealType}>
                                {MEAL_LABELS[meal.meal_type] ?? meal.meal_type}
                              </div>
                              <div style={s.mealName}>{meal.name}</div>
                            </div>
                            <div style={s.mealKcal}>{meal.kcal} кк</div>
                          </div>
                        ))}
                      </div>

                      {/* Store info */}
                      {order.store_name && (
                        <div style={s.storeRow}>
                          <span style={{ fontSize: 14 }}>🏪</span>
                          <span style={s.storeName}>{order.store_name}</span>
                          <span style={s.storePrice}>
                            {order.total_price_rub?.toLocaleString("ru")} ₽
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Recent orders list (when no date selected) */}
            {!selectedDate && (
              <div style={s.recentSection}>
                <div style={s.recentTitle}>Последние заказы</div>
                {history.slice(0, 7).map((order) => (
                  <button
                    key={order.ration_id}
                    style={s.recentCard}
                    onClick={() => {
                      setSelectedDate(order.date);
                      // Navigate calendar to that month
                      const d = new Date(order.date);
                      setCalMonth(d.getMonth());
                      setCalYear(d.getFullYear());
                    }}
                  >
                    <div style={s.recentLeft}>
                      <div style={s.recentDate}>
                        {formatDateShort(order.date)}
                      </div>
                      <div style={s.recentMeals}>
                        {order.meals.map((m) => MEAL_ICONS[m.meal_type] ?? "🍴").join(" ")}
                        <span style={{ marginLeft: 6, color: "#888", fontSize: 11 }}>
                          {order.meals.length} приёма
                        </span>
                      </div>
                    </div>
                    <div style={s.recentRight}>
                      <div style={s.recentKcal}>{order.total_kcal} кк</div>
                      <div style={{
                        ...s.recentStatus,
                        color: order.status === "ordered" ? "#21A038" : "#B07A10",
                      }}>
                        {order.status === "ordered" ? "Заказано" : "Составлено"}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M6 4L10 8L6 12" stroke="#B0BDB8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Stats summary */}
            {!selectedDate && history.length > 0 && (
              <div style={s.statsCard}>
                <div style={s.statsTitle}>📊 Статистика за месяц</div>
                <div style={s.statsGrid}>
                  <div style={s.statItem}>
                    <div style={s.statNum}>{history.length}</div>
                    <div style={s.statLabel}>рационов</div>
                  </div>
                  <div style={s.statDivider} />
                  <div style={s.statItem}>
                    <div style={s.statNum}>
                      {Math.round(history.reduce((s, h) => s + h.total_kcal, 0) / history.length)}
                    </div>
                    <div style={s.statLabel}>ккал / день</div>
                  </div>
                  <div style={s.statDivider} />
                  <div style={s.statItem}>
                    <div style={s.statNum}>
                      {history.filter((h) => h.status === "ordered").length}
                    </div>
                    <div style={s.statLabel}>заказов</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRu(dateStr: string): string {
  const d = new Date(dateStr);
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
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
    maxHeight: "92dvh",
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
    padding: "10px 0 4px",
    flexShrink: 0,
  },
  handle: { width: 36, height: 4, background: "#E0DDD7", borderRadius: 2 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 18px 14px",
    borderBottom: "1px solid #F0EDE8",
    flexShrink: 0,
  },
  headerTitle: { fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" },
  closeBtn: {
    background: "#F0EDE8",
    border: "none",
    fontSize: 16,
    color: "#888",
    cursor: "pointer",
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1, overflowY: "auto", padding: "0 0 32px" },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
  },
  spinner: {
    display: "inline-block",
    width: 24,
    height: 24,
    border: "3px solid #E8EEEB",
    borderTopColor: "#21A038",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },

  // Calendar card
  calCard: {
    margin: "14px 16px 0",
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #F0EDE8",
    padding: "14px 14px 10px",
  },
  calNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calArrow: {
    background: "none",
    border: "none",
    fontSize: 22,
    color: "#888",
    cursor: "pointer",
    padding: "0 8px",
    fontWeight: 700,
  },
  calMonthLabel: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" },
  calGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 3,
  },
  calWeekday: {
    textAlign: "center",
    fontSize: 10,
    color: "#888",
    fontWeight: 600,
    padding: "4px 0",
  },
  calDay: {
    position: "relative",
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    borderRadius: "50%",
    fontSize: 12,
    fontWeight: 600,
    background: "transparent",
    color: "#1A1A2E",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  calDayHasOrder: {
    background: "#E8F7EC",
    color: "#1A7A30",
    fontWeight: 700,
  },
  calDaySelected: {
    background: "#21A038",
    color: "#fff",
    fontWeight: 800,
    boxShadow: "0 2px 8px rgba(33,160,56,0.3)",
  },
  calDayToday: {
    outline: "2px solid #E06030",
    outlineOffset: 1,
  },
  calDayFuture: {
    color: "#C0BDB5",
    cursor: "default",
  },
  calDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: "#21A038",
  },
  calLegend: {
    display: "flex",
    gap: 14,
    justifyContent: "center",
    padding: "10px 0 4px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    color: "#888",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "inline-block",
  },

  // Detail section
  detailSection: { padding: "12px 16px 0" },
  detailDateHeader: {
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 12,
    color: "#1A1A2E",
    letterSpacing: "-0.02em",
  },
  emptyDay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "28px 0",
    background: "#F7F5F1",
    borderRadius: 16,
  },
  orderCard: {
    background: "#F7F5F1",
    borderRadius: 18,
    padding: "14px 16px",
    marginBottom: 10,
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderKcal: { display: "flex", alignItems: "baseline" },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 20,
  },
  statusOrdered: {
    background: "#E8F7EC",
    color: "#1A7A30",
  },
  statusGenerated: {
    background: "#FFF3D0",
    color: "#B07A10",
  },
  mealsList: { display: "flex", flexDirection: "column", gap: 6 },
  mealRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
  },
  mealIcon: { fontSize: 18, flexShrink: 0 },
  mealInfo: { flex: 1, minWidth: 0 },
  mealType: { fontSize: 10, fontWeight: 600, color: "#888", marginBottom: 1 },
  mealName: { fontSize: 13, fontWeight: 700, color: "#1A1A2E" },
  mealKcal: { fontSize: 12, fontWeight: 700, color: "#E06030", flexShrink: 0 },
  storeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    padding: "10px 12px",
    background: "#E8F7EC",
    borderRadius: 12,
  },
  storeName: { fontSize: 13, fontWeight: 700, color: "#1A7A30", flex: 1 },
  storePrice: { fontSize: 14, fontWeight: 800, color: "#1A7A30" },

  // Recent orders
  recentSection: { padding: "14px 16px 0" },
  recentTitle: {
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 10,
    letterSpacing: "-0.02em",
  },
  recentCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    background: "#F7F5F1",
    borderRadius: 14,
    padding: "12px 14px",
    marginBottom: 8,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    border: "none",
    transition: "background 0.15s",
  },
  recentLeft: { flex: 1, minWidth: 0 },
  recentDate: { fontSize: 14, fontWeight: 800, marginBottom: 3 },
  recentMeals: { fontSize: 13, display: "flex", alignItems: "center", gap: 2 },
  recentRight: { textAlign: "right", flexShrink: 0 },
  recentKcal: { fontSize: 14, fontWeight: 800, color: "#E06030" },
  recentStatus: { fontSize: 10, fontWeight: 600, marginTop: 2 },

  // Stats
  statsCard: {
    margin: "14px 16px 0",
    background: "linear-gradient(135deg,#E8F7EC,#fff)",
    borderRadius: 18,
    padding: "16px 14px",
    border: "1px solid #C2EAC8",
  },
  statsTitle: { fontSize: 14, fontWeight: 800, marginBottom: 14 },
  statsGrid: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: { textAlign: "center", flex: 1 },
  statNum: { fontSize: 22, fontWeight: 800, color: "#21A038", letterSpacing: "-0.03em" },
  statLabel: { fontSize: 10, color: "#888", marginTop: 2, fontWeight: 500 },
  statDivider: { width: 1, height: 32, background: "rgba(33,160,56,0.2)" },
};
