import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";
import { Baby, Trash, CaretRight } from "@phosphor-icons/react";

const EMOJI_FLATICON = {
  "🌸": "fi-sr-child-head",
  "⚡": "fi-sr-child",
  "🌻": "fi-sr-baby",
  "🦋": "fi-sr-user-crown",
  "🌈": "fi-sr-face-smile-hearts",
  "⭐": "fi-sr-face-awesome",
  "🎯": "fi-sr-face-glasses",
  "🔥": "fi-sr-face-smile-halo",
};

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
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
  @keyframes popIn {
    0%   { transform: scale(0.85); opacity: 0; }
    70%  { transform: scale(1.03); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .title-text {
    color: #1e0f3c;
    display: inline-block;
    text-shadow: 0 4px 18px rgba(30,15,60,0.18), 0 2px 6px rgba(0,0,0,0.10);
    animation: titleShake 0.45s ease 2;
  }

  .kid-card {
    display: flex; align-items: center; gap: 16px;
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 24px; padding: 18px 20px; margin-bottom: 12px;
    cursor: pointer; transition: all 0.25s;
    animation: popIn 0.4s ease both;
    box-shadow: 0 8px 28px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1);
    position: relative; z-index: 1;
  }
  .kid-card:hover {
    background: rgba(255,255,255,0.9);
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(139,92,246,0.16);
  }

  .glass-input {
    width: 100%;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 14px;
    padding: 15px 16px;
    color: #1e0f3c;
    font-size: 16px; outline: none;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 12px; box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 12px rgba(139,92,246,0.08);
  }
  .glass-input:focus {
    border-color: rgba(124,58,237,0.4);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }
  .glass-input::placeholder { color: #8b7fc0; }
`;

const EMOJIS = ["🌸", "⚡", "🌻", "🦋", "🌈", "⭐", "🎯", "🔥"];
const COLORS = ["#EC4899", "#7C3AED", "#EA580C", "#10B981", "#8B5CF6", "#EF4444", "#06B6D4", "#84CC16"];

export default function KidsScreen() {
  const navigate = useNavigate();
  const { t, titleFont } = useLanguage();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", birthYear: "" });
  const [saving, setSaving] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(collection(db, "users", uid, "children"), snap => {
      const kids = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      kids.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setChildren(kids);
      setLoading(false);
    });
  }, [uid]);

  const deleteChild = async (childId, childName) => {
    if (!window.confirm(`Delete ${childName}? This cannot be undone.`)) return;
    await deleteDoc(doc(db, "users", uid, "children", childId));
  };

  const addChild = async () => {
    if (!form.name.trim() || !form.birthYear || !uid || saving) return;
    setSaving(true);
    try {
      const idx = children.length;
      const birthYear = parseInt(form.birthYear);
      const age = Math.max(0, new Date().getFullYear() - birthYear);
      await addDoc(collection(db, "users", uid, "children"), {
        name: form.name.trim(),
        birthYear,
        age, // derived from birthYear at creation; recomputed live where shown
        emoji: EMOJIS[idx % EMOJIS.length],
        color: COLORS[idx % COLORS.length],
        totalSpent: 0, giftCount: 0, experienceCount: 0, milestoneCount: 0,
        createdAt: serverTimestamp(),
      });
      setForm({ name: "", birthYear: "" });
      setShowForm(false);
    } catch (e) {
      console.error("Add child error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'DM Sans', sans-serif",
      color: "#1e0f3c", paddingBottom: 90, position: "relative", zIndex: 1,
    }}>
      <style>{css}</style>

      <div style={{ padding: "36px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, letterSpacing: 3, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            {t.kids.subtitle}
          </div>
          <h1 style={{ fontFamily: titleFont, fontSize: 36, fontWeight: 400, lineHeight: 1.1, letterSpacing: 0 }}>
            <span className="title-text">{t.kids.title}</span>
          </h1>
          <div style={{ fontSize: 15, color: "#6b5a9e", marginTop: 10, lineHeight: 1.5 }}>
            {t.kids.addHint}
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          flexShrink: 0, padding: "12px 16px", borderRadius: 14, cursor: "pointer", border: "none",
          background: showForm ? "rgba(236,72,153,0.14)" : "linear-gradient(135deg, #7C3AED, #EC4899)",
          color: showForm ? "#EC4899" : "#fff",
          fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          boxShadow: showForm ? "none" : "0 6px 22px rgba(124,58,237,0.34)",
          transition: "all 0.2s",
        }}>
          {showForm ? "✕" : <>＋ {t.kids.addBtn}</>}
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>

        {showForm && (
          <div style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(236,72,153,0.2)",
            borderRadius: 24, padding: 22, marginBottom: 16,
            animation: "fadeUp 0.3s ease both",
            boxShadow: "0 8px 32px rgba(236,72,153,0.1), inset 0 1px 0 rgba(255,255,255,1)",
            position: "relative", zIndex: 1,
          }}>
            <div style={{ fontSize: 13, letterSpacing: 3, color: "#EC4899", textTransform: "uppercase", marginBottom: 16 }}>
              {t.kids.add}
            </div>
            <input className="glass-input" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addChild()}
              placeholder={t.kids.namePlaceholder} />
            <input className="glass-input" value={form.birthYear}
              onChange={e => setForm(p => ({ ...p, birthYear: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addChild()}
              placeholder={t.kids.birthYearPlaceholder} type="number"
              style={{ marginBottom: 16 }} />
            {form.birthYear && Number(form.birthYear) > 1900 && (
              <div style={{ fontSize: 15, color: "#6b5a9e", margin: "-6px 0 14px 4px" }}>
                {t.kids.agePreview(Math.max(0, new Date().getFullYear() - Number(form.birthYear)))}
              </div>
            )}
            <button onClick={addChild} disabled={saving} style={{
              width: "100%", padding: "15px",
              borderRadius: 14, border: "none",
              background: saving ? "rgba(139,92,246,0.08)" : "linear-gradient(135deg, #EC4899, #8B5CF6)",
              color: saving ? "#a394c8" : "#fff",
              fontWeight: 700, fontSize: 16, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: saving ? "none" : "0 4px 20px rgba(236,72,153,0.35)",
            }}>
              {saving ? t.kids.adding : t.kids.add}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "2px solid rgba(124,58,237,0.15)", borderTopColor: "#7C3AED",
              animation: "spin 0.8s linear infinite", margin: "0 auto",
            }} />
          </div>
        )}

        {!loading && children.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", animation: "fadeUp 0.5s ease both", position: "relative", zIndex: 1 }}>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
              <Baby size={72} weight="duotone" color="#EC4899" />
            </div>
            <div style={{ fontFamily: titleFont, fontSize: 28, fontWeight: 400, marginBottom: 12, color: "#1e0f3c" }}>
              {t.kids.noChildren}
            </div>
            <div style={{ color: "#6b5a9e", fontSize: 16, lineHeight: 1.7 }}>{t.kids.noChildrenHint}</div>
          </div>
        )}

        {children.map((c, i) => {
          const total = c.totalSpent || 0;
          const giftCount = c.giftCount || 0;
          const expCount = c.experienceCount || 0;
          return (
            <div key={c.id} className="kid-card"
              style={{ animationDelay: `${i * 0.07}s`, borderColor: `${c.color}30` }}
              onClick={() => navigate(`/child/${c.id}`)}>
              <div style={{
                width: 62, height: 62, borderRadius: 20, flexShrink: 0,
                background: `linear-gradient(135deg, ${c.color}28, ${c.color}12)`,
                border: `2px solid ${c.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 6px 20px ${c.color}22`,
              }}>
                <i className={`fi ${EMOJI_FLATICON[c.emoji] || "fi-sr-star"}`}
                   style={{ fontSize: 28, color: c.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 20, letterSpacing: -0.2, color: "#1e0f3c" }}>{c.name}</div>
                <div style={{ fontSize: 15, color: "#6b5a9e", marginTop: 4 }}>
                  {t.childRoom.ageAt(c.age)}
                  {giftCount > 0 && ` · ${t.kids.gifts(giftCount)}`}
                  {expCount > 0 && ` · ${t.kids.experiences(expCount)}`}
                </div>
                {total > 0 && (
                  <div style={{ fontSize: 14, color: "#7C3AED", marginTop: 4, fontWeight: 600 }}>
                    {t.kids.spent(total)}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={e => { e.stopPropagation(); deleteChild(c.id, c.name); }} style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#EC4899", fontSize: 16, cursor: "pointer",
                }}><Trash size={16} weight="bold" /></button>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: `${c.color}12`, border: `1px solid ${c.color}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: c.color, fontSize: 18,
                }}><CaretRight size={18} weight="bold" /></div>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
