import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";
import { Clock, CurrencyDollar, Gift, GraduationCap, UsersThree, Heart, Sparkle, Heartbeat, ArrowLeft, Trash } from "@phosphor-icons/react";

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

// Same 8 categories as the Log screen and fairness radar.
const CATEGORIES = [
  { key: "time", Icon: Clock }, { key: "money", Icon: CurrencyDollar },
  { key: "gifts", Icon: Gift }, { key: "school", Icon: GraduationCap },
  { key: "oneOnOne", Icon: UsersThree }, { key: "emotional", Icon: Heart },
  { key: "experiences", Icon: Sparkle }, { key: "health", Icon: Heartbeat },
];
const CATEGORY_KEYS = CATEGORIES.map(c => c.key);
const LEGACY = { gift: "gifts", experience: "experiences", milestone: "experiences", note: "experiences" };

const label = { fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#6b5a9e", fontWeight: 700, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" };
const input = {
  width: "100%", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.95)", borderRadius: 14, padding: "14px 16px",
  color: "#1e0f3c", fontSize: 16, outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", boxShadow: "0 2px 10px rgba(139,92,246,0.06)",
};

export default function LogEditScreen() {
  const { childId, logId } = useParams();
  const navigate = useNavigate();
  const { t, titleFont } = useLanguage();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [category, setCategory] = useState("time");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [hours, setHours] = useState("");
  const [times, setTimes] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", uid, "children", childId, "logs", logId));
      if (!snap.exists()) { setNotFound(true); setLoading(false); return; }
      const l = snap.data();
      const cat = l.category || LEGACY[l.type] || l.type || "experiences";
      setCategory(CATEGORY_KEYS.includes(cat) ? cat : "experiences");
      setDesc(l.desc || "");
      setAmount(l.amount ? String(l.amount) : "");
      setHours(l.hours ? String(l.hours) : "");
      setTimes(l.times ? String(l.times) : "");
      if (l.createdAt?.toDate) {
        const d = l.createdAt.toDate();
        setDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      }
      setLoading(false);
    })();
  }, [uid, childId, logId]);

  const handleSave = async () => {
    if (!uid || saving) return;
    setSaving(true);
    try {
      const update = {
        category,
        desc: desc.trim() || t.categories[category],
        amount: category === "time" ? 0 : parseFloat(amount) || 0,
        hours: category === "time" ? parseFloat(hours) || 0 : 0,
        times: Math.max(1, parseInt(times) || 1),
      };
      if (dateStr) update.createdAt = new Date(dateStr + "T12:00:00");
      await updateDoc(doc(db, "users", uid, "children", childId, "logs", logId), update);
      setSaved(true);
      setTimeout(() => navigate(-1), 700);
    } catch (e) {
      console.error("Edit save error:", e);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!uid) return;
    if (!window.confirm(t.logEdit.confirmDelete)) return;
    try {
      await deleteDoc(doc(db, "users", uid, "children", childId, "logs", logId));
      navigate(-1);
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const iconBtn = {
    width: 44, height: 44, borderRadius: 14, cursor: "pointer",
    background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.95)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(139,92,246,0.12)",
  };

  return (
    <div style={{
      minHeight: "100vh", background: BG, fontFamily: "'DM Sans', sans-serif",
      color: "#1e0f3c", paddingBottom: 40,
    }}>
      <div style={{ padding: "36px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate(-1)} style={iconBtn} aria-label="back">
          <ArrowLeft size={20} color="#7c6faa" weight="bold" />
        </button>
        <h1 style={{ fontFamily: titleFont, fontSize: 26, fontWeight: 400, color: "#1e0f3c" }}>
          {t.logEdit.title}
        </h1>
        <button onClick={handleDelete} style={{ ...iconBtn, background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)" }} aria-label="delete">
          <Trash size={20} color="#EC4899" weight="bold" />
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6b5a9e" }}>···</div>
        ) : notFound ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6b5a9e", fontSize: 15 }}>{t.logEdit.notFound}</div>
        ) : (
          <>
            {/* Category */}
            <div style={label}>{t.photoLog.typeLabel}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 22 }}>
              {CATEGORIES.map(({ key, Icon }) => {
                const active = category === key;
                return (
                  <button key={key} onClick={() => setCategory(key)} style={{
                    padding: "10px 2px", borderRadius: 14,
                    border: active ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.95)",
                    background: active ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.65)",
                    color: active ? "#7C3AED" : "#9b8ec4", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, lineHeight: 1.15,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    <Icon size={22} weight="duotone" color={active ? "#7C3AED" : "#9b8ec4"} />
                    {t.categories[key]}
                  </button>
                );
              })}
            </div>

            {/* Description */}
            <div style={label}>{t.photoLog.descLabel}</div>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder={t.photoLog.descPlaceholder} rows={3}
              style={{ ...input, resize: "none", lineHeight: 1.7, marginBottom: 20 }} />

            {/* Amount + Times */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {category === "time" ? (
                <div style={{ flex: 1 }}>
                  <div style={label}>{t.photoLog.hoursLabel}</div>
                  <input value={hours} onChange={e => setHours(e.target.value)}
                    placeholder={t.photoLog.hoursPlaceholder} type="number" min="0" step="0.5" style={input} />
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div style={label}>{t.photoLog.amountLabel}</div>
                  <input value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder={t.photoLog.amountPlaceholder} type="number" style={input} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={label}>{t.photoLog.timesLabel}</div>
                <input value={times} onChange={e => setTimes(e.target.value)}
                  placeholder={t.photoLog.timesPlaceholder} type="number" min="1" style={input} />
              </div>
            </div>
            {/* Date */}
            <div style={{ marginBottom: 24 }}>
              <div style={label}>{t.photoLog.whenLabel}</div>
              <input value={dateStr} onChange={e => setDateStr(e.target.value)}
                type="date" max={new Date().toISOString().slice(0, 10)}
                style={{ ...input, colorScheme: "light" }} />
            </div>

            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", padding: "17px", borderRadius: 20, border: "none",
              background: saved ? "linear-gradient(135deg, #10B981, #06B6D4)" : "linear-gradient(135deg, #7C3AED, #EC4899)",
              color: "#fff", fontSize: 17, fontWeight: 700, cursor: saving ? "default" : "pointer",
              fontFamily: "'DM Sans', sans-serif", opacity: saving && !saved ? 0.6 : 1,
              boxShadow: "0 6px 28px rgba(124,58,237,0.35)",
            }}>
              {saved ? t.photoLog.saved : t.photoLog.save}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
