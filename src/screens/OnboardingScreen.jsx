import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes popIn {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,107,0.3); }
    50%       { box-shadow: 0 0 0 14px rgba(255,107,107,0); }
  }

  .shimmer {
    background: linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #FF6B6B);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }
  .fade-up { animation: fadeUp 0.6s ease both; }
  .float   { animation: float 4s ease-in-out infinite; }
  .pop-in  { animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
  .pulse-btn { animation: pulse 2s ease infinite; }
`;

const EMOJIS = ["🌸", "⚡", "🌻", "🦋", "🌈", "⭐"];
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#C7B8EA", "#FF9F43"];

export default function OnboardingScreen({ onDone }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [numKids, setNumKids] = useState(null);
  const [children, setChildren] = useState([]);
  const [childForm, setChildForm] = useState({ name: "", age: "" });
  const [saving, setSaving] = useState(false);

  const base = {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 30% 40%, #0f1e35 0%, #06090f 70%)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "40px 28px", textAlign: "center",
    fontFamily: "'DM Sans', sans-serif", color: "#e8f0f8",
    position: "relative", overflow: "hidden",
  };

  const btnStyle = {
    marginTop: 28, padding: "15px 44px", borderRadius: 50,
    background: "linear-gradient(135deg, #FF6B6B, #FFE66D)",
    border: "none", cursor: "pointer", fontSize: 16,
    fontWeight: 700, color: "#000", letterSpacing: 0.3,
    fontFamily: "'DM Sans', sans-serif",
    opacity: saving ? 0.6 : 1,
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px",
    borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#e8f0f8", fontSize: 15, outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 10, boxSizing: "border-box",
  };

  const totalSteps = 6;
  const currentStep = step <= 2 ? step : step === 3 ? 3 : step === 4 ? 4 : 5;

  const ProgressDots = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} style={{
          width: i === currentStep ? 20 : 6,
          height: 6, borderRadius: 3,
          background: i === currentStep
            ? "linear-gradient(90deg, #FF6B6B, #FFE66D)"
            : "rgba(255,255,255,0.1)",
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );

  if (step === 0) return (
    <div style={base}>
      <style>{css}</style>
      <ProgressDots />
      <div className="float" style={{ fontSize: 64, marginBottom: 20 }}>👨‍👩‍👧‍👦</div>
      <h1 className="fade-up" style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 30, fontWeight: 700, lineHeight: 1.3,
        marginBottom: 16,
      }}>
        {t.onboarding.s0pre}<br />
        <span className="shimmer">{t.onboarding.s0shimmer}</span>
      </h1>
      <p className="fade-up" style={{
        color: "#8899bb", fontSize: 15, lineHeight: 1.8,
        maxWidth: 300, whiteSpace: "pre-line", animationDelay: "0.1s"
      }}>{t.onboarding.s0sub}</p>
      <button className="pulse-btn fade-up" style={{ ...btnStyle, animationDelay: "0.2s" }}
        onClick={() => setStep(1)}>
        {t.onboarding.s0btn}
      </button>
    </div>
  );

  if (step === 1) return (
    <div style={base}>
      <style>{css}</style>
      <ProgressDots />
      <div className="float" style={{ fontSize: 64, marginBottom: 20 }}>📊</div>
      <h1 className="fade-up" style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 30, fontWeight: 700, lineHeight: 1.3,
        marginBottom: 16,
      }}>{t.onboarding.s1title}</h1>
      <div className="fade-up" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 10, maxWidth: 300, width: "100%", animationDelay: "0.1s"
      }}>
        {t.onboarding.trackingItems.map((item, i) => (
          <div key={i} className="pop-in" style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "12px 10px",
            animationDelay: `${i * 0.05}s`,
          }}>
            <div style={{ fontSize: 22 }}>{item.icon}</div>
            <div style={{ fontSize: 12, color: "#aabbcc", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <button className="pulse-btn fade-up" style={{ ...btnStyle, animationDelay: "0.2s" }}
        onClick={() => setStep(2)}>
        {t.onboarding.s1btn}
      </button>
    </div>
  );

  if (step === 2) return (
    <div style={base}>
      <style>{css}</style>
      <ProgressDots />
      <div className="float" style={{ fontSize: 64, marginBottom: 20 }}>🤔</div>
      <h1 className="fade-up" style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 30, fontWeight: 700, lineHeight: 1.3,
        marginBottom: 16,
      }}>
        <span className="shimmer">{t.onboarding.s2shimmer}</span><br />
        {t.onboarding.s2post}
      </h1>
      <p className="fade-up" style={{
        color: "#8899bb", fontSize: 15, lineHeight: 1.8,
        maxWidth: 300, whiteSpace: "pre-line", animationDelay: "0.1s"
      }}>{t.onboarding.s2sub}</p>
      <button className="pulse-btn fade-up" style={{ ...btnStyle, animationDelay: "0.2s" }}
        onClick={() => setStep(3)}>
        {t.onboarding.s2btn}
      </button>
    </div>
  );

  if (step === 3) return (
    <div style={base}>
      <style>{css}</style>
      <ProgressDots />
      <div className="float" style={{ fontSize: 56, marginBottom: 16 }}>👶</div>
      <h2 className="fade-up" style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 28, fontWeight: 700, marginBottom: 8
      }}>{t.onboarding.howMany}</h2>
      <p style={{ color: "#445566", fontSize: 14, marginBottom: 28 }}>
        {t.onboarding.howManyNote}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {[1, 2, 3, 4, 5, "6+"].map((n, i) => (
          <button key={n} className="pop-in"
            onClick={() => { setNumKids(typeof n === "number" ? n : 6); setStep(4); }}
            style={{
              width: 68, height: 68, borderRadius: 20,
              background: "rgba(255,255,255,0.06)",
              border: "2px solid rgba(255,255,255,0.12)",
              color: "#fff", fontSize: 22, cursor: "pointer",
              fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              animationDelay: `${i * 0.06}s`, transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,107,107,0.15)"; e.currentTarget.style.borderColor = "#FF6B6B"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
          >{n}</button>
        ))}
      </div>
    </div>
  );

  if (step === 4) {
    const idx = children.length;
    const addChild = () => {
      if (!childForm.name.trim() || !childForm.age) return;
      const updated = [...children, {
        id: Date.now(), name: childForm.name.trim(),
        age: parseInt(childForm.age),
        emoji: EMOJIS[idx % EMOJIS.length],
        color: COLORS[idx % COLORS.length],
      }];
      setChildren(updated);
      setChildForm({ name: "", age: "" });
      if (updated.length >= numKids) setStep(5);
    };
    return (
      <div style={base}>
        <style>{css}</style>
        <ProgressDots />
        <div className="float" style={{ fontSize: 48, marginBottom: 8 }}>
          {EMOJIS[idx % EMOJIS.length]}
        </div>
        <h2 className="fade-up" style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26, fontWeight: 700, marginBottom: 4
        }}>{t.onboarding.childN(idx + 1, numKids)}</h2>
        {children.length > 0 && (
          <p style={{ color: "#4ECDC4", fontSize: 13, marginBottom: 16 }}>
            {t.onboarding.added(children.map(c => c.name).join(", "))}
          </p>
        )}
        <div style={{ width: "100%", maxWidth: 320, marginTop: 16 }}>
          <input value={childForm.name}
            onChange={e => setChildForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addChild()}
            placeholder={t.onboarding.namePlaceholder} style={inputStyle} />
          <input value={childForm.age}
            onChange={e => setChildForm(p => ({ ...p, age: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addChild()}
            placeholder={t.onboarding.agePlaceholder} type="number"
            style={{ ...inputStyle, marginBottom: 20 }} />
          <button onClick={addChild} className="pulse-btn"
            style={{ ...btnStyle, marginTop: 0, width: "100%" }}>
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
            name: child.name,
            age: child.age,
            emoji: child.emoji,
            color: child.color,
            totalSpent: 0,
            giftCount: 0,
            experienceCount: 0,
            milestoneCount: 0,
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
      <div className="pop-in" style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <h2 className="fade-up" style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 30, fontWeight: 700, marginBottom: 20
      }}>{t.onboarding.ready}</h2>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
        {children.map((c, i) => (
          <div key={c.id} className="pop-in" style={{
            background: `${c.color}18`,
            border: `2px solid ${c.color}44`,
            borderRadius: 20, padding: "14px 18px", textAlign: "center",
            animationDelay: `${i * 0.15}s`,
          }}>
            <div style={{ fontSize: 32 }}>{c.emoji}</div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginTop: 6 }}>{c.name}</div>
            <div style={{ color: "#8899aa", fontSize: 12 }}>{t.childRoom.ageAt(c.age)}</div>
          </div>
        ))}
      </div>
      <button className="pulse-btn" style={btnStyle} onClick={handleFinish} disabled={saving}>
        {saving ? t.onboarding.saving : t.onboarding.go}
      </button>
    </div>
  );
}
