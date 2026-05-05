import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
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

  .shimmer {
    background: linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #FF6B6B);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  .kid-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 14px 16px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
    animation: popIn 0.4s ease both;
  }
  .kid-card:hover {
    background: rgba(255,255,255,0.08);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }

  .input-field {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 13px 14px;
    color: #e8f0f8;
    font-size: 14px;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 10px;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .input-field:focus { border-color: rgba(78,205,196,0.4); }
`;

const EMOJIS = ["🌸", "⚡", "🌻", "🦋", "🌈", "⭐", "🎯", "🔥"];
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#C7B8EA", "#FF9F43", "#45B7D1", "#96CEB4"];

export default function KidsScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", age: "" });
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

  const addChild = async () => {
    if (!form.name.trim() || !form.age || !uid || saving) return;
    setSaving(true);
    try {
      const idx = children.length;
      await addDoc(collection(db, "users", uid, "children"), {
        name: form.name.trim(),
        age: parseInt(form.age),
        emoji: EMOJIS[idx % EMOJIS.length],
        color: COLORS[idx % COLORS.length],
        totalSpent: 0,
        giftCount: 0,
        experienceCount: 0,
        milestoneCount: 0,
        createdAt: serverTimestamp(),
      });
      setForm({ name: "", age: "" });
      setShowForm(false);
    } catch (e) {
      console.error("Add child error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 0%, #0f1e35 0%, #06090f 60%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e8f0f8",
      paddingBottom: 80,
    }}>
      <style>{css}</style>

      <div style={{ padding: "28px 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#334455", textTransform: "uppercase", marginBottom: 4 }}>
            {t.kids.subtitle}
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700 }}>
            <span className="shimmer">{t.kids.title}</span>
          </h1>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{
          width: 38, height: 38, borderRadius: 12,
          background: showForm ? "rgba(78,205,196,0.2)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${showForm ? "rgba(78,205,196,0.4)" : "rgba(255,255,255,0.1)"}`,
          color: showForm ? "#4ECDC4" : "#667788",
          fontSize: 20, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}>
          {showForm ? "×" : "+"}
        </button>
      </div>

      <div style={{ padding: "0 16px" }}>

        {showForm && (
          <div style={{
            background: "rgba(78,205,196,0.06)",
            border: "1px solid rgba(78,205,196,0.2)",
            borderRadius: 18, padding: 16, marginBottom: 16,
            animation: "fadeUp 0.3s ease both",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#4ECDC4", textTransform: "uppercase", marginBottom: 12 }}>
              {t.kids.add}
            </div>
            <input
              className="input-field"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addChild()}
              placeholder={t.kids.namePlaceholder}
            />
            <input
              className="input-field"
              value={form.age}
              onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addChild()}
              placeholder={t.kids.agePlaceholder}
              type="number"
              style={{ marginBottom: 12 }}
            />
            <button onClick={addChild} disabled={saving} style={{
              width: "100%", padding: "12px",
              borderRadius: 12, border: "none",
              background: saving ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #4ECDC4, #45B7D1)",
              color: saving ? "#667788" : "#000",
              fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {saving ? t.kids.adding : t.kids.add}
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTopColor: "#4ECDC4",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }} />
          </div>
        )}

        {!loading && children.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", animation: "fadeUp 0.5s ease both" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>👶</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t.kids.noChildren}</div>
            <div style={{ color: "#445566", fontSize: 14 }}>{t.kids.noChildrenHint}</div>
          </div>
        )}

        {children.map((c, i) => {
          const total = c.totalSpent || 0;
          const giftCount = c.giftCount || 0;
          const expCount = c.experienceCount || 0;
          return (
            <div key={c.id} className="kid-card"
              style={{ animationDelay: `${i * 0.07}s`, borderColor: `${c.color}22` }}
              onClick={() => navigate(`/child/${c.id}`)}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: `${c.color}18`, border: `2px solid ${c.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, flexShrink: 0,
              }}>{c.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#e8f0f8" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#445566", marginTop: 3 }}>
                  {t.childRoom.ageAt(c.age)}
                  {giftCount > 0 && ` · ${t.kids.gifts(giftCount)}`}
                  {expCount > 0 && ` · ${t.kids.experiences(expCount)}`}
                </div>
                {total > 0 && (
                  <div style={{ fontSize: 12, color: "#FFE66D", marginTop: 2 }}>
                    {t.kids.spent(total)}
                  </div>
                )}
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: `${c.color}15`, border: `1px solid ${c.color}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: c.color, fontSize: 14,
              }}>›</div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
