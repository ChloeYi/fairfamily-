import { useState, useEffect, useRef } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { auth, db } from "../firebase";
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  increment, serverTimestamp, query, orderBy, limit,
} from "firebase/firestore";
import { useLanguage } from "../hooks/useLanguage";

const client = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = "claude-sonnet-4-20250514";

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
    0%   { transform: scale(0.6); opacity: 0; }
    70%  { transform: scale(1.08); }
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

  .shimmer {
    background: linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #FF6B6B);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  .label {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #445566;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 10px;
  }

  .input-field {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 12px 14px;
    color: #e8f0f8;
    font-size: 14px;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 10px;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  .input-field:focus { border-color: rgba(78,205,196,0.4); }

  .type-btn {
    flex: 1;
    padding: 10px 4px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #556677;
    cursor: pointer;
    font-size: 11px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    text-align: center;
  }

  .photo-zone {
    border: 2px dashed rgba(78,205,196,0.3);
    border-radius: 20px;
    padding: 32px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .photo-zone:hover {
    border-color: rgba(78,205,196,0.6);
    background: rgba(78,205,196,0.04);
  }

  .scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #4ECDC4, transparent);
    animation: scanLine 2s ease-in-out infinite;
    box-shadow: 0 0 10px #4ECDC4;
  }

  .spinner {
    width: 24px; height: 24px;
    border: 2px solid rgba(78,205,196,0.2);
    border-top-color: #4ECDC4;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 8px;
  }

  .recent-log {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 12px 14px;
    margin-bottom: 8px;
    animation: fadeUp 0.4s ease both;
  }
`;

const LOG_TYPES = [
  { type: "gift", icon: "🎁" },
  { type: "experience", icon: "✨" },
  { type: "milestone", icon: "🏆" },
  { type: "note", icon: "📝" },
];

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function PhotoLogScreen() {
  const { t } = useLanguage();
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
        query(
          collection(db, "users", uid, "children", child.id, "logs"),
          orderBy("createdAt", "desc"),
          limit(2),
        ),
        snap => {
          const logs = snap.docs.map(d => ({
            id: d.id,
            child,
            ...d.data(),
          }));
          setRecentLogs(prev => {
            const others = prev.filter(l => l.child.id !== child.id);
            return [...others, ...logs].sort(
              (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            ).slice(0, 5);
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
    const url = URL.createObjectURL(file);
    setPhoto(url);
    setScanning(true);
    setScannedText("");

    try {
      const base64 = await toBase64(file);
      const mediaType = file.type || "image/jpeg";

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 256,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Look at this image. Extract:
- Item name/description
- Amount/price if visible
- Type (gift, experience, milestone, or note)
Return as JSON only, no other text: {"desc":"...","amount":"...","type":"gift"}`,
            },
          ],
        }],
      });

      const text = message.content[0].text;
      const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean);

      setDesc(parsed.desc || "");
      setAmount(parsed.amount ? String(parsed.amount).replace(/[^0-9.]/g, "") : "");
      if (parsed.type && LOG_TYPES.find(lt => lt.type === parsed.type)) {
        setLogType(parsed.type);
      }
      setScannedText(t.photoLog.detected(parsed.desc, parsed.amount ? String(parsed.amount).replace(/[^0-9.]/g, "") : ""));
    } catch (err) {
      console.error("Vision scan error:", err);
      setScannedText(t.photoLog.couldntRead);
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChildId || !desc) return;
    setSaveError("");

    const user = auth.currentUser;
    if (!user) {
      setSaveError(t.photoLog.mustLogin);
      return;
    }

    try {
      const amt = parseFloat(amount) || 0;
      await addDoc(
        collection(db, "users", user.uid, "children", selectedChildId, "logs"),
        {
          type: logType,
          desc,
          amount: amt,
          age: parseFloat(age) || selectedChild?.age || null,
          photoUrl: photo || null,
          createdAt: serverTimestamp(),
        }
      );
      await updateDoc(doc(db, "users", user.uid, "children", selectedChildId), {
        totalSpent: increment(amt),
        ...(logType === "gift" && { giftCount: increment(1) }),
        ...(logType === "experience" && { experienceCount: increment(1) }),
        ...(logType === "milestone" && { milestoneCount: increment(1) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setDesc("");
      setAmount("");
      setPhoto(null);
      setScannedText("");
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
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #0f1e20 0%, #06090f 60%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e8f0f8",
      paddingBottom: 80,
    }}>
      <style>{css}</style>

      <div style={{ padding: "28px 20px 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#334455", textTransform: "uppercase", marginBottom: 4 }}>
          {t.photoLog.subtitle}
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28, fontWeight: 700,
        }}>
          <span className="shimmer">{t.photoLog.title}</span>
        </h1>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Mode Toggle */}
        <div style={{
          display: "flex", gap: 6,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 14, padding: 4, marginBottom: 20,
        }}>
          {[
            { id: "photo", label: t.photoLog.scanPhoto },
            { id: "quick", label: t.photoLog.quickLog },
          ].map(mode => (
            <button key={mode.id} onClick={() => setActiveMode(mode.id)} style={{
              flex: 1, padding: "10px", borderRadius: 10,
              background: activeMode === mode.id
                ? "linear-gradient(135deg, rgba(78,205,196,0.2), rgba(78,205,196,0.08))"
                : "none",
              border: activeMode === mode.id
                ? "1px solid rgba(78,205,196,0.3)"
                : "1px solid transparent",
              color: activeMode === mode.id ? "#4ECDC4" : "#445566",
              cursor: "pointer", fontSize: 13, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}>
              {mode.label}
            </button>
          ))}
        </div>

        {/* Child Selector */}
        <div className="label">{t.photoLog.whoFor}</div>
        {childrenLoading ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#445566", fontSize: 13 }}>
            {t.photoLog.loadingChildren}
          </div>
        ) : children.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "16px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, color: "#445566", fontSize: 13, marginBottom: 20,
          }}>
            {t.photoLog.noChildren}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {children.map((c, i) => (
              <button key={c.id} onClick={() => { setSelectedChildId(c.id); setAge(String(c.age || "")); }}
                style={{
                  flex: "1 1 80px", minWidth: 70, padding: "12px 8px", borderRadius: 16,
                  background: selectedChildId === c.id ? `${c.color}18` : "rgba(255,255,255,0.04)",
                  border: `2px solid ${selectedChildId === c.id ? c.color + "66" : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer", textAlign: "center",
                  transition: "all 0.2s",
                  animation: `popIn 0.4s ${i * 0.08}s ease both`,
                }}>
                <div style={{ fontSize: 24 }}>{c.emoji}</div>
                <div style={{ fontSize: 12, color: selectedChildId === c.id ? c.color : "#556677", marginTop: 4, fontWeight: 600 }}>
                  {c.name}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* PHOTO MODE */}
        {activeMode === "photo" && (
          <div style={{ marginBottom: 20, animation: "fadeUp 0.4s ease both" }}>
            <div className="label">{t.photoLog.tapPhoto}</div>

            <div className="photo-zone" onClick={() => fileRef.current.click()}>
              {scanning && <div className="scan-line" />}

              {photo ? (
                <div>
                  <img src={photo} alt="receipt" style={{
                    maxWidth: "100%", maxHeight: 180, borderRadius: 12,
                    objectFit: "cover", marginBottom: 12,
                    opacity: scanning ? 0.6 : 1,
                    transition: "opacity 0.3s",
                  }} />
                  {scanning && (
                    <div>
                      <div className="spinner" />
                      <div style={{ fontSize: 13, color: "#4ECDC4", animation: "pulse 1s ease infinite" }}>
                        {t.photoLog.scanning}
                      </div>
                    </div>
                  )}
                  {scannedText && (
                    <div style={{
                      background: "rgba(78,205,196,0.08)",
                      border: "1px solid rgba(78,205,196,0.2)",
                      borderRadius: 12, padding: 12,
                      fontSize: 12, color: "#4ECDC4",
                      textAlign: "left", whiteSpace: "pre-line",
                      marginTop: 8,
                    }}>
                      ✓ {scannedText}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>📸</div>
                  <div style={{ fontSize: 15, color: "#4ECDC4", fontWeight: 500, marginBottom: 4 }}>
                    {t.photoLog.tapPhoto}
                  </div>
                  <div style={{ fontSize: 12, color: "#334455" }}>
                    {t.photoLog.photoHint}
                  </div>
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              style={{ display: "none" }} onChange={handlePhoto} />
          </div>
        )}

        {/* Log Type */}
        <div className="label">{t.photoLog.typeLabel}</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {LOG_TYPES.map(lt => (
            <button key={lt.type} className="type-btn"
              onClick={() => setLogType(lt.type)}
              style={{
                background: logType === lt.type ? "rgba(255,107,107,0.12)" : "rgba(255,255,255,0.04)",
                borderColor: logType === lt.type ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.08)",
                color: logType === lt.type ? "#FF6B6B" : "#556677",
              }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{lt.icon}</div>
              {t.logTypes[lt.type]}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="label">{t.photoLog.descLabel}</div>
        <textarea
          className="input-field"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder={t.photoLog.descPlaceholder}
          rows={3}
          style={{ resize: "none", lineHeight: 1.6 }}
        />

        {/* Amount + Age */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="label">{t.photoLog.amountLabel}</div>
            <input className="input-field" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={t.photoLog.amountPlaceholder} type="number"
              style={{ marginBottom: 0 }} />
          </div>
          <div style={{ width: 100 }}>
            <div className="label">{t.photoLog.ageLabel}</div>
            <input className="input-field" value={age}
              onChange={e => setAge(e.target.value)}
              placeholder={t.photoLog.agePlaceholder} type="number"
              style={{ marginBottom: 0 }} />
          </div>
        </div>

        {saveError && (
          <div style={{
            marginTop: 10, padding: "8px 12px",
            background: "rgba(255,107,107,0.1)",
            border: "1px solid rgba(255,107,107,0.25)",
            borderRadius: 10, color: "#FF6B6B", fontSize: 12,
          }}>{saveError}</div>
        )}

        <button onClick={handleSave} style={{
          width: "100%", padding: "15px", borderRadius: 16,
          background: saved
            ? "linear-gradient(135deg, #4ECDC4, #45B7D1)"
            : "linear-gradient(135deg, #FF6B6B, #FFE66D)",
          border: "none", cursor: "pointer",
          fontWeight: 700, color: "#000", fontSize: 16,
          fontFamily: "'DM Sans', sans-serif",
          marginTop: 16, transition: "all 0.3s",
          boxShadow: saved ? "0 4px 20px rgba(78,205,196,0.3)" : "0 4px 20px rgba(255,107,107,0.3)",
          opacity: !selectedChildId || !desc ? 0.5 : 1,
        }}>
          {saved ? t.photoLog.saved : t.photoLog.save}
        </button>

        {/* Recent Logs */}
        {recentLogs.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div className="label">{t.photoLog.recentLogs}</div>
            {recentLogs.map((log, i) => {
              return (
                <div key={log.id} className="recent-log" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${log.child.color}18`,
                    border: `1px solid ${log.child.color}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}>{log.child.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#ddeeff" }}>{log.desc}</div>
                    <div style={{ fontSize: 11, color: "#445566", marginTop: 2 }}>
                      {log.child.name} · {t.logTypes[log.type]}
                      {log.createdAt ? ` · ${formatDate(log.createdAt)}` : ""}
                    </div>
                  </div>
                  {log.amount > 0 && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FFE66D" }}>
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
