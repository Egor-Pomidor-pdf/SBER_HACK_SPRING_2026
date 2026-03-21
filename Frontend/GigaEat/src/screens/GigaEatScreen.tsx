import React, { useState } from "react";
import type { StoreResult, Restaurant } from "../contracts.ts";
import { getPlan } from "../api/client.ts";
import GigaEatModal from "../components/GigaEatModal";

type Days = 1 | 3 | 7;
type State = "idle" | "loading" | "ready" | "error";

const USER = {
  name: "Никита",
  daily_kcal: 1800,
  protein: 140,
  fat: 60,
  carbs: 180,
  already_eaten_today: 260,
  lat: 55.741, 
  lon: 37.565,
};

export default function GigaEatScreen() {
  const [days, setDays] = useState<Days>(3);
  const [state, setState] = useState<State>("idle");
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showModal, setShowModal] = useState(false);

  async function handleGenerate() {
    setState("loading");
    try {
      const result = await getPlan({
        days,
        daily_kcal: USER.daily_kcal,
        protein: USER.protein,
        fat: USER.fat,
        carbs: USER.carbs,
        already_eaten_today: USER.already_eaten_today,
        lat: USER.lat,
        lon: USER.lon,
      });
      setStores(result.stores);
      setRestaurants(result.restaurants);
      setState("ready");
      setShowModal(true);
    } catch {
      setState("error");
    }
  }

  const remainKcal = USER.daily_kcal - USER.already_eaten_today;

  return (
    <div style={styles.screen}>

      <div style={styles.topBar}>
        <div>
          <div style={styles.greeting}>Привет, {USER.name} 👋</div>
          <div style={styles.subGreeting}>Что будем есть?</div>
        </div>
        <div style={styles.kcalBadge}>
          <span style={styles.kcalNum}>{remainKcal}</span>
          <span style={styles.kcalLabel}> ккал осталось</span>
        </div>
      </div>

      <div style={styles.statsRow}>
        {[
          {
            icon: "🔥",
            label: "Съедено",
            val: `${USER.already_eaten_today} кк`,
          },
          { icon: "💧", label: "Вода", val: "0.4 / 2 л" },
          { icon: "👟", label: "Шаги", val: "3 200" },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <span style={styles.statIcon}>{s.icon}</span>
            <span style={styles.statVal}>{s.val}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={styles.featureCard}>
        <div style={styles.featureTop}>
          <div>
            <div style={styles.featureTitle}>GigaEat</div>
            <div style={styles.featureSubtitle}>
              AI-рацион + ближайшие магазины и рестораны
            </div>
          </div>
          <div style={styles.featureBadge}>AI</div>
        </div>

        
        <div style={styles.daysRow}>
          <span style={styles.daysLabel}>Рацион на:</span>
          <div style={styles.daysToggle}>
            {([1, 3, 7] as Days[]).map((d) => (
              <button
                key={d}
                style={{
                  ...styles.dayBtn,
                  ...(days === d ? styles.dayBtnActive : {}),
                }}
                onClick={() => setDays(d)}
              >
                {d} {d === 1 ? "день" : d < 5 ? "дня" : "дней"}
              </button>
            ))}
          </div>
        </div>

        <button
          style={{
            ...styles.ctaBtn,
            opacity: state === "loading" ? 0.7 : 1,
          }}
          onClick={
            state === "ready" ? () => setShowModal(true) : handleGenerate
          }
          disabled={state === "loading"}
        >
          {state === "loading" ? (
            <span style={styles.ctaBtnContent}>
              <Spinner /> GigaChat думает...
            </span>
          ) : state === "ready" ? (
            "🥗 Смотреть рацион и магазины"
          ) : (
            "⚡ Составить рацион"
          )}
        </button>

        {state === "error" && (
          <div style={styles.errorText}>
            GigaChat не ответил — попробуй ещё раз
          </div>
        )}
      </div>

    
      <div style={styles.tipsSection}>
        <div style={styles.sectionTitle}>Советы дня</div>
        {TIPS.map((tip, i) => (
          <div key={i} style={styles.tipCard}>
            <span style={styles.tipIcon}>{tip.icon}</span>
            <div>
              <div style={styles.tipTitle}>{tip.title}</div>
              <div style={styles.tipBody}>{tip.body}</div>
            </div>
          </div>
        ))}
      </div>

      
      {showModal && (
        <GigaEatModal
          stores={stores}
          restaurants={restaurants}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

const TIPS = [
  {
    icon: "💡",
    title: "Белок первым",
    body: "Начинай с белкового блюда — дольше насыщение",
  },
  { icon: "🥤", title: "2 литра воды", body: "Стакан до каждого приёма пищи" },
];

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid rgba(255,255,255,0.4)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        marginRight: 8,
      }}
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    flex: 1,
    overflowY: "auto",
    padding: "0 0 80px",
    background: "var(--bg)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 20px 16px",
  },
  greeting: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "var(--text-primary)",
  },
  subGreeting: {
    fontSize: 14,
    color: "var(--text-secondary)",
    marginTop: 2,
  },
  kcalBadge: {
    background: "var(--green-light)",
    borderRadius: 10,
    padding: "6px 12px",
    textAlign: "right",
  },
  kcalNum: {
    fontSize: 18,
    fontWeight: 800,
    color: "var(--green)",
  },
  kcalLabel: {
    fontSize: 11,
    color: "var(--green)",
    fontWeight: 500,
  },
  statsRow: {
    display: "flex",
    gap: 10,
    padding: "0 20px 16px",
  },
  statCard: {
    flex: 1,
    background: "var(--surface)",
    borderRadius: 12,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  statIcon: { fontSize: 18 },
  statVal: { fontSize: 12, fontWeight: 700, color: "var(--text-primary)" },
  statLabel: { fontSize: 10, color: "var(--text-muted)" },

  featureCard: {
    margin: "0 16px 16px",
    background: "linear-gradient(135deg, #1D9034 0%, #2BBE4E 100%)",
    borderRadius: 20,
    padding: "20px 18px",
    boxShadow: "0 8px 24px rgba(33,160,56,0.30)",
  },
  featureTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.03em",
  },
  featureSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
    maxWidth: 200,
    lineHeight: 1.4,
  },
  featureBadge: {
    background: "rgba(255,255,255,0.22)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 20,
    letterSpacing: "0.06em",
  },
  daysRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  daysLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: 600,
    flexShrink: 0,
  },
  daysToggle: {
    display: "flex",
    gap: 6,
  },
  dayBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: "rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.75)",
    transition: "all 0.15s",
  },
  dayBtnActive: {
    background: "#fff",
    color: "var(--green)",
  },
  ctaBtn: {
    width: "100%",
    padding: "14px",
    background: "#fff",
    color: "var(--green)",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    transition: "opacity 0.15s",
  },
  ctaBtnContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  tipsSection: {
    padding: "0 16px",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    marginBottom: 10,
  },
  tipCard: {
    background: "var(--surface)",
    borderRadius: 14,
    padding: "12px 14px",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  tipIcon: { fontSize: 22, flexShrink: 0 },
  tipTitle: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  tipBody: { fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 },
};
