import { useState } from "react";
import TabBar from "./components/TabBar";
import GigaEatScreen from "./screens/GigaEatScreen";
import FeedScreen from "./screens/FeedScreen";

type Tab = "profile" | "diary" | "gigaeat" | "progress" | "feed";

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 20, paddingTop: 60 }}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
        Раздел в разработке
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("gigaeat");

  const screen = {
    profile: <Placeholder title="Профиль" />,
    diary: <Placeholder title="Дневник" />,
    gigaeat: <GigaEatScreen />,
    progress: <Placeholder title="Прогресс" />,
    feed: <FeedScreen />,
  }[tab];

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ flex: 1, overflowY: "auto" }}>{screen}</div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
