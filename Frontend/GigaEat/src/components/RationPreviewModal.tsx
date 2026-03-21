import { useState } from "react";
import type { MealPlan, MealItem } from "../contracts";
import { MOCK_MEAL_PLAN, MOCK_MEAL_PLAN_NEW, MOCK_MEAL_PLAN_MIX, MOCK_ALTERNATIVES } from "../mocks";

interface Props {
  plan: MealPlan;
  remainKcal: number;
  remainProtein: number;
  remainFat: number;
  remainCarbs: number;
  onConfirm: () => void;
  onClose: () => void;
}

type RecMode = "classic" | "new" | "mix";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "🌅 Завтрак",
  lunch: "☀️ Обед",
  dinner: "🌙 Ужин",
  snack: "🍎 Перекус",
};

const REC_PLANS: Record<RecMode, MealPlan> = {
  classic: MOCK_MEAL_PLAN,
  new: MOCK_MEAL_PLAN_NEW,
  mix: MOCK_MEAL_PLAN_MIX,
};

const REC_META: { key: RecMode; label: string; icon: string; desc: string }[] = [
  { key: "classic", label: "Классика", icon: "🏠", desc: "Проверенные блюда" },
  { key: "new", label: "Что-то новое", icon: "✨", desc: "Необычные рецепты" },
  { key: "mix", label: "Микс", icon: "🎲", desc: "Лучшее из двух" },
];

