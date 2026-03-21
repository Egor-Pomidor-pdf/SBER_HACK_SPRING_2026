import React, { type ReactNode } from "react";

type Tab = "profile" | "diary" | "gigaeat" | "progress" | "feed";

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: "profile",
    label: "Профиль",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11"
          cy="8"
          r="3.5"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M3 19c0-4 3.6-7 8-7s8 3 8 7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "diary",
    label: "Дневник",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="3"
          y="3"
          width="16"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M7 8h8M7 12h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "gigaeat",
    label: "GigaEat",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3C7 3 4 6 4 9c0 2.5 1.5 4.5 3.5 5.5V18h7v-3.5C16.5 13.5 18 11.5 18 9c0-3-3-6-7-6z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 18h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "progress",
    label: "Прогресс",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 17l5-5 4 3 5-7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "feed",
    label: "Лента",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="12"
          y="3"
          width="7"
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="3"
          y="12"
          width="7"
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <rect
          x="12"
          y="12"
          width="7"
          height="7"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
];

export default function TabBar({ active, onChange }: Props) {
  return (
    <div style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const isGigaEat = tab.id === "gigaeat";
        return (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(isGigaEat ? styles.gigaEatTab : {}),
            }}
            onClick={() => onChange(tab.id)}
          >
            {isGigaEat ? (
              <div style={styles.gigaEatBtn}>
                <div style={{ color: "#fff" }}>{tab.icon}</div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    color: isActive ? "var(--green)" : "var(--text-muted)",
                  }}
                >
                  {tab.icon}
                </div>
                <span
                  style={{
                    ...styles.tabLabel,
                    color: isActive ? "var(--green)" : "var(--text-muted)",
                  }}
                >
                  {tab.label}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    height: "var(--tab-height)",
    background: "var(--surface)",
    borderTop: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    zIndex: 50,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  tab: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    padding: "8px 0",
    background: "none",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  gigaEatTab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
  },
  gigaEatBtn: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "var(--green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(33,160,56,0.40)",
    marginBottom: 4,
  },
};
