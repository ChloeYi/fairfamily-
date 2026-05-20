import { useState, useEffect, useRef } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { auth, db } from "../firebase";
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  increment, serverTimestamp, query, orderBy, limit,
} from "firebase/firestore";
import { useLanguage } from "../hooks/useLanguage";
import { Camera, Gift, Sparkle, Trophy, Note, PencilSimple } from "@phosphor-icons/react";

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
const KidIcon = ({ emoji, size = 24, color }) => (
  <i className={`fi ${EMOJI_FLATICON[emoji] || "fi-sr-child-head"}`} style={{ fontSize: size, color }} />
);

const client = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = "claude-sonnet-4-6";
const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
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
    0%   { transform: scale(0.6); opacity: 0; }
    70%  { transform: scale(1.06); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  @keyframes scanLine {
    0%   { top: 0%; }
    100% { top: 100%; }
  }

  .title-text {
    color: #1e0f3c;
    display: inline-block;
    text-shadow: 0 4px 18px rgba(30,15,60,0.18), 0 2px 6px rgba(0,0,0,0.10);
    animation: titleShake 0.45s ease 2;
  }

  .label {
    font-size: 12px; letter-spacing: 2.5px; text-transform: uppercase;
    color: #6b5a9e; font-weight: 700; font-family: 'DM Sans', sans-serif; margin-bottom: 12px;
  }

  .glass-input {
    width: 100%;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 14px; padding: 14px 16px;
    color: #1e0f3c; font-size: 16px; outline: none;
    font-family: 'DM Sans', sans-serif; margin-bottom: 12px;
    box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 10px rgba(139,92,246,0.06);
  }
  .glass-input:focus {
    border-color: rgba(217,119,6,0.4);
    box-shadow: 0 0 0 3px rgba(217,119,6,0.08);
  }
  .glass-input::placeholder { color: #c4b8e0; }

  .type-btn {
    flex: 1; padding: 12px 4px; border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.9);
    background: rgba(255,255,255,0.65);
    backdrop-filter: blur(10px);
    color: #9b8ec4; cursor: pointer; font-size: 12px;
    font-family: 'DM Sans', sans-serif; transition: all 0.2s; text-align: center;
    box-shadow: 0 2px 10px rgba(139,92,246,0.06);
  }

  .photo-zone {
    border: 2px dashed rgba(217,119,6,0.3);
    border-radius: 24px; padding: 36px 20px;
    text-align: center; cursor: pointer; transition: all 0.2s;
    position: relative; overflow: hidden;
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(217,119,6,0.06);
  }
  .photo-zone:hover {
    border-color: rgba(217,119,6,0.55);
    background: rgba(255,255,255,0.75);
  }

  .scan-line {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #EA580C, transparent);
    animation: scanLine 2s ease-in-out infinite;
    box-shadow: 0 0 12px #EA580C;
  }

  .spinner {
    width: 28px; height: 28px;
    border: 2px solid rgba(217,119,6,0.15);
    border-top-color: #EA580C; border-radius: 50%;
    animation: spin 0.8s linear infinite; margin: 0 auto 10px;
  }

  .recent-log {
    display: flex; align-items: center; gap: 14px;
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 20px; padding: 14px 16px; margin-bottom: 10px;
    animation: fadeUp 0.4s ease both;
    box-shadow: 0 4px 16px rgba(139,92,246,0.08);
    position: relative; z-index: 1;
  }
`;

const LOG_TYPE_ICONS = {
  gift: Gift,
  experience: Sparkle,
  milestone: Trophy,
  note: Note,
};

const LOG_TYPES = [
  { type: "gift" },
  { type: "experience" },
  { type: "milestone" },
  { type: "note" },
];

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function PhotoLogScreen() {
  const { t, titleFont } = useLanguage();
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [logType, setLogType] = useState("gift");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [age, setAge] = useState("");
  const [photo, setPhoto] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedText, setScannedText] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeMode, setActiveMode] = useState("photo");
  const [saveError, setSaveError] = useState("");
  const fileRef = useRef();

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(collection(db, "users", uid, "children"), snap => {
      const kids = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      kids.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setChildren(kids);
      setChildrenLoading(false);
    });
  }, [uid]);

  const childIdsKey = children.map(c => c.id).sort().join(",");
  useEffect(() => {
    if (!uid || !childIdsKey) return;
    const unsubs = children.map(child =>
      onSnapshot(
        query(collection(db, "users", uid, "children", child.id, "logs"), orderBy("createdAt", "desc"), limit(2)),
        snap => {
          const logs = snap.docs.map(d => ({ id: d.id, child, ...d.data() }));
          setRecentLogs(prev => {
            const others = prev.filter(l => l.child.id !== child.id);
            return [...others, ...logs]
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
              .slice(0, 5);
          });
        }
      )
    );
    return () => unsubs.forEach(u => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, childIdsKey]);

  const selectedChild = children.find(c => c.id === selectedChildId) || null;

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    setScanning(true); setScannedText("");
    try {
      const base64 = await toBase64(file);
      const message = await client.messages.create({
        model: MODEL, max_tokens: 256,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
          { type: "text", text: `Look at this image. Extract:\n- Item name/description\n- Amount/price if visible\n- Type (gift, experience, milestone, or note)\nReturn as JSON only: {"desc":"...","amount":"...","type":"gift"}` },
        ]}],
      });
      const clean = message.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean);
      setDesc(parsed.desc || "");
      setAmount(parsed.amount ? String(parsed.amount).replace(/[^0-9.]/g, "") : "");
      if (parsed.type && LOG_TYPES.find(lt => lt.type === parsed.type)) setLogType(parsed.type);
      setScannedText(t.photoLog.detected(parsed.desc, parsed.amount ? String(parsed.amount).replace(/[^0-9.]/g, "") : ""));
    } catch (err) {
      console.error("Vision scan error:", err);
      setScannedText(t.photoLog.couldntRead);
    } finally { setScanning(false); }
  };

  const handleSave = async () => {
    if (!selectedChildId || !desc) return;
    setSaveError("");
    const user = auth.currentUser;
    if (!user) { setSaveError(t.photoLog.mustLogin); return; }
    try {
      const amt = parseFloat(amount) || 0;
      await addDoc(collection(db, "users", user.uid, "children", selectedChildId, "logs"), {
        type: logType, desc, amount: amt,
        age: parseFloat(age) || selectedChild?.age || null,
        photoUrl: photo || null, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid, "children", selectedChildId), {
        totalSpent: increment(amt),
        ...(logType === "gift" && { giftCount: increment(1) }),
        ...(logType === "experience" && { experienceCount: increment(1) }),
        ...(logType === "milestone" && { milestoneCount: increment(1) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setDesc(""); setAmount(""); setPhoto(null); setScannedText("");
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(t.photoLog.saveFailed);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleDateString();
  };

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'DM Sans', sans-serif", color: "#1e0f3c",
      paddingBottom: 90, position: "relative", zIndex: 1,
    }}>
      <style>{css}</style>

      <div style={{ padding: "36px 24px 20px" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
          {t.photoLog.subtitle}
        </div>
        <h1 style={{ fontFamily: "'Climate Crisis', sans-serif", fontSize: 36, fontWeight: 400, lineHeight: 1.1, letterSpacing: 0 }}>
          <span className="title-text">{t.photoLog.title}</span>
        </h1>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* Mode Toggle */}
        <div style={{
          display: "flex", gap: 6,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(16px)",
          borderRadius: 18, padding: 5, marginBottom: 24,
          border: "1px solid rgba(255,255,255,0.95)",
          boxShadow: "0 4px 16px rgba(139,92,246,0.08)",
          position: "relative", zIndex: 1,
        }}>
          {[
            { id: "photo", Icon: Camera, label: t.photoLog.scanPhoto },
            { id: "quick", Icon: PencilSimple, label: t.photoLog.quickLog },
          ].map(({ id, Icon, label }) => {
            const active = activeMode === id;
            return (
              <button key={id} onClick={() => setActiveMode(id)} style={{
                flex: 1, padding: "12px", borderRadius: 13,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: active ? "rgba(217,119,6,0.1)" : "none",
                border: active ? "1px solid rgba(217,119,6,0.3)" : "1px solid transparent",
                color: active ? "#EA580C" : "#a394c8",
                cursor: "pointer", fontSize: 14, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}>
                <Icon size={18} weight={active ? "duotone" : "regular"} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Child Selector */}
        <div className="label">{t.photoLog.whoFor}</div>
        {childrenLoading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#a394c8", fontSize: 15, position: "relative", zIndex: 1 }}>
            {t.photoLog.loadingChildren}
          </div>
        ) : children.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "20px",
            background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 18, color: "#9b8ec4", fontSize: 15, marginBottom: 24,
            position: "relative", zIndex: 1,
          }}>{t.photoLog.noChildren}</div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {children.map((c, i) => (
              <button key={c.id} onClick={() => { setSelectedChildId(c.id); setAge(String(c.age || "")); }}
                style={{
                  flex: "1 1 80px", minWidth: 72, padding: "14px 10px", borderRadius: 20,
                  background: selectedChildId === c.id
                    ? `linear-gradient(135deg, ${c.color}20, ${c.color}0c)`
                    : "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(16px)",
                  border: `2px solid ${selectedChildId === c.id ? c.color + "50" : "rgba(255,255,255,0.95)"}`,
                  cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  animation: `popIn 0.4s ${i * 0.08}s ease both`,
                  boxShadow: selectedChildId === c.id
                    ? `0 4px 20px ${c.color}20`
                    : "0 4px 12px rgba(139,92,246,0.07)",
                  position: "relative", zIndex: 1,
                }}>
                <KidIcon emoji={c.emoji} size={28} color={selectedChildId === c.id ? c.color : "#9b8ec4"} />
                <div style={{ fontSize: 13, color: selectedChildId === c.id ? c.color : "#9b8ec4", marginTop: 6, fontWeight: 600 }}>
                  {c.name}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* PHOTO MODE */}
        {activeMode === "photo" && (
          <div style={{ marginBottom: 24, animation: "fadeUp 0.4s ease both", position: "relative", zIndex: 1 }}>
            <div className="photo-zone" onClick={() => fileRef.current.click()}>
              {scanning && <div className="scan-line" />}
              {photo ? (
                <div>
                  <img src={photo} alt="receipt" style={{
                    maxWidth: "100%", maxHeight: 200, borderRadius: 16,
                    objectFit: "cover", marginBottom: 14,
                    opacity: scanning ? 0.6 : 1, transition: "opacity 0.3s",
                  }} />
                  {scanning && (
                    <div>
                      <div className="spinner" />
                      <div style={{ fontSize: 14, color: "#EA580C", animation: "pulse 1s ease infinite" }}>
                        {t.photoLog.scanning}
                      </div>
                    </div>
                  )}
                  {scannedText && (
                    <div style={{
                      background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)",
                      borderRadius: 14, padding: 14, fontSize: 13, color: "#92400e",
                      textAlign: "left", marginTop: 10,
                    }}>✓ {scannedText}</div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
                    <Camera size={56} weight="duotone" color="#EA580C" />
                  </div>
                  <div style={{ fontSize: 16, color: "#EA580C", fontWeight: 500, marginBottom: 6 }}>
                    {t.photoLog.tapPhoto}
                  </div>
                  <div style={{ fontSize: 14, color: "#b0a0cc" }}>{t.photoLog.photoHint}</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              style={{ display: "none" }} onChange={handlePhoto} />
          </div>
        )}

        {/* Log Type */}
        <div className="label">{t.photoLog.typeLabel}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, position: "relative", zIndex: 1 }}>
          {LOG_TYPES.map(lt => {
            const Icon = LOG_TYPE_ICONS[lt.type];
            const isActive = logType === lt.type;
            return (
              <button key={lt.type} className="type-btn"
                onClick={() => setLogType(lt.type)}
                style={{
                  background: isActive ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.65)",
                  borderColor: isActive ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.95)",
                  color: isActive ? "#7C3AED" : "#9b8ec4",
                  boxShadow: isActive ? "0 4px 16px rgba(124,58,237,0.12)" : "0 2px 8px rgba(139,92,246,0.05)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                <Icon size={24} weight="duotone" color={isActive ? "#7C3AED" : "#9b8ec4"} style={{ marginBottom: 4 }} />
                {t.logTypes[lt.type]}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <div className="label">{t.photoLog.descLabel}</div>
        <textarea className="glass-input" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder={t.photoLog.descPlaceholder} rows={3}
          style={{ resize: "none", lineHeight: 1.7 }} />

        {/* Amount + Age */}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="label">{t.photoLog.amountLabel}</div>
            <input className="glass-input" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder={t.photoLog.amountPlaceholder} type="number" style={{ marginBottom: 0 }} />
          </div>
          <div style={{ width: 110 }}>
            <div className="label">{t.photoLog.ageLabel}</div>
            <input className="glass-input" value={age} onChange={e => setAge(e.target.value)}
              placeholder={t.photoLog.agePlaceholder} type="number" style={{ marginBottom: 0 }} />
          </div>
        </div>

        {saveError && (
          <div style={{
            marginTop: 12, padding: "12px 16px",
            background: "rgba(236,72,153,0.08)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(236,72,153,0.22)",
            borderRadius: 14, color: "#9d174d", fontSize: 14,
          }}>{saveError}</div>
        )}

        <button onClick={handleSave} style={{
          width: "100%", padding: "17px", borderRadius: 20,
          background: saved
            ? "linear-gradient(135deg, #10B981, #06B6D4)"
            : "linear-gradient(135deg, #7C3AED, #EC4899)",
          border: "none", cursor: "pointer",
          fontWeight: 700, color: "#fff", fontSize: 17,
          fontFamily: "'DM Sans', sans-serif",
          marginTop: 18, transition: "all 0.3s",
          boxShadow: saved
            ? "0 6px 28px rgba(16,185,129,0.35)"
            : "0 6px 28px rgba(124,58,237,0.35)",
          opacity: !selectedChildId || !desc ? 0.45 : 1,
          position: "relative", zIndex: 1,
        }}>
          {saved ? t.photoLog.saved : t.photoLog.save}
        </button>

        {recentLogs.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div className="label">{t.photoLog.recentLogs}</div>
            {recentLogs.map((log, i) => (
              <div key={log.id} className="recent-log" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: `linear-gradient(135deg, ${log.child.color}22, ${log.child.color}0e)`,
                  border: `1px solid ${log.child.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                  boxShadow: `0 4px 14px ${log.child.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                }}><KidIcon emoji={log.child.emoji} size={20} color={log.child.color} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: "#1e0f3c", fontWeight: 500 }}>{log.desc}</div>
                  <div style={{ fontSize: 12, color: "#9b8ec4", marginTop: 3 }}>
                    {log.child.name} · {t.logTypes[log.type]}
                    {log.createdAt ? ` · ${formatDate(log.createdAt)}` : ""}
                  </div>
                </div>
                {log.amount > 0 && (
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: "#7C3AED",
                    fontFamily: "'Climate Crisis', sans-serif",
                  }}>${log.amount}</div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
