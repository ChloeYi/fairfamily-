import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";
import { UsersThree, Baby, Command } from "@phosphor-icons/react";

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes titleShake {
    0%,100% { transform: translateX(0); }
    15%     { transform: translateX(-7px) rotate(-1deg); }
    30%     { transform: translateX(7px) rotate(1deg); }
    45%     { transform: translateX(-5px); }
    60%     { transform: translateX(5px); }
    75%     { transform: translateX(-2px); }
    90%     { transform: translateX(2px); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes popIn {
    0%   { transform: scale(0.78); opacity: 0; }
    70%  { transform: scale(1.04); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,107,0.35), 0 6px 24px rgba(255,107,107,0.4); }
    50%       { box-shadow: 0 0 0 14px rgba(255,107,107,0), 0 6px 24px rgba(255,107,107,0.4); }
  }
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(-30px, 40px) scale(1.05); }
    66%       { transform: translate(20px, -30px) scale(0.96); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40%       { transform: translate(35px, -50px) scale(1.08); }
    70%       { transform: translate(-20px, 20px) scale(0.94); }
  }

  .shimmer-text {
    color: #1e0f3c;
    display: inline-block;
    text-shadow: 0 4px 18px rgba(30,15,60,0.18), 0 2px 6px rgba(0,0,0,0.10);
    animation: titleShake 0.45s ease 2;
  }

  .fade-up { animation: fadeUp 0.6s ease both; }
  .float-anim { animation: float 4s ease-in-out infinite; }
  .pop-in  { animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .pulse-btn { animation: pulse 2s ease infinite; }

  .orb-ob1 {
    position: fixed; width: 440px; height: 440px; border-radius: 50%;
    top: -160px; right: -120px; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(168,85,247,0.38) 0%, transparent 70%);
    filter: blur(56px);
    animation: orbFloat1 18s ease-in-out infinite;
  }
  .orb-ob2 {
    position: fixed; width: 360px; height: 360px; border-radius: 50%;
    bottom: -100px; left: -100px; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%);
    filter: blur(60px);
    animation: orbFloat2 22s ease-in-out infinite;
  }

  .ob-track-card {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 18px;
    padding: 16px 12px;
    text-align: center;
    transition: all 0.25s;
  }
  .ob-track-card:hover {
    background: rgba(255,255,255,0.09);
    transform: translateY(-3px);
  }

  .ob-num-btn {
    width: 72px; height: 72px; border-radius: 22px;
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.95);
    color: #1e0f3c; font-size: 22px; font-weight: 700;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all 0.22s;
    box-shadow: 0 4px 16px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
  }
  .ob-num-btn:hover {
    background: rgba(255,107,107,0.14);
    border-color: rgba(255,107,107,0.45);
    color: #FF6B6B;
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(255,107,107,0.2);
  }

  .glass-input-ob {
    width: 100%;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 16px;
    padding: 16px 18px;
    color: #1e0f3c; font-size: 16px; outline: none;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 12px; box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .glass-input-ob:focus {
    border-color: rgba(255,107,107,0.5);
    box-shadow: 0 0 0 3px rgba(255,107,107,0.08);
  }
  .glass-input-ob::placeholder { color: #c4b8e0; }

  .child-preview-card {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 20px; padding: 16px 18px; text-align: center;
    transition: all 0.2s;
  }
`;

const EMOJIS = ["🌸", "⚡", "🌻", "🦋", "🌈", "⭐"];
const COLORS = ["#EC4899", "#7C3AED", "#3B82F6", "#10B981", "#8B5CF6", "#EA580C"];

export default function OnboardingScreen({ onDone }) {
  const { t, titleFont } = useLanguage();
  const [step, setStep] = useState(0);
  const [numKids, setNumKids] = useState(null);
  const [children, setChildren] = useState([]);
  const [childForm, setChildForm] = useState({ name: "", age: "" });
  const [saving, setSaving] = useState(false);

  const base = {
    minHeight: "100vh", background: BG,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "48px 28px", textAlign: "center",
    fontFamily: "'DM Sans', sans-serif", color: "#1e0f3c",
    position: "relative", overflow: "hidden", zIndex: 1,
  };

  const primaryBtn = {
    marginTop: 28, padding: "17px 52px",
    borderRadius: 20,
    background: saving ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #FF6B6B, #EA580C)",
    border: "none", cursor: saving ? "not-allowed" : "pointer",
    fontSize: 16, fontWeight: 700,
    color: saving ? "#667788" : "#000",
    letterSpacing: 0.3, fontFamily: "'DM Sans', sans-serif",
    boxShadow: saving ? "none" : "0 6px 28px rgba(255,107,107,0.4)",
    transition: "all 0.2s",
  };

  const totalSteps = 6;
  const currentStep = step <= 2 ? step : step === 3 ? 3 : step === 4 ? 4 : 5;

  const ProgressDots = () => (
    <div style={{ display: "flex", gap: 7, marginBottom: 36, position: "relative", zIndex: 1 }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} style={{
          width: i === currentStep ? 24 : 7,
          height: 7, borderRadius: 4,
          background: i === currentStep
            ? "linear-gradient(90deg, #FF6B6B, #EA580C)"
            : "rgba(255,255,255,0.1)",
          transition: "all 0.35s ease",
          boxShadow: i === currentStep ? "0 0 10px rgba(255,107,107,0.5)" : "none",
        }} />
      ))}
    </div>
  );

  if (step === 0) return (
    <div style={base}>
      <style>{css}</style>
      <div className="orb-ob1" /><div className="orb-ob2" />
      <ProgressDots />
      <div className="float-anim" style={{
        width: 96, height: 96, borderRadius: 30,
        background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(124,58,237,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28,
        boxShadow: "0 12px 48px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
        position: "relative", zIndex: 1,
      }}>
        <UsersThree size={54} weight="duotone" color="#7C3AED" />
      </div>
      <h1 className="fade-up" style={{
        fontFamily: "'Climate Crisis', sans-serif",
        fontSize: 52, fontWeight: 700, lineHeight: 1.1,
        marginBottom: 18, letterSpacing: -0.5,
        position: "relative", zIndex: 1,
      }}>
        {t.onboarding.s0pre}<br />
        <span className="shimmer-text">{t.onboarding.s0shimmer}</span>
      </h1>
      <p className="fade-up" style={{
        color: "#6a7f94", fontSize: 17, lineHeight: 1.8,
        maxWidth: 320, whiteSpace: "pre-line",
        animationDelay: "0.12s", position: "relative", zIndex: 1,
      }}>{t.onboarding.s0sub}</p>
      <button className="pulse-btn fade-up" style={{ ...primaryBtn, animationDelay: "0.22s", position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "28px auto 0" }}
        onClick={() => setStep(1)}>
        <Command size={20} weight="bold" />
        {t.onboarding.s0btn}
      </button>
    </div>
  );

  if (step === 1) return (
    <div style={base}>
      <style>{css}</style>
      <div className="orb-ob1" /><div className="orb-ob2" />
      <ProgressDots />
      <div className="float-anim" style={{
        width: 88, height: 88, borderRadius: 28,
        background: "linear-gradient(135deg, rgba(78,205,196,0.3), rgba(78,205,196,0.1))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(78,205,196,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 46, marginBottom: 28,
        boxShadow: "0 12px 40px rgba(78,205,196,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
        position: "relative", zIndex: 1,
      }}>📊</div>
      <h1 className="fade-up" style={{
        fontFamily: "'Climate Crisis', sans-serif",
        fontSize: 48, fontWeight: 700, lineHeight: 1.1,
        marginBottom: 24, letterSpacing: -0.5,
        position: "relative", zIndex: 1,
      }}>{t.onboarding.s1title}</h1>
      <div className="fade-up" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 10, maxWidth: 320, width: "100%",
        animationDelay: "0.12s", position: "relative", zIndex: 1,
      }}>
        {t.onboarding.trackingItems.map((item, i) => (
          <div key={i} className={`ob-track-card pop-in`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 13, color: "#8899bb", fontWeight: 500 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <button className="pulse-btn fade-up" style={{ ...primaryBtn, animationDelay: "0.22s", position: "relative", zIndex: 1 }}
        onClick={() => setStep(2)}>
        {t.onboarding.s1btn}
      </button>
    </div>
  );

  if (step === 2) return (
    <div style={base}>
      <style>{css}</style>
      <div className="orb-ob1" /><div className="orb-ob2" />
      <ProgressDots />
      <div className="float-anim" style={{
        width: 88, height: 88, borderRadius: 28,
        background: "linear-gradient(135deg, rgba(199,125,255,0.3), rgba(123,47,190,0.15))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(199,125,255,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 46, marginBottom: 28,
        boxShadow: "0 12px 40px rgba(199,125,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
        position: "relative", zIndex: 1,
      }}>🤔</div>
      <h1 className="fade-up" style={{
        fontFamily: "'Climate Crisis', sans-serif",
        fontSize: 48, fontWeight: 700, lineHeight: 1.1,
        marginBottom: 18, letterSpacing: -0.5,
        position: "relative", zIndex: 1,
      }}>
        <span className="shimmer-text">{t.onboarding.s2shimmer}</span><br />
        {t.onboarding.s2post}
      </h1>
      <p className="fade-up" style={{
        color: "#6a7f94", fontSize: 17, lineHeight: 1.8,
        maxWidth: 320, whiteSpace: "pre-line",
        animationDelay: "0.12s", position: "relative", zIndex: 1,
      }}>{t.onboarding.s2sub}</p>
      <button className="pulse-btn fade-up" style={{ ...primaryBtn, animationDelay: "0.22s", position: "relative", zIndex: 1 }}
        onClick={() => setStep(3)}>
        {t.onboarding.s2btn}
      </button>
    </div>
  );

  if (step === 3) return (
    <div style={base}>
      <style>{css}</style>
      <div className="orb-ob1" /><div className="orb-ob2" />
      <ProgressDots />
      <div className="float-anim" style={{
        width: 88, height: 88, borderRadius: 28,
        background: "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(139,92,246,0.1))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(236,72,153,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 28,
        boxShadow: "0 12px 40px rgba(236,72,153,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
        position: "relative", zIndex: 1,
      }}>
        <Baby size={48} weight="duotone" color="#EC4899" />
      </div>
      <h1 className="fade-up" style={{
        fontFamily: "'Climate Crisis', sans-serif",
        fontSize: 48, fontWeight: 700, lineHeight: 1.1,
        marginBottom: 10, letterSpacing: -0.5,
        position: "relative", zIndex: 1,
      }}>{t.onboarding.howMany}</h1>
      <p className="fade-up" style={{
        color: "#6a7f94", fontSize: 15, marginBottom: 32,
        animationDelay: "0.08s", position: "relative", zIndex: 1,
      }}>{t.onboarding.howManyNote}</p>
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap",
        justifyContent: "center", position: "relative", zIndex: 1,
      }}>
        {[1, 2, 3, 4, 5, "6+"].map((n, i) => (
          <button key={n} className={`ob-num-btn pop-in`}
            style={{ animationDelay: `${i * 0.07}s` }}
            onClick={() => { setNumKids(typeof n === "number" ? n : 6); setStep(4); }}
          >{n}</button>
        ))}
      </div>
    </div>
  );

  if (step === 4) {
    const idx = children.length;
    const accentColor = COLORS[idx % COLORS.length];
    const addChild = () => {
      if (!childForm.name.trim() || !childForm.age) return;
      const updated = [...children, {
        id: Date.now(), name: childForm.name.trim(),
        age: parseInt(childForm.age),
        emoji: EMOJIS[idx % EMOJIS.length],
        color: accentColor,
      }];
      setChildren(updated);
      setChildForm({ name: "", age: "" });
      if (updated.length >= numKids) setStep(5);
    };
    return (
      <div style={base}>
        <style>{css}</style>
        <div className="orb-ob1" /><div className="orb-ob2" />
        <ProgressDots />
        <div className="float-anim" style={{
          width: 88, height: 88, borderRadius: 28,
          background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}18)`,
          backdropFilter: "blur(20px)",
          border: `1px solid ${accentColor}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 46, marginBottom: 20,
          boxShadow: `0 12px 40px ${accentColor}28, inset 0 1px 0 rgba(255,255,255,0.1)`,
          position: "relative", zIndex: 1,
        }}>{EMOJIS[idx % EMOJIS.length]}</div>

        <h1 className="fade-up" style={{
          fontFamily: "'Climate Crisis', sans-serif",
          fontSize: 44, fontWeight: 700, marginBottom: 6,
          letterSpacing: -0.5, position: "relative", zIndex: 1,
        }}>{t.onboarding.childN(idx + 1, numKids)}</h1>

        {children.length > 0 && (
          <p className="fade-up" style={{
            fontSize: 13, marginBottom: 8, position: "relative", zIndex: 1,
            color: "#4ECDC4", animationDelay: "0.05s",
          }}>
            {t.onboarding.added(children.map(c => c.name).join(", "))}
          </p>
        )}

        <div style={{ width: "100%", maxWidth: 340, marginTop: 20, position: "relative", zIndex: 1 }}>
          <input className="glass-input-ob"
            value={childForm.name}
            onChange={e => setChildForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addChild()}
            placeholder={t.onboarding.namePlaceholder} />
          <input className="glass-input-ob"
            value={childForm.age}
            onChange={e => setChildForm(p => ({ ...p, age: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addChild()}
            placeholder={t.onboarding.agePlaceholder} type="number"
            style={{ marginBottom: 20 }} />
          <button onClick={addChild} className="pulse-btn" style={{
            ...primaryBtn, marginTop: 0, width: "100%",
            background: `linear-gradient(135deg, ${accentColor}, ${COLORS[(idx + 1) % COLORS.length]})`,
            boxShadow: `0 6px 28px ${accentColor}44`,
          }}>
            {idx + 1 < numKids ? t.onboarding.next : t.onboarding.finish}
          </button>
        </div>
      </div>
    );
  }

  const handleFinish = async () => {
    if (saving) return;
    setSaving(true);
    const user = auth.currentUser;
    if (user && children.length > 0) {
      try {
        for (const child of children) {
          await addDoc(collection(db, "users", user.uid, "children"), {
            name: child.name, age: child.age,
            emoji: child.emoji, color: child.color,
            totalSpent: 0, giftCount: 0,
            experienceCount: 0, milestoneCount: 0,
            createdAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.error("Failed to save children:", e);
      }
    }
    onDone();
  };

  return (
    <div style={base}>
      <style>{css}</style>
      <div className="orb-ob1" /><div className="orb-ob2" />

      <div className="pop-in" style={{
        width: 100, height: 100, borderRadius: 30,
        background: "linear-gradient(135deg, rgba(255,230,109,0.3), rgba(78,205,196,0.2))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 54, marginBottom: 24,
        boxShadow: "0 12px 48px rgba(255,230,109,0.2), inset 0 1px 0 rgba(255,255,255,0.12)",
        position: "relative", zIndex: 1,
      }}>🎉</div>

      <h1 className="fade-up" style={{
        fontFamily: "'Climate Crisis', sans-serif",
        fontSize: 52, fontWeight: 700, marginBottom: 24,
        letterSpacing: -0.5, position: "relative", zIndex: 1,
      }}>{t.onboarding.ready}</h1>

      <div style={{
        display: "flex", gap: 12, justifyContent: "center",
        flexWrap: "wrap", marginBottom: 32,
        position: "relative", zIndex: 1,
      }}>
        {children.map((c, i) => (
          <div key={c.id} className={`child-preview-card pop-in`} style={{
            border: `1px solid ${c.color}44`,
            animationDelay: `${i * 0.12}s`,
            boxShadow: `0 8px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)`,
          }}>
            <div style={{
              width: 58, height: 58, borderRadius: 18,
              background: `linear-gradient(135deg, ${c.color}38, ${c.color}18)`,
              border: `2px solid ${c.color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, margin: "0 auto 10px",
              boxShadow: `0 4px 16px ${c.color}28`,
            }}>{c.emoji}</div>
            <div style={{ color: "#e8f0f8", fontSize: 15, fontWeight: 600 }}>{c.name}</div>
            <div style={{ color: "#6a7f94", fontSize: 13, marginTop: 3 }}>{t.childRoom.ageAt(c.age)}</div>
          </div>
        ))}
      </div>

      <button className="pulse-btn" style={{ ...primaryBtn, position: "relative", zIndex: 1 }}
        onClick={handleFinish} disabled={saving}>
        {saving ? t.onboarding.saving : t.onboarding.go}
      </button>
    </div>
  );
}
