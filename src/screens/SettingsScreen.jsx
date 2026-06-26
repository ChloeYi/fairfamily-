import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";
import { ArrowLeft, Clock, CurrencyDollar, Gift, GraduationCap, UsersThree, Heart, Sparkle, Heartbeat, Trash, BookOpen, Lightbulb } from "@phosphor-icons/react";

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const CAT_ICONS = {
  time: Clock, money: CurrencyDollar, gifts: Gift, school: GraduationCap,
  oneOnOne: UsersThree, emotional: Heart, experiences: Sparkle, health: Heartbeat,
};
const CAT_COLORS = {
  time: "#6366F1", money: "#EA580C", gifts: "#FF6B6B", school: "#F59E0B",
  oneOnOne: "#14B8A6", emotional: "#EC4899", experiences: "#4ECDC4", health: "#22C55E",
};
const CAT_ORDER = ["time", "money", "gifts", "school", "oneOnOne", "emotional", "experiences", "health"];

const card = {
  background: "rgba(255,255,255,0.72)", backdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.95)", borderRadius: 24, padding: 22, marginBottom: 16,
  boxShadow: "0 8px 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1)",
  position: "relative", zIndex: 1,
};
const cardTitle = { display: "flex", alignItems: "center", gap: 9, fontSize: 20, fontWeight: 700, color: "#1e0f3c", marginBottom: 10 };
const cardSub = { fontSize: 15, color: "#5b4899", marginBottom: 16, lineHeight: 1.65 };

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t, titleFont } = useLanguage();
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  const deleteAllData = async () => {
    if (!window.confirm(t.settings.confirmDelete)) return;
    setDeleting(true);
    try {
      const uid = auth.currentUser?.uid;
      const kids = await getDocs(collection(db, "users", uid, "children"));
      for (const kid of kids.docs) {
        const logs = await getDocs(collection(db, "users", uid, "children", kid.id, "logs"));
        for (const lg of logs.docs) await deleteDoc(lg.ref);
        await deleteDoc(kid.ref);
      }
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 1300);
    } catch (e) {
      console.error("Delete all error:", e);
      setDeleting(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: BG, fontFamily: "'DM Sans', sans-serif",
      color: "#1e0f3c", paddingBottom: 100, position: "relative", zIndex: 1,
    }}>
      {/* Header */}
      <div style={{ padding: "36px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => navigate(-1)} aria-label="back" style={{
          width: 44, height: 44, borderRadius: 14, cursor: "pointer",
          background: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.95)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(139,92,246,0.12)",
        }}><ArrowLeft size={20} color="#7c6faa" weight="bold" /></button>
        <div>
          <div style={{ fontSize: 13, letterSpacing: 2, color: "#5b4899", fontWeight: 700, textTransform: "uppercase" }}>
            {t.settings.subtitle}
          </div>
          <h1 style={{ fontFamily: titleFont, fontSize: 30, fontWeight: 400, color: "#1e0f3c", lineHeight: 1.1 }}>
            {t.settings.title}
          </h1>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* About */}
        <div style={card}>
          <div style={cardTitle}><Lightbulb size={22} weight="duotone" color="#7C3AED" /> {t.settings.aboutTitle}</div>
          {t.settings.about.map((p, i) => (
            <p key={i} style={{ fontSize: 15, color: "#3a2a5e", lineHeight: 1.7, marginBottom: i < t.settings.about.length - 1 ? 12 : 0 }}>{p}</p>
          ))}
        </div>

        {/* How to use */}
        <div style={card}>
          <div style={cardTitle}><BookOpen size={20} weight="duotone" color="#7C3AED" /> {t.settings.howtoTitle}</div>
          <div style={cardSub}>{t.settings.howtoSub}</div>
          {t.settings.howto.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
              <div style={{
                flexShrink: 0, width: 24, height: 24, borderRadius: 8,
                background: "linear-gradient(135deg, #7C3AED, #EC4899)", color: "#fff",
                fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{i + 1}</div>
              <div style={{ fontSize: 16, color: "#3a2a5e", lineHeight: 1.65, paddingTop: 2 }}>{step}</div>
            </div>
          ))}
        </div>

        {/* Category guide */}
        <div style={card}>
          <div style={cardTitle}><Lightbulb size={20} weight="duotone" color="#EA580C" /> {t.settings.guideTitle}</div>
          <div style={cardSub}>{t.settings.guideSub}</div>
          {CAT_ORDER.map(key => {
            const Icon = CAT_ICONS[key];
            const color = CAT_COLORS[key];
            return (
              <div key={key} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "1px solid rgba(124,58,237,0.08)", alignItems: "flex-start" }}>
                <div style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: 10,
                  background: `${color}18`, border: `1px solid ${color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}><Icon size={18} weight="duotone" color={color} /></div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#1e0f3c", marginBottom: 2 }}>{t.categories[key]}</div>
                  <div style={{ fontSize: 15, color: "#5b4899", marginTop: 2, lineHeight: 1.6 }}>{t.settings.catExamples[key]}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Danger zone — delete all data */}
        <div style={{ ...card, border: "1px solid rgba(236,72,153,0.25)", background: "rgba(255,245,250,0.7)" }}>
          <div style={{ ...cardTitle, color: "#be123c" }}><Trash size={20} weight="duotone" color="#EC4899" /> {t.settings.dangerTitle}</div>
          <div style={cardSub}>{t.settings.deleteDesc}</div>
          <button onClick={deleteAllData} disabled={deleting} style={{
            width: "100%", padding: "15px", borderRadius: 16, border: "none",
            background: done ? "linear-gradient(135deg, #10B981, #06B6D4)" : "linear-gradient(135deg, #EC4899, #BE123C)",
            color: "#fff", fontSize: 16, fontWeight: 700, cursor: deleting ? "default" : "pointer",
            fontFamily: "'DM Sans', sans-serif", opacity: deleting && !done ? 0.6 : 1,
          }}>
            {done ? t.settings.deleted : deleting ? t.settings.deleting : t.settings.deleteData}
          </button>
        </div>

      </div>
    </div>
  );
}
