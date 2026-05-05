import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, collection, onSnapshot, addDoc, updateDoc,
  increment, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes popIn {
    0%   { transform: scale(0.8); opacity: 0; }
    70%  { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }

  .cr-log-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    animation: fadeUp 0.4s ease both;
  }
  .cr-type-btn {
    flex: 1; padding: 9px 4px; border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #556677; cursor: pointer; font-size: 11px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s; text-align: center;
  }
  .cr-input {
    width: 100%; background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px; padding: 12px 14px;
    color: #e8f0f8; font-size: 14px; outline: none;
    font-family: 'DM Sans', sans-serif; box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .cr-input:focus { border-color: rgba(78,205,196,0.4); }
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
  const { t } = useLanguage();

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
      query(
        collection(db, "users", uid, "children", id, "logs"),
        orderBy("createdAt", "desc"),
      ),
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
        type: logType,
        desc: desc.trim(),
        amount: amt,
        age: child?.age || null,
        createdAt: serverTimestamp(),
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
      minHeight: "100vh", background: "#06090f",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 12,
    }}>
      <style>{css}</style>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#4ECDC4",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ color: "#334455", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        {t.childRoom.loading}
      </div>
    </div>
  );

  const accentColor = child.color || "#4ECDC4";
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
      background: `radial-gradient(ellipse at 40% 0%, ${accentColor}18 0%, #06090f 55%)`,
      fontFamily: "'DM Sans', sans-serif",
      color: "#e8f0f8",
      paddingBottom: 90,
    }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding: "20px 16px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/kids")} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "8px 12px", color: "#667788",
          cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        }}>
          {t.childRoom.back}
        </button>
        <div style={{ flex: 1 }} />
      </div>

      {/* Child profile */}
      <div style={{ padding: "0 16px 20px", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: `${accentColor}20`, border: `2px solid ${accentColor}50`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36,
          }}>{child.emoji}</div>
          <div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 30, fontWeight: 700, lineHeight: 1,
              color: accentColor,
            }}>{child.name}</h1>
            <div style={{ color: "#445566", fontSize: 13, marginTop: 4 }}>
              {t.childRoom.ageAt(child.age)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: t.childRoom.totalSpent, value: `$${totalSpent.toLocaleString()}`, color: "#FFE66D" },
            { label: t.childRoom.gifts, value: giftCount, color: "#FF6B6B" },
            { label: t.childRoom.experiences, value: expCount, color: "#4ECDC4" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "12px 10px", textAlign: "center",
              animation: `popIn 0.4s ${i * 0.08}s ease both`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#445566", marginTop: 3, letterSpacing: 1, textTransform: "uppercase" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Add log button / form */}
        <div style={{ marginBottom: 16 }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{
              width: "100%", padding: "14px",
              borderRadius: 16, border: `1px solid ${accentColor}44`,
              background: `${accentColor}10`, color: accentColor,
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            }}>
              {t.childRoom.addLog}
            </button>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, padding: 16, animation: "fadeUp 0.3s ease both",
            }}>
              {/* Type selector */}
              <div style={{
                fontSize: 10, letterSpacing: 3, color: "#445566",
                textTransform: "uppercase", marginBottom: 8,
              }}>{t.childRoom.typeLabel}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {TYPE_META.map(m => (
                  <button key={m.type} className="cr-type-btn"
                    onClick={() => setLogType(m.type)}
                    style={{
                      background: logType === m.type ? `${accentColor}18` : "rgba(255,255,255,0.04)",
                      borderColor: logType === m.type ? `${accentColor}55` : "rgba(255,255,255,0.08)",
                      color: logType === m.type ? accentColor : "#556677",
                    }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{m.icon}</div>
                    {t.logTypes[m.type]}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div style={{
                fontSize: 10, letterSpacing: 3, color: "#445566",
                textTransform: "uppercase", marginBottom: 6,
              }}>{t.childRoom.descLabel}</div>
              <textarea className="cr-input"
                value={desc} onChange={e => setDesc(e.target.value)}
                placeholder={t.childRoom.descPlaceholder}
                rows={2} style={{ resize: "none", lineHeight: 1.6, marginBottom: 10 }}
              />

              {/* Amount */}
              <div style={{
                fontSize: 10, letterSpacing: 3, color: "#445566",
                textTransform: "uppercase", marginBottom: 6,
              }}>{t.childRoom.amountLabel}</div>
              <input className="cr-input"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={t.childRoom.amountPlaceholder} type="number"
                style={{ marginBottom: 12 }}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowForm(false); setDesc(""); setAmount(""); }} style={{
                  flex: 1, padding: "11px", borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#667788", cursor: "pointer", fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                }}>✕</button>
                <button onClick={handleSave} disabled={saving || !desc.trim()} style={{
                  flex: 3, padding: "11px", borderRadius: 12, border: "none",
                  background: saving || !desc.trim()
                    ? "rgba(255,255,255,0.08)"
                    : `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
                  color: saving || !desc.trim() ? "#445566" : "#000",
                  fontWeight: 700, fontSize: 14, cursor: saving || !desc.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {saving ? t.childRoom.saving : t.childRoom.saveLog}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logs list */}
        <div style={{
          fontSize: 10, letterSpacing: 3, color: "#445566",
          textTransform: "uppercase", marginBottom: 10,
        }}>{t.childRoom.recentLogs}</div>

        {logs.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "36px 16px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18, animation: "fadeUp 0.5s ease both",
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
            <div style={{ fontSize: 14, color: "#8899aa", marginBottom: 6 }}>{t.childRoom.noLogs}</div>
            <div style={{ fontSize: 12, color: "#334455" }}>{t.childRoom.noLogsHint}</div>
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18, padding: "4px 14px",
          }}>
            {logs.map((log, i) => {
              const meta = TYPE_META.find(m => m.type === log.type) || TYPE_META[3];
              return (
                <div key={log.id} className="cr-log-row" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#ddeeff" }}>{log.desc}</div>
                    <div style={{ fontSize: 10, color: "#445566", marginTop: 2 }}>
                      {t.logTypes[log.type]}
                      {log.age ? ` · ${t.childRoom.ageAt(log.age)}` : ""}
                      {log.createdAt ? ` · ${formatDate(log.createdAt)}` : ""}
                    </div>
                  </div>
                  {log.amount > 0 && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FFE66D", flexShrink: 0 }}>
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
