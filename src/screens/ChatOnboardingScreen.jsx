import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scales } from "@phosphor-icons/react";
import { useLanguage } from "../hooks/useLanguage";

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes textShake {
    0%, 100% { transform: translateX(0); }
    15%      { transform: translateX(-6px) rotate(-1deg); }
    30%      { transform: translateX(6px) rotate(1deg); }
    45%      { transform: translateX(-4px); }
    60%      { transform: translateX(4px); }
    75%      { transform: translateX(-2px); }
    90%      { transform: translateX(2px); }
  }
  .shake-text { animation: textShake 0.5s ease 4s 2; display: inline-block; }
  @keyframes floatCircle {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-14px); }
  }
  .bubble-float { animation: floatCircle 2.8s ease-in-out infinite; }
`;

const BUTTON_DELAY = 5200;

export default function ChatOnboardingScreen() {
  const navigate = useNavigate();
  const { t, titleFont } = useLanguage();
  const [visible, setVisible] = useState([false, false, false]);
  const [showButton, setShowButton] = useState(false);

  const BUBBLES = [
    { side: "left",  text: t.chatOnboarding.bubble1, delay: 800  },
    { side: "right", text: t.chatOnboarding.bubble2line1 + "\n" + t.chatOnboarding.bubble2line2, delay: 2200 },
    { side: "left",  text: t.chatOnboarding.bubble3, delay: 3800 },
  ];

  useEffect(() => {
    const timers = [
      ...BUBBLES.map((b, i) =>
        setTimeout(() => setVisible(prev => { const n = [...prev]; n[i] = true; return n; }), b.delay)
      ),
      setTimeout(() => setShowButton(true), BUTTON_DELAY),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{
        padding: "56px 28px 0",
        display: "flex", alignItems: "center", gap: 12,
        animation: "fadeUp 0.6s ease both",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.9)",
          boxShadow: "0 4px 16px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Scales size={24} weight="duotone" color="#7C3AED" />
        </div>
        <div>
          <div style={{ fontFamily: titleFont, fontSize: 22, fontWeight: 400, color: "#1e0f3c" }}>
            FairFamily
          </div>
          <div style={{ fontSize: 11, color: "#6b5a9e", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 1 }}>
            Fair from the start
          </div>
        </div>
        <button onClick={() => navigate("/welcome2")} style={{
          marginLeft: "auto", background: "none", border: "none",
          color: "#5b4899", fontSize: 14, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
        }}>{t.chatOnboarding.skip}</button>
      </div>

      {/* Bubbles — vertically centered */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "32px 8px", gap: 40,
      }}>
        {BUBBLES.map((bubble, i) => (
          <div key={i} className={i === 2 ? "bubble-float" : ""} style={{ display: "flex", justifyContent: bubble.side === "left" ? "flex-start" : "flex-end" }}>
            <div style={{
              width: "100%",
              display: "flex",
              justifyContent: bubble.side === "left" ? "flex-start" : "flex-end",
              opacity: visible[i] ? 1 : 0,
              transform: visible[i]
                ? "translateX(0) scale(1)"
                : bubble.side === "left" ? "translateX(-24px) scale(0.97)" : "translateX(24px) scale(0.97)",
              transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)",
            }}>
            <div style={{
              maxWidth: "98%",
              padding: "14px 18px",
              borderRadius: bubble.side === "left" ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: bubble.side === "left"
                ? "1px solid rgba(255,255,255,0.95)"
                : "1.5px solid rgba(255,255,255,0.55)",
              boxShadow: bubble.side === "left"
                ? "0 6px 24px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1)"
                : "0 0 0 1px rgba(124,58,237,0.3), 0 0 0 3px rgba(236,72,153,0.18), 0 8px 28px rgba(124,58,237,0.18)",
              color: "#1e0f3c",
              fontSize: 24, lineHeight: 1.55, fontWeight: 500, whiteSpace: "pre-line",
            }}>
              {bubble.side === "right" ? (
                <>
                  You give Emma a bike at age 7,{"\n"}
                  <span className="shake-text" style={{ fontWeight: 700 }}>
                    Did you do the same for Zoe?
                  </span>
                </>
              ) : bubble.text}
            </div>
            </div>
          </div>
        ))}
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
        <button onClick={() => navigate("/welcome2")} style={{
          width: "100%", padding: "18px",
          borderRadius: 20, border: "none",
          background: "linear-gradient(135deg, #7C3AED, #EC4899)",
          color: "#fff", fontSize: 17, fontWeight: 700,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 8px 28px rgba(124,58,237,0.35)",
          letterSpacing: 0.3, display: "flex",
          alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {t.chatOnboarding.getStarted}
        </button>
      </div>
    </div>
  );
}