export default function RationPreviewModal({
  remainKcal,
  remainProtein,
  remainFat,
  remainCarbs,
  onConfirm,
  onClose,
}: Props) {
  const [recMode, setRecMode] = useState<RecMode>("classic");
  const [customMeals, setCustomMeals] = useState<MealItem[] | null>(null);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);

  // Current plan based on recommendation mode, with custom overrides
  const basePlan = REC_PLANS[recMode];
  const meals = customMeals ?? basePlan.meals;
  const shoppingList = customMeals ? basePlan.shopping_list : basePlan.shopping_list;

  const totalKcal = meals.reduce((sum, m) => sum + m.kcal, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);

  function handleRecChange(mode: RecMode) {
    setRecMode(mode);
    setCustomMeals(null);
    setEditingSlot(null);
  }

  function handleSwapMeal(index: number, newMeal: MealItem) {
    const updated = [...meals];
    updated[index] = newMeal;
    setCustomMeals(updated);
    setEditingSlot(null);
  }

  function handleRemoveMeal(index: number) {
    const updated = meals.filter((_, i) => i !== index);
    setCustomMeals(updated);
    setEditingSlot(null);
  }

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
              <path d="M3 3L13 13M13 3L3 13" stroke="#7A8A85" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div style={s.headerTitle}>Ваш рацион на день</div>
          <div style={{ width: 32 }} />
        </div>

        {/* Recommendation toggles */}
        <div style={s.recSection}>
          <div style={s.recToggleRow}>
            {REC_META.map((r) => (
              <button
                key={r.key}
                style={{
                  ...s.recToggle,
                  ...(recMode === r.key ? s.recToggleActive : {}),
                }}
                onClick={() => handleRecChange(r.key)}
              >
                <span style={s.recToggleIcon}>{r.icon}</span>
                <span style={s.recToggleLabel}>{r.label}</span>
              </button>
            ))}
          </div>
          <div style={s.recDesc}>
            {REC_META.find((r) => r.key === recMode)?.desc}
          </div>
        </div>

        {/* KBJU banner */}
        <div style={s.kbjuBanner}>
          <div style={s.kbjuTitle}>Составлено с учётом остатка КБЖУ</div>
          <div style={s.kbjuRow}>
            {[
              { label: "Калории", val: `${remainKcal} кк`, accent: true },
              { label: "Белки", val: `${remainProtein} г` },
              { label: "Жиры", val: `${remainFat} г` },
              { label: "Углеводы", val: `${remainCarbs} г` },
            ].map((item) => (
              <div key={item.label} style={s.kbjuItem}>
                <div style={{ ...s.kbjuVal, color: item.accent ? "#21A038" : "#1A1A2E" }}>
                  {item.val}
                </div>
                <div style={s.kbjuLabel}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.scroll}>
          {/* Editable hint */}
          <div style={s.editHint}>
            Нажмите на блюдо, чтобы заменить его
          </div>

          {/* Meals - editable */}
          {meals.map((meal, i) => {
            const isEditing = editingSlot === `${meal.meal_type}-${i}`;
            const alternatives = MOCK_ALTERNATIVES[meal.meal_type] ?? [];

            return (
              <div key={`${meal.meal_type}-${i}`}>
                <div
                  style={{
                    ...s.mealCard,
                    ...(isEditing ? s.mealCardEditing : {}),
                  }}
                >
                  <div
                    style={s.mealClickable}
                    onClick={() => setEditingSlot(
                      isEditing ? null : `${meal.meal_type}-${i}`
                    )}
                  >
                    <div style={s.mealHeader}>
                      <span style={s.mealType}>
                        {MEAL_LABELS[meal.meal_type] ?? meal.meal_type}
                      </span>
                      <div style={s.mealActions}>
                        <span style={s.mealKcal}>{meal.kcal} ккал</span>
                        <span style={s.editIcon}>
                          {isEditing ? "▲" : "✎"}
                        </span>
                      </div>
                    </div>
                    <div style={s.mealName}>{meal.dish}</div>
                    <div style={s.mealMacros}>
                      Б {meal.protein}г · Ж {meal.fat}г · У {meal.carbs}г
                    </div>
                  </div>

                  {/* Delete button when editing */}
                  {isEditing && meals.length > 1 && (
                    <button
                      style={s.removeMealBtn}
                      onClick={() => handleRemoveMeal(i)}
                    >
                      Убрать из рациона
                    </button>
                  )}
                </div>

                {/* Alternatives dropdown */}
                {isEditing && (
                  <div style={s.altSection}>
                    <div style={s.altTitle}>Выберите замену:</div>
                    <div style={s.altList}>
                      {alternatives
                        .filter((a) => a.dish !== meal.dish)
                        .map((alt, ai) => (
                          <button
                            key={ai}
                            style={s.altCard}
                            onClick={() => handleSwapMeal(i, alt)}
                          >
                            <div style={s.altTop}>
                              <div style={s.altName}>{alt.dish}</div>
                              <div style={s.altKcal}>{alt.kcal} кк</div>
                            </div>
                            <div style={s.altMacros}>
                              Б {alt.protein}г · Ж {alt.fat}г · У {alt.carbs}г
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Shopping list */}
          <div style={s.shoppingBlock}>
            <div style={s.shoppingTitle}>🛒 Список продуктов</div>
            {shoppingList.map((item, i) => (
              <div
                key={i}
                style={{
                  ...s.shoppingRow,
                  borderBottom: i < shoppingList.length - 1 ? "1px solid #E8EEEB" : "none",
                }}
              >
                <span style={s.shoppingName}>{item.product}</span>
                <span style={s.shoppingQty}>{item.qty} {item.unit}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={s.totalCard}>
            <div style={s.totalHeader}>Итого за день</div>
            <div style={s.totalGrid}>
              <div style={s.totalItem}>
                <div style={s.totalNum}>{totalKcal}</div>
                <div style={s.totalLabel}>ккал</div>
              </div>
              <div style={s.totalDivider} />
              <div style={s.totalItem}>
                <div style={s.totalNum}>{totalProtein}г</div>
                <div style={s.totalLabel}>белки</div>
              </div>
              <div style={s.totalDivider} />
              <div style={s.totalItem}>
                <div style={s.totalNum}>{totalFat}г</div>
                <div style={s.totalLabel}>жиры</div>
              </div>
              <div style={s.totalDivider} />
              <div style={s.totalItem}>
                <div style={s.totalNum}>{totalCarbs}г</div>
                <div style={s.totalLabel}>углеводы</div>
              </div>
            </div>
          </div>

          {customMeals && (
            <div style={s.customBadge}>
              Рацион изменён вами
            </div>
          )}
        </div>

        <div style={s.footer}>
          <button style={s.confirmBtn} onClick={onConfirm}>
            Подобрать магазин
          </button>
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
    height: "92dvh",
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
    padding: "8px 16px 12px",
    flexShrink: 0,
    borderBottom: "1px solid #E8EEEB",
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
  headerTitle: { fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" },

  // Recommendation toggles
  recSection: {
    padding: "12px 16px 8px",
    flexShrink: 0,
  },
  recToggleRow: {
    display: "flex",
    gap: 6,
    background: "#F7F5F1",
    borderRadius: 14,
    padding: 4,
  },
  recToggle: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "10px 4px 8px",
    borderRadius: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  recToggleActive: {
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  recToggleIcon: { fontSize: 18 },
  recToggleLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1A1A2E",
    letterSpacing: "-0.02em",
  },
  recDesc: {
    textAlign: "center",
    fontSize: 11,
    color: "#888",
    marginTop: 8,
    fontWeight: 500,
  },

  // KBJU banner
  kbjuBanner: {
    margin: "8px 16px 4px",
    background: "#E8F7EC",
    borderRadius: 14,
    padding: "10px 14px",
    flexShrink: 0,
  },
  kbjuTitle: {
    fontSize: 11,
    color: "#21A038",
    fontWeight: 600,
    marginBottom: 8,
  },
  kbjuRow: { display: "flex", justifyContent: "space-between" },
  kbjuItem: { textAlign: "center", flex: 1 },
  kbjuVal: { fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" },
  kbjuLabel: { fontSize: 9, color: "#7A8A85", marginTop: 2, fontWeight: 500 },

  scroll: { flex: 1, overflowY: "auto", padding: "8px 16px 8px" },

  editHint: {
    textAlign: "center",
    fontSize: 11,
    color: "#888",
    padding: "4px 0 10px",
    fontWeight: 500,
    fontStyle: "italic",
  },

  // Meal cards
  mealCard: {
    background: "#F7F5F1",
    borderRadius: 14,
    marginBottom: 8,
    overflow: "hidden",
    transition: "all 0.2s",
    border: "1.5px solid transparent",
  },
  mealCardEditing: {
    background: "#EAF7EE",
    border: "1.5px solid #21A038",
  },
  mealClickable: {
    padding: "12px 14px",
    cursor: "pointer",
  },
  mealHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  mealType: { fontSize: 11, fontWeight: 700, color: "#7A8A85" },
  mealActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  mealKcal: { fontSize: 12, fontWeight: 700, color: "#21A038" },
  editIcon: {
    fontSize: 12,
    color: "#888",
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#E8EEEB",
    borderRadius: 6,
  },
  mealName: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  mealMacros: { fontSize: 11, color: "#7A8A85" },
  removeMealBtn: {
    width: "100%",
    padding: "8px 14px",
    background: "transparent",
    borderTop: "1px solid rgba(33,160,56,0.15)",
    border: "none",
    borderTopStyle: "solid",
    borderTopWidth: 1,
    borderTopColor: "rgba(33,160,56,0.15)",
    fontSize: 12,
    fontWeight: 600,
    color: "#E05A2B",
    cursor: "pointer",
    textAlign: "center",
    fontFamily: "inherit",
  },

  // Alternatives
  altSection: {
    marginBottom: 8,
    marginTop: -4,
  },
  altTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#21A038",
    padding: "0 4px 6px",
  },
  altList: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
  },
  altCard: {
    minWidth: 160,
    maxWidth: 180,
    flexShrink: 0,
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    border: "1.5px solid #E8EEEB",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
  altTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 6,
  },
  altName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1A1A2E",
    lineHeight: 1.3,
    flex: 1,
  },
  altKcal: {
    fontSize: 11,
    fontWeight: 700,
    color: "#21A038",
    flexShrink: 0,
    background: "#E8F7EC",
    padding: "2px 6px",
    borderRadius: 6,
  },
  altMacros: {
    fontSize: 10,
    color: "#888",
  },

  // Shopping
  shoppingBlock: {
    background: "#F7F5F1",
    borderRadius: 14,
    padding: "12px 14px",
    marginBottom: 8,
    marginTop: 4,
  },
  shoppingTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10 },
  shoppingRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingBottom: 8,
    marginBottom: 8,
  },
  shoppingName: { fontSize: 13 },
  shoppingQty: { fontSize: 13, fontWeight: 600, color: "#7A8A85" },

  // Total card
  totalCard: {
    background: "linear-gradient(135deg, #E8F7EC, #C2EAC8)",
    borderRadius: 14,
    padding: "12px 14px",
    marginBottom: 8,
    border: "1px solid #A8DEB0",
  },
  totalHeader: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1A7A30",
    marginBottom: 10,
  },
  totalGrid: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  totalItem: { textAlign: "center", flex: 1 },
  totalNum: {
    fontSize: 16,
    fontWeight: 800,
    color: "#1A7A30",
    letterSpacing: "-0.03em",
  },
  totalLabel: { fontSize: 9, color: "#21A038", marginTop: 2, fontWeight: 500 },
  totalDivider: { width: 1, height: 24, background: "rgba(33,160,56,0.2)" },

  customBadge: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "#E06030",
    background: "#FFF5EE",
    padding: "6px 14px",
    borderRadius: 10,
    marginBottom: 4,
  },

  footer: {
    padding: "12px 16px 28px",
    borderTop: "1px solid #E8EEEB",
    flexShrink: 0,
    background: "#fff",
  },
  confirmBtn: {
    width: "100%",
    padding: 15,
    background: "linear-gradient(135deg,#1D9034,#2BBE4E)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(33,160,56,0.25)",
  },
};
