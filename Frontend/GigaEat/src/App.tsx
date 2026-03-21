import GigaEatScreen from "./components/GigaEatScreen";

export default function App() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <GigaEatScreen />
    </>
  );
}
