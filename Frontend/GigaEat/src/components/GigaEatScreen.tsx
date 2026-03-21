import { useState } from "react";
import type {
  StoreResult,
  Restaurant,
  MealPlan,
  UserPreferences,
} from "../contracts";
import { getPlan } from "../api/client";
import PreferencesModal from "./PreferencesModal";
import RationPreviewModal from "./RationPreviewModal";
import GigaEatModal from "./GigaEatModal";
import OrderHistoryModal from "./OrderHistoryModal";

type AppState = "idle" | "prefs" | "loading" | "ration" | "stores" | "error";

const USER = {
  name: "Никита",
  daily_kcal: 2200,
  protein: 60,
  fat: 60,
  carbs: 300,
  lat: 55.741,
  lon: 37.565,
};

interface MealEntry { name: string; kbju: string; kcal: number; protein: number; fat: number; carbs: number }
interface DayMeal { icon: string; label: string; time?: string; items: MealEntry[] }
interface DayData {
  meals: DayMeal[];
  water: number; // литры выпито
  waterGoal: number;
  activity: number; // ккал сожжено
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAYS_DATA: Record<string, DayData> = {
  "2026-03-21": {
    meals: [
      { icon: "🌅", label: "Завтрак", time: "08:30", items: [
        { name: "Овсяная каша с ягодами", kbju: "320 кк · Б10 · Ж6 · У54", kcal: 320, protein: 10, fat: 6, carbs: 54 },
        { name: "Греческий йогурт", kbju: "60 кк · Б5 · Ж0 · У9", kcal: 60, protein: 5, fat: 0, carbs: 9 },
      ]},
    ],
    water: 0.5, waterGoal: 2.0, activity: 0,
  },
  "2026-03-20": {
    meals: [
      { icon: "🌅", label: "Завтрак", time: "09:00", items: [
        { name: "Творожная запеканка", kbju: "280 кк · Б16 · Ж10 · У30", kcal: 280, protein: 16, fat: 10, carbs: 30 },
      ]},
      { icon: "☀️", label: "Обед", time: "13:15", items: [
        { name: "Борщ с говядиной", kbju: "420 кк · Б28 · Ж12 · У44", kcal: 420, protein: 28, fat: 12, carbs: 44 },
      ]},
      { icon: "🌙", label: "Ужин", time: "19:30", items: [
        { name: "Салат Цезарь с курицей", kbju: "350 кк · Б24 · Ж18 · У22", kcal: 350, protein: 24, fat: 18, carbs: 22 },
      ]},
    ],
    water: 1.8, waterGoal: 2.0, activity: 240,
  },
  "2026-03-19": {
    meals: [],
    water: 0, waterGoal: 2.0, activity: 0,
  },
  "2026-03-18": {
    meals: [
      { icon: "🌅", label: "Завтрак", time: "08:00", items: [
        { name: "Яичница с авокадо", kbju: "340 кк · Б18 · Ж22 · У12", kcal: 340, protein: 18, fat: 22, carbs: 12 },
      ]},
      { icon: "☀️", label: "Обед", time: "13:00", items: [
        { name: "Паста с индейкой", kbju: "520 кк · Б32 · Ж14 · У62", kcal: 520, protein: 32, fat: 14, carbs: 62 },
      ]},
      { icon: "🍎", label: "Перекус", time: "16:00", items: [
        { name: "Протеиновый батончик", kbju: "180 кк · Б20 · Ж6 · У14", kcal: 180, protein: 20, fat: 6, carbs: 14 },
      ]},
      { icon: "🌙", label: "Ужин", time: "19:00", items: [
        { name: "Тунец с овощами гриль", kbju: "380 кк · Б34 · Ж12 · У24", kcal: 380, protein: 34, fat: 12, carbs: 24 },
      ]},
    ],
    water: 2.0, waterGoal: 2.0, activity: 420,
  },
  "2026-03-17": {
    meals: [
      { icon: "🌅", label: "Завтрак", time: "08:15", items: [
        { name: "Сырники со сметаной", kbju: "310 кк · Б16 · Ж12 · У34", kcal: 310, protein: 16, fat: 12, carbs: 34 },
      ]},
      { icon: "☀️", label: "Обед", time: "12:45", items: [
        { name: "Гречка с тефтелями", kbju: "490 кк · Б30 · Ж16 · У52", kcal: 490, protein: 30, fat: 16, carbs: 52 },
      ]},
      { icon: "🍎", label: "Перекус", time: "15:30", items: [
        { name: "Яблоко и миндаль", kbju: "150 кк · Б4 · Ж10 · У14", kcal: 150, protein: 4, fat: 10, carbs: 14 },
      ]},
      { icon: "🌙", label: "Ужин", time: "19:45", items: [
        { name: "Куриный суп-лапша", kbju: "280 кк · Б22 · Ж6 · У30", kcal: 280, protein: 22, fat: 6, carbs: 30 },
      ]},
    ],
    water: 1.5, waterGoal: 2.0, activity: 180,
  },
  "2026-03-16": {
    meals: [
      { icon: "🌅", label: "Завтрак", time: "09:30", items: [
        { name: "Мюсли с молоком", kbju: "290 кк · Б8 · Ж6 · У52", kcal: 290, protein: 8, fat: 6, carbs: 52 },
      ]},
      { icon: "☀️", label: "Обед", time: "13:30", items: [
        { name: "Плов с курицей", kbju: "450 кк · Б26 · Ж14 · У50", kcal: 450, protein: 26, fat: 14, carbs: 50 },
      ]},
      { icon: "🌙", label: "Ужин", time: "19:00", items: [
        { name: "Рыбные котлеты с рисом", kbju: "370 кк · Б24 · Ж10 · У42", kcal: 370, protein: 24, fat: 10, carbs: 42 },
      ]},
    ],
    water: 1.2, waterGoal: 2.0, activity: 310,
  },
};

const EMPTY_DAY: DayData = { meals: [], water: 0, waterGoal: 2.0, activity: 0 };

const LEVELS = [0, 50, 150, 350, 600, 1000, 1500, 2500];
const LEVEL_NAMES = [
  "",
  "Новичок",
  "Осознанный",
  "Практикующий",
  "Дисциплинированный",
  "Опытный",
  "Мастер ЗОЖ",
  "Гуру здоровья",
  "Легенда",
];

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function GigaEatScreen() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [showAch, setShowAch] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 21)); // March 21, 2026

  const today = new Date(2026, 2, 21);
  const isToday = selectedDate.toDateString() === today.toDateString();

  function prevDay() {
    setSelectedDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 1);
      return n;
    });
  }
  function nextDay() {
    setSelectedDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 1);
      if (n > today) return d;
      return n;
    });
  }

  const MONTHS_RU = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ];
  const dateLabel = `${selectedDate.getDate()} ${MONTHS_RU[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  // ─── Derive all data from selected day ─────────────────────────────────────
  const dayData = DAYS_DATA[toKey(selectedDate)] ?? EMPTY_DAY;
  const allItems = dayData.meals.flatMap((m) => m.items);
  const eatenKcal = allItems.reduce((s, it) => s + it.kcal, 0);
  const eatenProtein = allItems.reduce((s, it) => s + it.protein, 0);
  const eatenFat = allItems.reduce((s, it) => s + it.fat, 0);
  const eatenCarbs = allItems.reduce((s, it) => s + it.carbs, 0);
  const remainKcal = USER.daily_kcal - eatenKcal;
  const kcalPct = Math.min((eatenKcal / USER.daily_kcal) * 100, 100);
  const waterFilled = Math.round(dayData.water / dayData.waterGoal * 5);

  // Build unfilled meal slots for the day
  const filledTypes = new Set(dayData.meals.map((m) => m.label));
  const ALL_SLOTS: { icon: string; label: string }[] = [
    { icon: "🌅", label: "Завтрак" },
    { icon: "☀️", label: "Обед" },
    { icon: "🌙", label: "Ужин" },
  ];

  async function handlePrefsConfirm(prefs: UserPreferences) {
    setAppState("loading");
    try {
      const result = await getPlan({
        days: 1,
        daily_kcal: USER.daily_kcal,
        protein: USER.protein,
        fat: USER.fat,
        carbs: USER.carbs,
        already_eaten_today: eatenKcal,
        lat: USER.lat,
        lon: USER.lon,
        preferences: prefs,
      });
      setStores(result.stores);
      setRestaurants(result.restaurants);
      setPlan(result.plan);
      setAppState("ration");
    } catch {
      setAppState("error");
    }
  }

  return (
    <div style={s.screen}>
      {/* Handle */}
      <div style={s.handleWrap}>
        <div style={s.handle} />
      </div>

      {/* Header */}
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Дашборд</h1>
        <button style={s.closeBtn}>✕</button>
      </div>

      {/* Date nav */}
      <div style={s.dateNav}>
        <button style={s.dateArrow} onClick={prevDay}>‹</button>
        <div style={s.dateCenter} onClick={() => setShowCal(true)}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={s.dateText}>{dateLabel}</span>
          {isToday && <span style={s.dateBadge}>Сегодня</span>}
        </div>
        <button
          style={{ ...s.dateArrow, opacity: isToday ? 0.3 : 1 }}
          onClick={nextDay}
          disabled={isToday}
        >›</button>
      </div>

      {/* Calories ring card */}
      <div
        style={{ ...s.card, display: "flex", alignItems: "center", gap: 20 }}
      >
        <div style={s.ringWrap}>
          <svg
            viewBox="0 0 100 100"
            style={{
              width: "100%",
              height: "100%",
              transform: "rotate(-90deg)",
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#EDEAE4"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E06030"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(kcalPct / 100) * 251.2} 251.2`}
            />
          </svg>
          <div style={s.ringLabel}>
            <div style={s.ringNum}>{eatenKcal}</div>
            <div style={s.ringUnit}>ккал</div>
          </div>
        </div>
        <div>
          <div style={s.calTitle}>Калории</div>
          <div style={s.calRemain}>
            осталось{" "}
            <span style={s.calOrange}>{remainKcal.toLocaleString("ru")}</span>
          </div>
          <div style={s.calGoal}>
            Цель: {USER.daily_kcal.toLocaleString("ru")} ккал
          </div>
        </div>
      </div>

      {/* Macros */}
      <div style={s.macrosGrid}>
        {[
          { label: "Углеводы", val: eatenCarbs, max: USER.carbs, color: "#E06030" },
          { label: "Белки", val: eatenProtein, max: USER.protein, color: "#21A038" },
          { label: "Жиры", val: eatenFat, max: USER.fat, color: "#F5C842" },
        ].map((m) => (
          <div key={m.label} style={{ ...s.card, ...s.macroCard }}>
            <div style={s.macroLabel}>{m.label}</div>
            <div style={s.macroBarWrap}>
              <div
                style={{
                  ...s.macroBarFill,
                  background: m.color,
                  width: `${Math.min((m.val / m.max) * 100, 100)}%`,
                }}
              />
            </div>
            <div style={s.macroVal}>
              <span style={s.macroNum}>{m.val}</span> / {m.max} г
            </div>
          </div>
        ))}
      </div>

      {/* Achievements button */}
      <button style={s.achievBtn} onClick={() => setShowAch(true)}>
        <div style={s.achievLeft}>
          <span style={{ fontSize: 26 }}>🏆</span>
          <div>
            <div style={s.achievTitle}>Достижения</div>
            <div style={s.achievSub}>Уровень 2 · 85 / 150 XP · 🔥 3 дня</div>
          </div>
        </div>
        <div style={s.achievRight}>
          <span style={s.achievCount}>5/20</span>
          <span style={s.achievArrow}>›</span>
        </div>
      </button>

      {/* History button */}
      <button style={s.historyBtn} onClick={() => setShowHistory(true)}>
        <div style={s.achievLeft}>
          <span style={{ fontSize: 26 }}>📋</span>
          <div>
            <div style={s.historyTitle}>История заказов</div>
            <div style={s.historySub}>Календарь питания и покупок</div>
          </div>
        </div>
        <div style={s.achievRight}>
          <span style={s.achievArrow}>›</span>
        </div>
      </button>

      {/* Water + Activity */}
      <div style={s.waGrid}>
        <div style={{ ...s.card, ...s.waterCard, margin: 0 }}>
          <div style={s.waterTitle}>💧 Вода</div>
          <div style={s.waterVal}>
            <span style={s.waterNum}>{dayData.water.toFixed(1)}</span> / {dayData.waterGoal.toFixed(1)} л
          </div>
          <div style={s.drops}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{ opacity: i <= waterFilled ? 1 : 0.3, fontSize: 14 }}>
                💧
              </span>
            ))}
          </div>
        </div>
        <div style={{ ...s.card, margin: 0 }}>
          <div style={s.actTitle}>🚶 Активность</div>
          <div style={s.actVal}>{dayData.activity}</div>
          <div style={s.actUnit}>ккал</div>
          <div style={s.macroBarWrap}>
            <div style={{ ...s.macroBarFill, background: "#21A038", width: `${Math.min((dayData.activity / 500) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Meals section */}
      <div style={s.sectionTitle}>Приёмы пищи</div>

      {dayData.meals.map((meal, mi) => {
        const mealKcal = meal.items.reduce((s, it) => s + it.kcal, 0);
        const mealP = meal.items.reduce((s, it) => s + it.protein, 0);
        const mealF = meal.items.reduce((s, it) => s + it.fat, 0);
        const mealC = meal.items.reduce((s, it) => s + it.carbs, 0);
        return (
          <MealCard
            key={`${meal.label}-${mi}`}
            id={`${meal.label}-${mi}`}
            icon={meal.icon}
            label={meal.label}
            time={meal.time}
            filled
            kbjuShort={`${mealKcal} ккал · Б${mealP} · Ж${mealF} · У${mealC}`}
            items={meal.items.map((it) => ({ name: it.name, kbju: it.kbju }))}
            total={`${mealKcal} ккал · Б${mealP} г · Ж${mealF} г · У${mealC} г`}
          />
        );
      })}
      {ALL_SLOTS.filter((sl) => !filledTypes.has(sl.label)).map((sl) => (
        <MealCard key={sl.label} id={sl.label} icon={sl.icon} label={sl.label} filled={false} />
      ))}

      {/* GigaEat CTA */}
      <button
        style={{ ...s.rationBtn, opacity: appState === "loading" ? 0.75 : 1 }}
        onClick={() =>
          appState === "idle" || appState === "error"
            ? setAppState("prefs")
            : undefined
        }
        disabled={appState === "loading"}
      >
        {appState === "loading" ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Spinner />
            GigaChat составляет рацион...
          </span>
        ) : (
          "⚡ Составить рацион на день"
        )}
      </button>
      {appState === "error" && (
        <div style={s.errText}>GigaChat не ответил — попробуй ещё раз</div>
      )}

      {/* ── Modals ── */}
      {appState === "prefs" && (
        <PreferencesModal
          onConfirm={handlePrefsConfirm}
          onClose={() => setAppState("idle")}
        />
      )}
      {appState === "ration" && plan && (
        <RationPreviewModal
          plan={plan}
          remainKcal={Math.max(0, remainKcal)}
          remainProtein={Math.max(0, USER.protein - eatenProtein)}
          remainFat={Math.max(0, USER.fat - eatenFat)}
          remainCarbs={Math.max(0, USER.carbs - eatenCarbs)}
          onConfirm={() => setAppState("stores")}
          onClose={() => setAppState("idle")}
        />
      )}
      {appState === "stores" && (
        <GigaEatModal
          stores={stores}
          restaurants={restaurants}
          onClose={() => setAppState("idle")}
        />
      )}
      {showAch && <AchievementsModal onClose={() => setShowAch(false)} />}
      {showCal && <CalendarModal onClose={() => setShowCal(false)} />}
      {showHistory && (
        <OrderHistoryModal
          userId="550e8400-e29b-41d4-a716-446655440000"
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

interface MealItem {
  name: string;
  kbju: string;
}
interface MealCardProps {
  id: string;
  icon: string;
  label: string;
  filled?: boolean;
  time?: string;
  kbjuShort?: string;
  items?: MealItem[];
  total?: string;
}

function MealCard({
  id,
  icon,
  label,
  filled = false,
  time,
  kbjuShort,
  items = [],
  total,
}: MealCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        ...s.mealCard,
        background: filled ? "#fff" : "#F7F5F1",
        border: filled ? "none" : "1.5px dashed #D4D0C8",
        boxShadow: filled ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
      }}
    >
      <div style={s.mealHeader} onClick={() => setOpen(!open)}>
        <div style={s.mealLeft}>
          <span style={{ fontSize: 22, opacity: filled ? 1 : 0.4 }}>
            {icon}
          </span>
          <div>
            <div
              style={{ ...s.mealName, color: filled ? "#1A1A2E" : "#B0ACA4" }}
            >
              {label}
            </div>
            <div
              style={{ ...s.mealKbjuShort, color: filled ? "#888" : "#C0BDB5" }}
            >
              {filled ? kbjuShort : "— ккал"}
            </div>
          </div>
        </div>
        <div style={s.mealRight}>
          {time && <span style={s.mealTime}>{time}</span>}
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              transition: "transform 0.22s",
              transform: open ? "rotate(180deg)" : "none",
              flexShrink: 0,
            }}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke={filled ? "#888" : "#C0C0C0"}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {open && (
        <div style={s.mealBody}>
          <div
            style={{
              height: 1,
              background: filled ? "#F0EDE8" : "#E8E4DC",
              marginBottom: 12,
            }}
          />
          {filled ? (
            <>
              {items.map((item, i) => (
                <div key={i} style={s.mealItem}>
                  <div style={s.mealItemName}>{item.name}</div>
                  <div style={s.mealItemKbju}>{item.kbju}</div>
                </div>
              ))}
              <div style={s.mealTotal}>{total}</div>
            </>
          ) : (
            <div style={s.mealEmptyText}>Пока пусто (</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CalendarModal ────────────────────────────────────────────────────────────

function CalendarModal({ onClose }: { onClose: () => void }) {
  type DayState = "done" | "frozen" | "empty" | "future" | "today";
  const days: { n: number | null; state: DayState }[] = [
    { n: null, state: "empty" },
    { n: null, state: "empty" },
    { n: null, state: "empty" },
    { n: null, state: "empty" },
    { n: null, state: "empty" },
    { n: 1, state: "empty" },
    { n: 2, state: "empty" },
    { n: 3, state: "empty" },
    { n: 4, state: "empty" },
    { n: 5, state: "empty" },
    { n: 6, state: "empty" },
    { n: 7, state: "empty" },
    { n: 8, state: "empty" },
    { n: 9, state: "empty" },
    { n: 10, state: "done" },
    { n: 11, state: "done" },
    { n: 12, state: "done" },
    { n: 13, state: "done" },
    { n: 14, state: "done" },
    { n: 15, state: "done" },
    { n: 16, state: "done" },
    { n: 17, state: "done" },
    { n: 18, state: "done" },
    { n: 19, state: "frozen" },
    { n: 20, state: "empty" },
    { n: 21, state: "today" },
    { n: 22, state: "future" },
    { n: 23, state: "future" },
    { n: 24, state: "future" },
    { n: 25, state: "future" },
    { n: 26, state: "future" },
    { n: 27, state: "future" },
    { n: 28, state: "future" },
    { n: 29, state: "future" },
    { n: 30, state: "future" },
    { n: 31, state: "future" },
  ];

  const dayStyle = (state: DayState): React.CSSProperties => ({
    aspectRatio: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    fontSize: 12,
    fontWeight: 600,
    background:
      state === "done" || state === "today"
        ? "#21A038"
        : state === "frozen"
          ? "#C8E8F5"
          : "transparent",
    color:
      state === "done" || state === "today"
        ? "#fff"
        : state === "frozen"
          ? "#1F89DC"
          : state === "future"
            ? "#C0BDB5"
            : "#B0ACA4",
    outline: state === "today" ? "3px solid #E06030" : "none",
    outlineOffset: 1,
    
  });

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.sheet}>
        <div style={s.sheetHandleWrap}>
          <div style={s.sheetHandle} />
        </div>
        <div style={s.sheetHeader}>
          <div style={s.sheetTitle}>🔥 Ваш стрик</div>
          <button style={s.sheetClose} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "16px 20px 10px",
          }}
        >
          {[
            { num: "3", label: "текущий стрик", orange: true },
            { num: "14", label: "лучший стрик", orange: false },
            { num: "1", label: "заморозка", orange: false },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: stat.orange ? "#E06030" : "#1A1A2E",
                  letterSpacing: "-0.03em",
                }}
              >
                {stat.num}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress to next badge */}
        <div style={{ padding: "0 18px 14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#888",
              marginBottom: 6,
            }}
          >
            <span>До «Неделя силы» 🔥</span>
            <span style={{ fontWeight: 700, color: "#E06030" }}>
              3 / 7 дней
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "#EDEAE4",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "43%",
                background: "linear-gradient(90deg,#E06030,#F5A623)",
                borderRadius: 3,
              }}
            />
          </div>
        </div>

        {/* Calendar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 18px 10px",
          }}
        >
          <button
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: "#888",
              cursor: "pointer",
            }}
          >
            ‹
          </button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Март 2026</span>
          <button
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: "#888",
              cursor: "pointer",
            }}
          >
            ›
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 4,
            padding: "0 14px 12px",
          }}
        >
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "#888",
                fontWeight: 600,
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}
          {days.map((d, i) => (
            <div key={i} style={dayStyle(d.state)}>
              {d.state === "frozen" ? "❄️" : (d.n ?? "")}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            padding: "4px 0 20px",
          }}
        >
          {[
            {
              dot: {
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#21A038",
                display: "inline-block",
              },
              label: "Рацион составлен",
            },
            {
              dot: {
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#C8E8F5",
                display: "inline-block",
                fontSize: 9,
                textAlign: "center" as const,
                lineHeight: "14px",
              },
              label: "Заморозка",
              emoji: "❄️",
            },
            {
              dot: {
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#EDEAE4",
                display: "inline-block",
              },
              label: "Пропуск",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "#888",
              }}
            >
              <div style={item.dot}>{item.emoji ?? ""}</div>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── AchievementsModal ────────────────────────────────────────────────────────

function AchievementsModal({ onClose }: { onClose: () => void }) {
  const categories = [
    {
      title: "🥗 Питание",
      items: [
        {
          icon: "🥗",
          name: "Первый шаг",
          desc: "Сгенерировать первый рацион",
          xp: 10,
          state: "done" as const,
        },
        {
          icon: "📅",
          name: "Неделя осознанности",
          desc: "7 рационов за всё время",
          xp: 25,
          state: "done" as const,
        },
        {
          icon: "💪",
          name: "Месяц дисциплины",
          desc: "30 рационов",
          xp: 100,
          state: "progress" as const,
          prog: 11,
          total: 30,
        },
        {
          icon: "👑",
          name: "Мастер питания",
          desc: "100 рационов",
          xp: 500,
          state: "locked" as const,
        },
      ],
    },
    {
      title: "🔥 Стрики",
      items: [
        {
          icon: "🔥",
          name: "Разгон",
          desc: "Стрик 3 дня",
          xp: 15,
          state: "done" as const,
        },
        {
          icon: "🔥",
          name: "Неделя силы",
          desc: "Стрик 7 дней",
          xp: 50,
          state: "progress" as const,
          prog: 3,
          total: 7,
        },
        {
          icon: "🏆",
          name: "Железная воля",
          desc: "Стрик 30 дней",
          xp: 300,
          state: "locked" as const,
        },
      ],
    },
    {
      title: "🛒 Покупки",
      items: [
        {
          icon: "🛒",
          name: "Шопоголик ЗОЖ",
          desc: "Первая корзина в Купере",
          xp: 15,
          state: "done" as const,
        },
        {
          icon: "🛍️",
          name: "Постоянный покупатель",
          desc: "5 корзин",
          xp: 50,
          state: "progress" as const,
          prog: 2,
          total: 5,
        },
      ],
    },
    {
      title: "🎯 Цели",
      items: [
        {
          icon: "🎯",
          name: "Цель поставлена",
          desc: "Заполнен профиль с целью",
          xp: 5,
          state: "done" as const,
        },
        {
          icon: "⚖️",
          name: "Первый результат",
          desc: "Первое изменение веса",
          xp: 100,
          state: "locked" as const,
        },
      ],
    },
  ];

  const bg: Record<string, string> = {
    done: "#F0FAF2",
    progress: "#FFF8E6",
    locked: "#F7F5F1",
  };
  const border: Record<string, string> = {
    done: "1.5px solid #C2EAC8",
    progress: "1.5px solid #F5E190",
    locked: "none",
  };

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={{ ...s.sheet, maxHeight: "90dvh" }}>
        <div style={s.sheetHandleWrap}>
          <div style={s.sheetHandle} />
        </div>
        <div style={s.sheetHeader}>
          <div style={s.sheetTitle}>🏆 Достижения</div>
          <button style={s.sheetClose} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Level + XP */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px 8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#F5C842,#E8A020)",
                color: "#fff",
                fontSize: 18,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              2
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Осознанный</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                85 / 150 XP до уровня 3
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#B07A10",
              background: "#FFF3D0",
              padding: "6px 12px",
              borderRadius: 20,
            }}
          >
            12 / 20 🏅
          </div>
        </div>
        <div style={{ padding: "0 18px 14px" }}>
          <div
            style={{
              height: 6,
              background: "#EDEAE4",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "57%",
                background: "linear-gradient(90deg,#F5C842,#E8A020)",
                borderRadius: 3,
              }}
            />
          </div>
        </div>

        {/* Achievement list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 24px" }}>
          {categories.map((cat) => (
            <div key={cat.title}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#888",
                  letterSpacing: "0.04em",
                  padding: "12px 4px 8px",
                  borderBottom: "1px solid #F0EDE8",
                  marginBottom: 8,
                }}
              >
                {cat.title}
              </div>
              {cat.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: bg[item.state],
                    border: border[item.state],
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 8,
                    opacity: item.state === "locked" ? 0.55 : 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      flexShrink: 0,
                      filter: item.state === "locked" ? "grayscale(1)" : "none",
                    }}
                  >
                    {item.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: item.state === "locked" ? "#888" : "#1A1A2E",
                        marginBottom: 2,
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#888" }}>
                      {item.desc}
                    </div>
                    {"prog" in item && item.prog !== undefined && (
                      <>
                        <div
                          style={{
                            height: 4,
                            background: "#E8E4DC",
                            borderRadius: 2,
                            margin: "6px 0 3px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.round((item.prog / item.total!) * 100)}%`,
                              background: "#F5C842",
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#B07A10",
                            fontWeight: 600,
                          }}
                        >
                          {item.prog} / {item.total}
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: item.state === "done" ? "#21A038" : "#888",
                        background:
                          item.state === "done" ? "#E8F7EC" : "#EDEAE4",
                        padding: "3px 8px",
                        borderRadius: 20,
                      }}
                    >
                      +{item.xp} XP
                    </span>
                    {item.state === "done" && (
                      <span
                        style={{
                          fontSize: 14,
                          color: "#21A038",
                          fontWeight: 800,
                        }}
                      >
                        ✓
                      </span>
                    )}
                    {item.state === "locked" && (
                      <span style={{ fontSize: 14 }}>🔒</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 15,
        height: 15,
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  screen: {
    flex: 1,
    overflowY: "auto",
    padding: "0 0 88px",
    background: "#EDEAE4",
  },
  handleWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "12px 0 4px",
  },
  handle: { width: 40, height: 5, background: "#D0CCC4", borderRadius: 3 },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px 16px",
  },
  pageTitle: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#E0DDD7",
    border: "none",
    fontSize: 16,
    color: "#888",
    cursor: "pointer",
  },

  dateNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fff",
    borderRadius: 14,
    margin: "0 16px 14px",
    padding: "12px 16px",
  },
  dateArrow: {
    background: "none",
    border: "none",
    fontSize: 22,
    color: "#888",
    cursor: "pointer",
    padding: "0 6px",
  },
  dateCenter: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  dateText: { fontSize: 15, fontWeight: 700 },
  dateBadge: {
    background: "#FDEEE6",
    color: "#E06030",
    fontSize: 12,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
  },

  card: {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    margin: "0 16px 12px",
  },
  ringWrap: { position: "relative", width: 100, height: 100, flexShrink: 0 },
  ringLabel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  ringNum: { fontSize: 22, fontWeight: 800 },
  ringUnit: { fontSize: 11, color: "#888", marginTop: 1 },
  calTitle: { fontSize: 13, color: "#888", marginBottom: 4 },
  calRemain: { fontSize: 15, fontWeight: 600, marginBottom: 4 },
  calOrange: { color: "#E06030", fontWeight: 800, fontSize: 18 },
  calGoal: { fontSize: 12, color: "#888" },

  macrosGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    padding: "0 16px",
    marginBottom: 12,
  },
  macroCard: { margin: 0, padding: 14 },
  macroLabel: { fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 500 },
  macroBarWrap: {
    height: 4,
    background: "#EDEAE4",
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  macroBarFill: { height: "100%", background: "#E06030", borderRadius: 2 },
  macroVal: { fontSize: 13, color: "#888" },
  macroNum: { fontSize: 18, fontWeight: 800, color: "#1A1A2E" },

  achievBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "calc(100% - 32px)",
    margin: "0 16px 12px",
    padding: "14px 16px",
    background: "linear-gradient(135deg,#fff8e6,#fff3d0)",
    border: "1.5px solid #F5C842",
    borderRadius: 18,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  achievLeft: { display: "flex", alignItems: "center", gap: 12 },
  achievTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#1A1A2E",
    marginBottom: 2,
  },
  achievSub: { fontSize: 11, color: "#B07A10", fontWeight: 500 },
  achievRight: { display: "flex", alignItems: "center", gap: 8 },

  historyBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "calc(100% - 32px)",
    margin: "0 16px 12px",
    padding: "14px 16px",
    background: "linear-gradient(135deg,#EEF6FF,#E0EFFF)",
    border: "1.5px solid #89BFF5",
    borderRadius: 18,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#1A1A2E",
    marginBottom: 2,
  },
  historySub: { fontSize: 11, color: "#4A90D9", fontWeight: 500 },
  achievCount: {
    background: "#F5C842",
    color: "#7A4F00",
    fontSize: 12,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 20,
  },
  achievArrow: { fontSize: 20, color: "#B07A10", fontWeight: 700 },

  waGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    padding: "0 16px",
    marginBottom: 20,
  },
  waterCard: {
    background: "linear-gradient(145deg,#42AAEA,#1F89DC)",
    color: "#fff",
  },
  waterTitle: { fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 6 },
  waterVal: { fontSize: 13, marginBottom: 8 },
  waterNum: { fontSize: 26, fontWeight: 800 },
  drops: { display: "flex", gap: 4 },
  actTitle: { fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 8 },
  actVal: { fontSize: 28, fontWeight: 800 },
  actUnit: { fontSize: 12, color: "#888", marginTop: 2 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    padding: "0 20px",
    marginBottom: 10,
  },

  mealCard: { borderRadius: 18, margin: "0 16px 10px", overflow: "hidden" },
  mealHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    cursor: "pointer",
    userSelect: "none",
  },
  mealLeft: { display: "flex", alignItems: "center", gap: 12 },
  mealName: { fontSize: 15, fontWeight: 700, marginBottom: 2 },
  mealKbjuShort: { fontSize: 11 },
  mealRight: { display: "flex", alignItems: "center", gap: 8 },
  mealTime: { fontSize: 12, color: "#888", fontWeight: 500 },
  mealBody: { padding: "0 16px 14px" },
  mealItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "7px 0",
    borderBottom: "1px solid #F5F2EE",
  },
  mealItemName: { fontSize: 13, fontWeight: 600 },
  mealItemKbju: { fontSize: 11, color: "#888", marginLeft: 8, flexShrink: 0 },
  mealTotal: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: 700,
    color: "#E06030",
    background: "#FDEEE6",
    padding: "8px 12px",
    borderRadius: 10,
  },
  mealEmptyText: {
    fontSize: 13,
    color: "#B0ACA4",
    textAlign: "center",
    padding: "4px 0 6px",
    fontStyle: "italic",
  },

  rationBtn: {
    display: "block",
    width: "calc(100% - 32px)",
    margin: "8px 16px 0",
    padding: 16,
    background: "linear-gradient(135deg,#1D9034,#2BBE4E)",
    color: "#fff",
    border: "none",
    borderRadius: 16,
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(33,160,56,0.30)",
  },
  errText: {
    textAlign: "center",
    fontSize: 12,
    color: "#E06030",
    padding: "8px 16px 0",
  },

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
    maxHeight: "80dvh",
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    zIndex: 101,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  sheetHandleWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "10px 0 4px",
    flexShrink: 0,
  },
  sheetHandle: { width: 36, height: 4, background: "#E0DDD7", borderRadius: 2 },
  sheetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 18px 14px",
    borderBottom: "1px solid #F0EDE8",
    flexShrink: 0,
  },
  sheetTitle: { fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" },
  sheetClose: {
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
};
