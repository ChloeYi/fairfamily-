import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, collection, onSnapshot, addDoc, updateDoc,
  increment, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes popIn {
    0%   { transform: scale(0.8); opacity: 0; }
    70%  { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }

  .cr-log-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(139,92,246,0.07);
    animation: fadeUp 0.4s ease both;
  }

  .cr-type-btn {
    flex: 1; padding: 11px 4px; border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.9);
    background: rgba(255,255,255,0.65);
    color: #9b8ec4; cursor: pointer; font-size: 12px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s; text-align: center;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(139,92,246,0.06);
  }

  .cr-input {
    width: 100%;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 14px; padding: 14px 16px;
    color: #1e0f3c; font-size: 16px; outline: none;
    font-family: 'DM Sans', sans-serif; box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 10px rgba(139,92,246,0.06);
  }
  .cr-input:focus {
    border-color: var(--accent-color, rgba(124,58,237,0.4));
    box-shadow: 0 0 0 3px var(--accent-glow, rgba(124,58,237,0.08));
  }
  .cr-input::placeholder { color: #c4b8e0; }
`;

const TYPE_META = [
  { type: "gift", icon: "🎁" },
  { type: "experience", icon: "✨" },
  { type: "milestone", icon: "🏆" },
  { type: "note", icon: "📝" },
];

export default function ChildRoomScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, titleFont } = useLanguage();

  const [child, setChild] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [logType, setLogType] = useState("gift");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !id) return;
    const unsub1 = onSnapshot(doc(db, "users", uid, "children", id), snap => {
      if (snap.exists()) setChild({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    const unsub2 = onSnapshot(
      query(collection(db, "users", uid, "children", id, "logs"), orderBy("createdAt", "desc")),
      snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    );
    return () => { unsub1(); unsub2(); };
  }, [uid, id]);

  const handleSave = async () => {
    if (!desc.trim() || !uid || saving) return;
    setSaving(true);
    try {
      const amt = parseFloat(amount) || 0;
      await addDoc(collection(db, "users", uid, "children", id, "logs"), {
        type: logType, desc: desc.trim(), amount: amt,
        age: child?.age || null, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", uid, "children", id), {
        totalSpent: increment(amt),
        ...(logType === "gift" && { giftCount: increment(1) }),
        ...(logType === "experience" && { experienceCount: increment(1) }),
        ...(logType === "milestone" && { milestoneCount: increment(1) }),
      });
      setDesc(""); setAmount(""); setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !child) return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 14, position: "relative", zIndex: 1,
    }}>
      <style>{css}</style>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "2px solid rgba(124,58,237,0.15)", borderTopColor: "#7C3AED",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ color: "#9b8ec4", fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
        {t.childRoom.loading}
      </div>
    </div>
  );

  const accentColor = child.color || "#7C3AED";
  const totalSpent = child.totalSpent || 0;
  const giftCount = child.giftCount || 0;
  const expCount = child.experienceCount || 0;

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleDateString();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      fontFamily: "'DM Sans', sans-serif",
      color: "#1e0f3c", paddingBottom: 90,
      position: "relative", zIndex: 1,
    }}>
      <style>{css}</style>
      <style>{`
        .cr-input:focus {
          --accent-color: ${accentColor}55;
          --accent-glow: ${accentColor}10;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: "24px 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/kids")} style={{
          background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.95)",
          borderRadius: 12, padding: "10px 16px", color: "#7c6faa",
          cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 4px 12px rgba(139,92,246,0.1)",
        }}>
          {t.childRoom.back}
        </button>
        <div style={{ flex: 1 }} />
      </div>

      {/* Child profile */}
      <div style={{ padding: "0 20px 24px", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 84, height: 84, borderRadius: 26,
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}12)`,
            border: `2px solid ${accentColor}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 42,
            boxShadow: `0 8px 32px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.8)`,
          }}>{child.emoji}</div>
          <div>
            <h1 style={{
              fontFamily: "'Climate Crisis', sans-serif",
              fontSize: 34, fontWeight: 400, lineHeight: 1.1, letterSpacing: 0,
              color: accentColor,
            }}>{child.name}</h1>
            <div style={{ color: "#9b8ec4", fontSize: 15, marginTop: 6 }}>
              {t.childRoom.ageAt(child.age)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: t.childRoom.totalSpent, value: `$${totalSpent.toLocaleString()}`, color: "#D97706" },
            { label: t.childRoom.gifts, value: giftCount, color: "#EC4899" },
            { label: t.childRoom.experiences, value: expCount, color: "#7C3AED" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.95)",
              borderRadius: 20, padding: "16px 10px", textAlign: "center",
              animation: `popIn 0.4s ${i * 0.08}s ease both`,
              boxShadow: "0 4px 20px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,1)",
            }}>
              <div style={{
                fontFamily: "'Climate Crisis', sans-serif",
                fontSize: 28, fontWeight: 700, color: s.color,
                lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#a394c8", marginTop: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* Add log button / form */}
        <div style={{ marginBottom: 18 }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{
              width: "100%", padding: "16px",
              borderRadius: 20, border: `1px solid ${accentColor}35`,
              background: `${accentColor}0c`,
              backdropFilter: "blur(16px)",
              color: accentColor,
              fontSize: 16, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              boxShadow: `0 4px 20px ${accentColor}12`,
            }}>
              {t.childRoom.addLog}
            </button>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.95)",
              borderRadius: 24, padding: 20, animation: "fadeUp 0.3s ease both",
              boxShadow: "0 12px 40px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1)",
            }}>
              <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
                {t.childRoom.typeLabel}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {TYPE_META.map(m => (
                  <button key={m.type} className="cr-type-btn"
                    onClick={() => setLogType(m.type)}
                    style={{
                      background: logType === m.type ? `${accentColor}14` : "rgba(255,255,255,0.65)",
                      borderColor: logType === m.type ? `${accentColor}44` : "rgba(255,255,255,0.95)",
                      color: logType === m.type ? accentColor : "#9b8ec4",
                      boxShadow: logType === m.type ? `0 4px 12px ${accentColor}18` : "0 2px 8px rgba(139,92,246,0.05)",
                    }}>
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{m.icon}</div>
                    {t.logTypes[m.type]}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                {t.childRoom.descLabel}
              </div>
              <textarea className="cr-input"
                value={desc} onChange={e => setDesc(e.target.value)}
                placeholder={t.childRoom.descPlaceholder}
                rows={2} style={{ resize: "none", lineHeight: 1.7, marginBottom: 12 }}
              />

              <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                {t.childRoom.amountLabel}
              </div>
              <input className="cr-input"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={t.childRoom.amountPlaceholder} type="number"
                style={{ marginBottom: 16 }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowForm(false); setDesc(""); setAmount(""); }} style={{
                  flex: 1, padding: "13px", borderRadius: 14,
                  background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.95)",
                  color: "#9b8ec4", cursor: "pointer", fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 2px 8px rgba(139,92,246,0.06)",
                }}>✕</button>
                <button onClick={handleSave} disabled={saving || !desc.trim()} style={{
                  flex: 3, padding: "13px", borderRadius: 14, border: "none",
                  background: saving || !desc.trim()
                    ? "rgba(139,92,246,0.08)"
                    : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  color: saving || !desc.trim() ? "#c4b8e0" : "#fff",
                  fontWeight: 700, fontSize: 15,
                  cursor: saving || !desc.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: saving || !desc.trim() ? "none" : `0 4px 20px ${accentColor}30`,
                }}>
                  {saving ? t.childRoom.saving : t.childRoom.saveLog}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logs list */}
        <div style={{ fontSize: 12, letterSpacing: 2.5, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
          {t.childRoom.recentLogs}
        </div>

        {logs.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 20px",
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 24, animation: "fadeUp 0.5s ease both",
            boxShadow: "0 4px 20px rgba(139,92,246,0.07)",
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>✨</div>
            <div style={{ fontSize: 18, color: "#6b5b9e", marginBottom: 8 }}>{t.childRoom.noLogs}</div>
            <div style={{ fontSize: 14, color: "#a394c8" }}>{t.childRoom.noLogsHint}</div>
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 24, padding: "6px 18px",
            boxShadow: "0 8px 32px rgba(139,92,246,0.09), inset 0 1px 0 rgba(255,255,255,1)",
          }}>
            {logs.map((log, i) => {
              const meta = TYPE_META.find(m => m.type === log.type) || TYPE_META[3];
              return (
                <div key={log.id} className="cr-log-row" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 13, flexShrink: 0,
                    background: "rgba(139,92,246,0.08)",
                    backdropFilter: "blur(10px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                    boxShadow: "0 2px 10px rgba(139,92,246,0.08)",
                  }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: "#1e0f3c", fontWeight: 500 }}>{log.desc}</div>
                    <div style={{ fontSize: 12, color: "#9b8ec4", marginTop: 3 }}>
                      {t.logTypes[log.type]}
                      {log.age ? ` · ${t.childRoom.ageAt(log.age)}` : ""}
                      {log.createdAt ? ` · ${formatDate(log.createdAt)}` : ""}
                    </div>
                  </div>
                  {log.amount > 0 && (
                    <div style={{
                      fontSize: 15, fontWeight: 700, color: "#D97706", flexShrink: 0,
                      fontFamily: "'Climate Crisis', sans-serif",
                    }}>
                      ${log.amount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
