import { useState } from "react";
import type { UserPreferences } from "../contracts";

interface Props {
  onConfirm: (prefs: UserPreferences) => void;
  onClose: () => void;
}

type Step = "intro" | "form";

export default function PreferencesModal({ onConfirm, onClose }: Props) {
  const [step, setStep] = useState<Step>("intro");
  const [hasAllergy, setHasAllergy] = useState<boolean | null>(null);
  const [allergies, setAllergies] = useState("");
  const [hasIntolerance, setHasIntolerance] = useState<boolean | null>(null);
  const [intolerances, setIntolerances] = useState("");
  const [disliked, setDisliked] = useState("");

  function handleSubmit() {
    onConfirm({
      allergies: hasAllergy ? allergies : "",
      intolerances: hasIntolerance ? intolerances : "",
      disliked,
    });
  }

  // ─── Intro screen ─────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <>
        <div style={s.overlay} onClick={onClose} />
        <div style={s.introSheet}>
          <div style={s.handleWrap}>
            <div style={s.handle} />
          </div>

          {/* Close */}
          <button style={s.introClose} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="#7A8A85" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Illustration */}
          <div style={s.introIllustration}>
            <div style={s.introEmojiRing}>
              <span style={s.introMainEmoji}>🍽️</span>
            </div>
            <div style={s.introOrbit}>
              {["🥗", "🥩", "🥛", "🍎", "🥚", "🥑"].map((e, i) => (
                <span
                  key={i}
                  style={{
                    ...s.orbitEmoji,
                    transform: `rotate(${i * 60}deg) translateY(-52px) rotate(-${i * 60}deg)`,
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Text */}
          <div style={s.introContent}>
            <h2 style={s.introTitle}>
              Персональный рацион{"\n"}от GigaChat
            </h2>
            <p style={s.introDesc}>
              Расскажите нам о своих предпочтениях, аллергиях и ограничениях в питании,
              чтобы мы составили <span style={s.introAccent}>идеальный рацион</span> именно для вас
            </p>

            {/* Features */}
            <div style={s.featuresList}>
              {[
                { icon: "🧠", text: "ИИ учитывает ваши особенности" },
                { icon: "🛡️", text: "Безопасный рацион без аллергенов" },
                { icon: "🎯", text: "Точный подбор под ваши КБЖУ" },
              ].map((f, i) => (
                <div key={i} style={s.featureRow}>
                  <span style={s.featureIcon}>{f.icon}</span>
                  <span style={s.featureText}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={s.introFooter}>
            <button style={s.introCta} onClick={() => setStep("form")}>
              Заполнить анкету
            </button>
            <button style={s.introSkip} onClick={() => onConfirm({ allergies: "", intolerances: "", disliked: "" })}>
              Пропустить и составить рацион
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Form screen ──────────────────────────────────────────────────────────
  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.sheet}>
        <div style={s.handleWrap}>
          <div style={s.handle} />
        </div>

        <div style={s.header}>
          <button style={s.backBtn} onClick={() => setStep("intro")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="#7A8A85" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={s.headerTitle}>Ваша анкета</div>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="#7A8A85" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div style={s.progressWrap}>
          <div style={s.progressBar}>
            <div style={{
              ...s.progressFill,
              width: `${((hasAllergy !== null ? 1 : 0) + (hasIntolerance !== null ? 1 : 0) + (disliked ? 1 : 0)) / 3 * 100}%`,
            }} />
          </div>
          <div style={s.progressLabel}>
            {((hasAllergy !== null ? 1 : 0) + (hasIntolerance !== null ? 1 : 0) + (disliked ? 1 : 0))}/3 заполнено
          </div>
        </div>

        <div style={s.scroll}>
          {/* ── 1. Allergies ── */}
          <div style={s.block}>
            <div style={s.blockHeader}>
              <span style={s.blockIcon}>🛡️</span>
              <div>
                <div style={s.question}>Есть ли у вас аллергия на продукты?</div>
                <div style={s.questionSub}>
                  Мы полностью исключим эти продукты из рациона
                </div>
              </div>
            </div>
            <div style={s.yesNo}>
              <button
                style={{
                  ...s.yesNoBtn,
                  ...(hasAllergy === true ? s.yesNoBtnActiveRed : {}),
                }}
                onClick={() => setHasAllergy(true)}
              >
                Да, есть
              </button>
              <button
                style={{
                  ...s.yesNoBtn,
                  ...(hasAllergy === false ? s.yesNoBtnActiveGreen : {}),
                }}
                onClick={() => {
                  setHasAllergy(false);
                  setAllergies("");
                }}
              >
                Нет
              </button>
            </div>
            {hasAllergy && (
              <input
                style={s.input}
                placeholder="Например: орехи, мёд, цитрусовые"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            )}
          </div>

          {/* ── 2. Intolerances ── */}
          <div style={s.block}>
            <div style={s.blockHeader}>
              <span style={s.blockIcon}>⚠️</span>
              <div>
                <div style={s.question}>Непереносимость продуктов?</div>
                <div style={s.questionSub}>
                  GigaChat постарается подобрать альтернативы
                </div>
              </div>
            </div>
            <div style={s.yesNo}>
              <button
                style={{
                  ...s.yesNoBtn,
                  ...(hasIntolerance === true ? s.yesNoBtnActiveOrange : {}),
                }}
                onClick={() => setHasIntolerance(true)}
              >
                Да, есть
              </button>
              <button
                style={{
                  ...s.yesNoBtn,
                  ...(hasIntolerance === false ? s.yesNoBtnActiveGreen : {}),
                }}
                onClick={() => {
                  setHasIntolerance(false);
                  setIntolerances("");
                }}
              >
                Нет
              </button>
            </div>
            {hasIntolerance && (
              <input
                style={s.input}
                placeholder="Например: лактоза, глютен"
                value={intolerances}
                onChange={(e) => setIntolerances(e.target.value)}
              />
            )}
          </div>

          {/* ── 3. Disliked ── */}
          <div style={s.block}>
            <div style={s.blockHeader}>
              <span style={s.blockIcon}>👎</span>
              <div>
                <div style={s.question}>Нелюбимые продукты</div>
                <div style={s.questionSub}>
                  Мы их не включим в ваш рацион
                </div>
              </div>
            </div>
            <input
              style={s.input}
              placeholder="Например: печень, брокколи, рыба"
              value={disliked}
              onChange={(e) => setDisliked(e.target.value)}
            />
          </div>
        </div>

        <div style={s.footer}>
          <button style={s.submitBtn} onClick={handleSubmit}>
            Составить рацион
          </button>
        </div>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 100,
  },

  // ─── Intro sheet ───────────────────────────────────────────────────────────
  introSheet: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    zIndex: 101,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    maxHeight: "92dvh",
  },
  introClose: {
    position: "absolute",
    top: 18,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#F0EDE8",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  introIllustration: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginTop: 16,
    marginBottom: 8,
    flexShrink: 0,
  },
  introEmojiRing: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #E8F7EC, #C2EAC8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(33,160,56,0.15)",
    zIndex: 1,
  },
  introMainEmoji: { fontSize: 36 },
  introOrbit: {
    position: "absolute",
    width: 120,
    height: 120,
    top: "50%",
    left: "50%",
    marginTop: -60,
    marginLeft: -60,
  },
  orbitEmoji: {
    position: "absolute",
    fontSize: 20,
    top: "50%",
    left: "50%",
    marginTop: -10,
    marginLeft: -10,
  },
  introContent: {
    padding: "0 24px",
    textAlign: "center",
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.3,
    marginBottom: 12,
    whiteSpace: "pre-line",
    color: "#1A1A2E",
  },
  introDesc: {
    fontSize: 14,
    color: "#7A8A85",
    lineHeight: 1.6,
    marginBottom: 20,
  },
  introAccent: {
    color: "#21A038",
    fontWeight: 700,
  },
  featuresList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textAlign: "left",
    background: "#F7F5F1",
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 8,
  },
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: { fontSize: 20, flexShrink: 0 },
  featureText: { fontSize: 13, fontWeight: 600, color: "#1A1A2E" },
  introFooter: {
    padding: "16px 20px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  introCta: {
    width: "100%",
    padding: 16,
    background: "linear-gradient(135deg,#1D9034,#2BBE4E)",
    color: "#fff",
    border: "none",
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(33,160,56,0.30)",
    letterSpacing: "-0.01em",
  },
  introSkip: {
    width: "100%",
    padding: 14,
    background: "transparent",
    color: "#7A8A85",
    border: "none",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },

  // ─── Form sheet ────────────────────────────────────────────────────────────
  sheet: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    height: "auto",
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
    paddingTop: 10,
    flexShrink: 0,
  },
  handle: { width: 36, height: 4, background: "#E8EEEB", borderRadius: 2 },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px 10px",
    borderBottom: "1px solid #F0EDE8",
    flexShrink: 0,
  },
  backBtn: {
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#F0EDE8",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" },

  progressWrap: {
    padding: "12px 20px 6px",
    flexShrink: 0,
  },
  progressBar: {
    height: 5,
    background: "#EDEAE4",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg,#21A038,#4DBD67)",
    borderRadius: 3,
    transition: "width 0.3s ease",
  },
  progressLabel: {
    fontSize: 11,
    color: "#888",
    fontWeight: 500,
    textAlign: "right",
  },

  scroll: { flex: 1, overflowY: "auto", padding: "14px 16px 8px" },

  block: {
    marginBottom: 22,
    background: "#F7F5F1",
    borderRadius: 16,
    padding: "14px 14px 16px",
  },
  blockHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  blockIcon: {
    fontSize: 24,
    flexShrink: 0,
    marginTop: 2,
  },
  question: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1A1A2E",
    marginBottom: 2,
    lineHeight: 1.4,
  },
  questionSub: {
    fontSize: 12,
    color: "#888",
    lineHeight: 1.4,
  },
  yesNo: { display: "flex", gap: 8, marginBottom: 10 },
  yesNoBtn: {
    flex: 1,
    padding: "11px 0",
    border: "1.5px solid #E8EEEB",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    background: "#fff",
    color: "#7A8A85",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  yesNoBtnActiveRed: {
    background: "#FFF0EE",
    borderColor: "#E05A2B",
    color: "#E05A2B",
  },
  yesNoBtnActiveOrange: {
    background: "#FFF8E6",
    borderColor: "#E8A020",
    color: "#B07A10",
  },
  yesNoBtnActiveGreen: {
    background: "#E8F7EC",
    borderColor: "#21A038",
    color: "#21A038",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #E8EEEB",
    borderRadius: 12,
    fontSize: 14,
    color: "#1A1A2E",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },
  footer: {
    padding: "12px 16px 28px",
    borderTop: "1px solid #F0EDE8",
    flexShrink: 0,
    background: "#fff",
  },
  submitBtn: {
    width: "100%",
    padding: 16,
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
