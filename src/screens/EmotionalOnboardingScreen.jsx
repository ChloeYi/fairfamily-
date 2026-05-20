import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes pageFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shakeOnce {
    0%,100% { transform: translateX(0); }
    15%     { transform: translateX(-7px) rotate(-1deg); }
    30%     { transform: translateX(7px) rotate(1deg); }
    50%     { transform: translateX(-5px); }
    70%     { transform: translateX(5px); }
    85%     { transform: translateX(-2px); }
  }

  .line1     { animation: fadeSlideUp 0.8s ease both; }
  .line2a    { animation: fadeSlideUp 0.8s ease both; }
  .line2b    { animation: fadeSlideUp 0.6s ease both; }
  .line2b-shake { animation: fadeSlideUp 0.6s ease both, shakeOnce 0.55s ease 0.65s both; }
`;

export default function EmotionalOnboardingScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showLine1, setShowLine1]   = useState(false);
  const [showLine2a, setShowLine2a] = useState(false);
  const [showLine2b, setShowLine2b] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowLine1(true),  2000),   // "When Emma was 7..."
      setTimeout(() => setShowLine2a(true), 3400),   // "Now Zoe is 7 —"
      setTimeout(() => setShowLine2b(true), 4600),   // short pause, then "did you do the same?" + shake
      setTimeout(() => setShowBubble(true), 6000),
      setTimeout(() => setShowButton(true), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "60px 36px 140px",
      animation: "pageFadeIn 0.6s ease both",
    }}>
      <style>{css}</style>

      {/* Staged text */}
      <div style={{ textAlign: "center", maxWidth: 420, marginBottom: 48 }}>

        {showLine1 && (
          <p className="line1" style={{
            fontSize: 28, fontWeight: 700, color: "#1e0f3c",
            lineHeight: 1.6, marginBottom: 12,
          }}>
            {t.emotionalOnboarding.line1}
          </p>
        )}

        <div style={{ fontSize: 28, fontWeight: 700, color: "#1e0f3c", lineHeight: 1.6 }}>
          {showLine2a && (
            <span className="line2a" style={{ display: "inline" }}>
              {t.emotionalOnboarding.line2a}{" "}
            </span>
          )}
          {showLine2b && (
            <span className="line2b-shake" style={{ display: "inline-block" }}>
              {t.emotionalOnboarding.line2b}
            </span>
          )}
        </div>
      </div>

      {/* Center bubble */}
      <div style={{
        opacity: showBubble ? 1 : 0,
        transform: showBubble ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.34, 1.4, 0.64, 1)",
      }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{
            padding: "20px 28px", borderRadius: 22,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.95)",
            boxShadow: "0 8px 32px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,1)",
            color: "#1e0f3c", fontSize: 18, fontWeight: 500,
            lineHeight: 1.5, textAlign: "center", maxWidth: 380, whiteSpace: "pre-line",
          }}>
            {t.emotionalOnboarding.bubble}
          </div>
          {/* Right tail */}
          <div style={{
            position: "absolute", right: -14, top: "50%",
            transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "10px solid transparent",
            borderBottom: "10px solid transparent",
            borderLeft: "14px solid rgba(255,255,255,0.82)",
            filter: "drop-shadow(2px 0 2px rgba(139,92,246,0.06))",
          }} />
        </div>
      </div>

      {/* Get Started button */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 24px 40px",
        background: "linear-gradient(to top, rgba(248,240,255,0.98) 70%, transparent)",
        opacity: showButton ? 1 : 0,
        transform: showButton ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: showButton ? "auto" : "none",
      }}>
        <button onClick={() => navigate("/welcome3")} style={{
          width: "100%", padding: "18px",
          borderRadius: 20, border: "none",
          background: "linear-gradient(135deg, #7C3AED, #EC4899)",
          color: "#fff", fontSize: 17, fontWeight: 700,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 8px 28px rgba(124,58,237,0.35)", letterSpacing: 0.3,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {t.emotionalOnboarding.getStarted}
        </button>
      </div>
    </div>
  );
}
