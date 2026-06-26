import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Anthropic from "@anthropic-ai/sdk";
import { auth, db } from "../firebase";
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  increment, serverTimestamp, query, orderBy, limit,
} from "firebase/firestore";
import { useLanguage } from "../hooks/useLanguage";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Camera, Gift, Sparkle, PencilSimple, Clock, CurrencyDollar, GraduationCap, UsersThree, Heart, Heartbeat, MagicWand } from "@phosphor-icons/react";

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
    font-size: 13px; letter-spacing: 2.5px; text-transform: uppercase;
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
  .glass-input::placeholder { color: #6b5a9e; }

  .type-btn {
    flex: 1; padding: 12px 4px; border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.9);
    background: rgba(255,255,255,0.65);
    backdrop-filter: blur(10px);
    color: #6b5a9e; cursor: pointer; font-size: 13px;
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

// Unified categories — these match the Dashboard fairness radar dimensions,
// so every log entry fills the radar and the two screens stay consistent.
const CATEGORIES = [
  { key: "time",        Icon: Clock },
  { key: "money",       Icon: CurrencyDollar },
  { key: "gifts",       Icon: Gift },
  { key: "school",      Icon: GraduationCap },
  { key: "oneOnOne",    Icon: UsersThree },
  { key: "emotional",   Icon: Heart },
  { key: "experiences", Icon: Sparkle },
  { key: "health",      Icon: Heartbeat },
];
const CATEGORY_KEYS = CATEGORIES.map(c => c.key);

// Current age derived live from birth year; falls back to a stored age for older records.
const currentAge = (c) => c?.birthYear ? Math.max(0, new Date().getFullYear() - Number(c.birthYear)) : (c?.age ?? "");

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function PhotoLogScreen() {
  const { t, titleFont } = useLanguage();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [logType, setLogType] = useState("time");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [hours, setHours] = useState("");   // duration for the "time" category
  const [times, setTimes] = useState("");
  const [age, setAge] = useState("");
  const [photo, setPhoto] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedText, setScannedText] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeMode, setActiveMode] = useState("photo");
  const [saveError, setSaveError] = useState("");
  // Log date: "today" (now) or "other" (a picked calendar date).
  const [dateMode, setDateMode] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [showCal, setShowCal] = useState(false);
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [calM, setCalM] = useState(new Date().getMonth());
  // "Write it all at once" free-text → AI splits into categorized entries.
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
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
        query(collection(db, "users", uid, "children", child.id, "logs"), orderBy("createdAt", "desc"), limit(3)),
        snap => {
          const logs = snap.docs.map(d => ({ id: d.id, child, ...d.data() }));
          setRecentLogs(prev => {
            const others = prev.filter(l => l.child.id !== child.id);
            return [...others, ...logs]
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
              .slice(0, 3);
          });
        }
      )
    );
    return () => unsubs.forEach(u => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, childIdsKey]);

  const selectedChild = children.find(c => c.id === selectedChildId) || null;

  const scanImage = async (base64, mediaType, previewUrl) => {
    setPhoto(previewUrl);
    setScanning(true); setScannedText("");
    try {
      const message = await client.messages.create({
        model: MODEL, max_tokens: 256,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 } },
          { type: "text", text: `Look at this image. Extract:\n- Item name/description\n- Amount/price if visible\n- Category, one of: time, money, gifts, school, oneOnOne, emotional, experiences, health\n(time=time spent together, money=an expense/shopping, gifts=a present, school=school activity/trip, oneOnOne=one-on-one time, emotional=affection/comfort, experiences=fun/outings/travel, health=health/exercise/doctor)\nReturn as JSON only: {"desc":"...","amount":"...","category":"gifts"}` },
        ]}],
      });
      const clean = message.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(clean);
      setDesc(parsed.desc || "");
      setAmount(parsed.amount ? String(parsed.amount).replace(/[^0-9.]/g, "") : "");
      if (parsed.category && CATEGORY_KEYS.includes(parsed.category)) setLogType(parsed.category);
      setScannedText(t.photoLog.detected(parsed.desc, parsed.amount ? String(parsed.amount).replace(/[^0-9.]/g, "") : ""));
    } catch (err) {
      console.error("Vision scan error:", err);
      setScannedText(t.photoLog.couldntRead);
    } finally { setScanning(false); }
  };

  // Web (browser): use the hidden file input.
  const handleFileInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await toBase64(file);
    scanImage(base64, file.type, URL.createObjectURL(file));
  };

  // Native app: tap shows a "Camera / Gallery" chooser via the Capacitor Camera plugin.
  const takeOrUploadPhoto = async () => {
    if (!Capacitor.isNativePlatform()) {
      fileRef.current.click();
      return;
    }
    try {
      const shot = await CapCamera.getPhoto({
        source: CameraSource.Prompt,   // shows a Camera / Photos choice
        resultType: CameraResultType.Base64,
        quality: 80,
        promptLabelHeader: t.photoLog.photoSource || "Add Photo",
        promptLabelPhoto: t.photoLog.fromGallery || "Choose from Gallery",
        promptLabelPicture: t.photoLog.takePhoto || "Take Photo",
        promptLabelCancel: t.photoLog.cancel || "Cancel",
      });
      const mediaType = `image/${shot.format || "jpeg"}`;
      scanImage(shot.base64String, mediaType, `data:${mediaType};base64,${shot.base64String}`);
    } catch (e) {
      // User canceled the prompt — do nothing.
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setScanning(false);
    setScannedText("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // The timestamp a new log should carry — the picked calendar date, or "now".
  const logCreatedAt = () => (dateMode === "other" && customDate)
    ? new Date(customDate + "T12:00:00")
    : serverTimestamp();

  // When a past date is picked, default the age to the child's age in that year.
  const onPickDate = (value) => {
    setCustomDate(value);
    if (value && selectedChild?.birthYear) {
      setAge(String(Math.max(0, Number(value.slice(0, 4)) - Number(selectedChild.birthYear))));
    }
  };

  const openCalendar = () => {
    const base = customDate ? new Date(customDate + "T12:00:00") : new Date();
    setCalY(base.getFullYear());
    setCalM(base.getMonth());
    setShowCal(true);
  };
  const shiftMonth = (delta) => {
    let m = calM + delta, y = calY;
    if (m < 0) { m = 11; y -= 1; } else if (m > 11) { m = 0; y += 1; }
    setCalM(m); setCalY(y);
  };
  const pickDay = (day) => {
    const val = `${calY}-${String(calM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onPickDate(val);
    setShowCal(false);
  };

  // Writes one categorized log entry and bumps the child's total spend.
  const writeLog = async (userUid, childId, entry) => {
    const amt = parseFloat(entry.amount) || 0;
    await addDoc(collection(db, "users", userUid, "children", childId, "logs"), {
      category: entry.category,
      desc: entry.desc || "",
      amount: amt,
      hours: parseFloat(entry.hours) || 0,
      times: Math.max(1, parseInt(entry.times) || 1),
      age: entry.age ?? null,
      photoUrl: entry.photoUrl || null,
      createdAt: logCreatedAt(),
    });
    await updateDoc(doc(db, "users", userUid, "children", childId), {
      totalSpent: increment(amt),
    });
  };

  // Missing-field nudges (shown but never block saving).
  const suggestions = useMemo(() => {
    const s = [];
    if (!desc.trim()) s.push(t.photoLog.suggestDesc);
    if (logType === "time") {
      if (!hours) s.push(t.photoLog.suggestHours);
    } else if (!amount) {
      s.push(t.photoLog.suggestAmount);
    }
    if (!photo) s.push(t.photoLog.suggestPhoto);
    return s;
  }, [desc, amount, hours, logType, photo, t]);

  const handleSave = async () => {
    if (!selectedChildId) { setSaveError(t.photoLog.pickChild); return; }
    setSaveError("");
    const user = auth.currentUser;
    if (!user) { setSaveError(t.photoLog.mustLogin); return; }
    try {
      // Blank fields are allowed — description falls back to the category label.
      await writeLog(user.uid, selectedChildId, {
        category: logType,
        desc: desc.trim() || t.categories[logType],
        amount,
        hours,
        times,
        age: parseFloat(age) || Number(currentAge(selectedChild)) || null,
        photoUrl: photo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setDesc(""); setAmount(""); setHours(""); setTimes(""); setPhoto(null); setScannedText("");
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(t.photoLog.saveFailed);
    }
  };

  // "Write it all at once": AI splits free text into separate categorized entries.
  const runBulkParse = async () => {
    if (!bulkText.trim()) return;
    setSaveError(""); setBulkBusy(true); setBulkResult(null);
    try {
      const message = await client.messages.create({
        model: MODEL, max_tokens: 700,
        messages: [{ role: "user", content: [{ type: "text", text:
          `The user logs things they did for or with their child, in free text (often Korean). Split it into separate entries. For each, pick a category from: time, money, gifts, school, oneOnOne, emotional, experiences, health (time=time spent together, money=an expense/shopping, gifts=a present, school=school activity/trip, oneOnOne=one-on-one time, emotional=affection/comfort/praise, experiences=fun/outings/travel, health=health/exercise/doctor). Give a short description, a numeric amount if a price is mentioned (else 0), and "times" = how many times it happened (e.g. "played soccer twice" → 2; default 1).\nText: """${bulkText}"""\nReturn JSON only as an array: [{"category":"gifts","desc":"...","amount":0,"times":1}]` }]}],
      });
      const clean = message.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      let entries = JSON.parse(clean);
      if (!Array.isArray(entries)) entries = [entries];
      entries = entries.filter(e => e && CATEGORY_KEYS.includes(e.category));
      setBulkResult(entries);
    } catch (err) {
      console.error("Bulk parse error:", err);
      setSaveError(t.photoLog.couldntRead);
    } finally { setBulkBusy(false); }
  };

  const saveBulk = async () => {
    const user = auth.currentUser;
    if (!user) { setSaveError(t.photoLog.mustLogin); return; }
    if (!selectedChildId) { setSaveError(t.photoLog.pickChild); return; }
    if (!bulkResult?.length) return;
    try {
      const ageVal = parseFloat(age) || Number(currentAge(selectedChild)) || null;
      for (const e of bulkResult) {
        await writeLog(user.uid, selectedChildId, {
          category: e.category, desc: e.desc || t.categories[e.category],
          amount: e.amount, times: e.times, age: ageVal, photoUrl: null,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setBulkText(""); setBulkResult(null);
    } catch (err) {
      console.error("Bulk save error:", err);
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

      {/* Centered calendar popup */}
      {showCal && (() => {
        const navBtn = {
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.07)",
          color: "#7C3AED", fontSize: 16, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        };
        const now = new Date();
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const daysInMonth = new Date(calY, calM + 1, 0).getDate();
        const firstWeekday = new Date(calY, calM, 1).getDay();
        return (
          <div onClick={() => setShowCal(false)} style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(30,15,60,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              width: "100%", maxWidth: 360,
              background: "rgba(255,255,255,0.98)", borderRadius: 24,
              padding: 22, boxShadow: "0 24px 70px rgba(30,15,60,0.35)",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {/* Year + month navigation */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
                <button onClick={() => setCalY(calY - 1)} style={navBtn} aria-label="prev year">«</button>
                <button onClick={() => shiftMonth(-1)} style={navBtn} aria-label="prev month">‹</button>
                <div style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 700, color: "#1e0f3c" }}>
                  {t.photoLog.monthYear(calY, calM + 1)}
                </div>
                <button onClick={() => shiftMonth(1)} style={navBtn} aria-label="next month">›</button>
                <button onClick={() => setCalY(calY + 1)} style={navBtn} aria-label="next year">»</button>
              </div>

              {/* Weekday header */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
                {t.photoLog.weekdays.map((w, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 13, fontWeight: 600, padding: "4px 0", color: i === 0 ? "#EC4899" : "#6b5a9e" }}>{w}</div>
                ))}
              </div>

              {/* Day grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {Array.from({ length: firstWeekday }).map((_, i) => <div key={`b${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const d = new Date(calY, calM, day);
                  const isFuture = d > todayOnly;
                  const dateStr = `${calY}-${String(calM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSel = customDate === dateStr;
                  const isToday = d.getTime() === todayOnly.getTime();
                  return (
                    <button key={day} disabled={isFuture} onClick={() => pickDay(day)} style={{
                      aspectRatio: "1", border: "none", borderRadius: 12,
                      cursor: isFuture ? "default" : "pointer",
                      background: isSel ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                        : isToday ? "rgba(124,58,237,0.12)" : "transparent",
                      color: isFuture ? "#d8cfe8" : isSel ? "#fff" : "#1e0f3c",
                      fontSize: 15, fontWeight: isSel || isToday ? 700 : 500,
                      fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s",
                    }}>{day}</button>
                  );
                })}
              </div>

              <button onClick={() => setShowCal(false)} style={{
                width: "100%", marginTop: 16, padding: "12px", borderRadius: 14, border: "none",
                background: "rgba(124,58,237,0.08)", color: "#7C3AED", fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>{t.photoLog.cancel}</button>
            </div>
          </div>
        );
      })()}

      <div style={{ padding: "36px 24px 20px" }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
          {t.photoLog.subtitle}
        </div>
        <h1 style={{ fontFamily: titleFont, fontSize: 36, fontWeight: 400, lineHeight: 1.1, letterSpacing: 0 }}>
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
            { id: "smart", Icon: MagicWand, label: t.photoLog.smartLog },
            { id: "quick", Icon: PencilSimple, label: t.photoLog.quickLog },
          ].map(({ id, Icon, label }) => {
            const active = activeMode === id;
            return (
              <button key={id} onClick={() => setActiveMode(id)} style={{
                flex: 1, padding: "12px 4px", borderRadius: 13,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: active ? "rgba(217,119,6,0.1)" : "none",
                border: active ? "1px solid rgba(217,119,6,0.3)" : "1px solid transparent",
                color: active ? "#EA580C" : "#a394c8",
                cursor: "pointer", fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}>
                <Icon size={17} weight={active ? "duotone" : "regular"} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Child Selector */}
        <div className="label">{t.photoLog.whoFor}</div>
        {childrenLoading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#6b5a9e", fontSize: 15, position: "relative", zIndex: 1 }}>
            {t.photoLog.loadingChildren}
          </div>
        ) : children.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "20px",
            background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 18, color: "#6b5a9e", fontSize: 15, marginBottom: 24,
            position: "relative", zIndex: 1,
          }}>{t.photoLog.noChildren}</div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {children.map((c, i) => (
              <button key={c.id} onClick={() => { setSelectedChildId(c.id); setAge(String(currentAge(c))); }}
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
                <KidIcon emoji={c.emoji} size={28} color={selectedChildId === c.id ? c.color : "#6b5a9e"} />
                <div style={{ fontSize: 13, color: selectedChildId === c.id ? c.color : "#6b5a9e", marginTop: 6, fontWeight: 600 }}>
                  {c.name}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* When? — Today or a picked calendar date */}
        <div className="label">{t.photoLog.whenLabel}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: dateMode === "other" ? 12 : 24, position: "relative", zIndex: 1 }}>
          {[
            { id: "today", label: t.photoLog.today },
            { id: "other", label: t.photoLog.otherDay },
          ].map(({ id, label }) => {
            const active = dateMode === id;
            return (
              <button key={id} onClick={() => setDateMode(id)} style={{
                flex: 1, padding: "12px", borderRadius: 14,
                border: active ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.95)",
                background: active ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.65)",
                color: active ? "#7C3AED" : "#6b5a9e",
                cursor: "pointer", fontSize: 14, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                boxShadow: active ? "0 4px 16px rgba(124,58,237,0.12)" : "0 2px 8px rgba(139,92,246,0.05)",
              }}>{label}</button>
            );
          })}
        </div>
        {dateMode === "other" && (
          <button onClick={openCalendar} style={{
            width: "100%", marginBottom: 24, padding: "15px 18px", borderRadius: 14,
            border: "1px solid rgba(124,58,237,0.25)", background: "rgba(255,255,255,0.8)",
            color: customDate ? "#1e0f3c" : "#c4b8e0", fontSize: 16,
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(139,92,246,0.06)",
          }}>
            {customDate
              ? `${customDate.slice(0, 4)}. ${customDate.slice(5, 7)}. ${customDate.slice(8, 10)}`
              : t.photoLog.pickDate}
            <span style={{ fontSize: 18 }}>📅</span>
          </button>
        )}

        {/* SMART (write-it-all) MODE */}
        {activeMode === "smart" && (
          <div style={{ marginBottom: 24, animation: "fadeUp 0.4s ease both", position: "relative", zIndex: 1 }}>
            <textarea className="glass-input" value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={t.photoLog.smartPlaceholder} rows={4}
              style={{ resize: "none", lineHeight: 1.7 }} />
            <button onClick={runBulkParse} disabled={bulkBusy || !bulkText.trim()} style={{
              width: "100%", padding: "15px", borderRadius: 16, border: "none",
              background: bulkBusy || !bulkText.trim() ? "rgba(217,119,6,0.12)" : "linear-gradient(135deg, #EA580C, #F59E0B)",
              color: bulkBusy || !bulkText.trim() ? "#c4a484" : "#fff",
              fontSize: 15, fontWeight: 700, cursor: bulkBusy || !bulkText.trim() ? "default" : "pointer",
              fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <MagicWand size={18} weight="duotone" />
              {bulkBusy ? t.photoLog.smartAnalyzing : t.photoLog.smartAnalyze}
            </button>

            {bulkResult && (
              <div style={{ marginTop: 16 }}>
                {bulkResult.length === 0 ? (
                  <div style={{ fontSize: 14, color: "#6b5a9e", textAlign: "center", padding: 12 }}>
                    {t.photoLog.smartNone}
                  </div>
                ) : (
                  <>
                    <div className="label">{t.photoLog.smartFound(bulkResult.length)}</div>
                    {bulkResult.map((e, i) => (
                      <div key={i} className="recent-log" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#7C3AED", textAlign: "center", lineHeight: 1.1,
                        }}>{t.categories[e.category]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, color: "#1e0f3c", fontWeight: 500 }}>{e.desc}</div>
                        </div>
                        {Number(e.amount) > 0 && (
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#7C3AED", fontFamily: titleFont }}>${e.amount}</div>
                        )}
                      </div>
                    ))}
                    <button onClick={saveBulk} style={{
                      width: "100%", padding: "16px", borderRadius: 18, border: "none", marginTop: 8,
                      background: saved ? "linear-gradient(135deg, #10B981, #06B6D4)" : "linear-gradient(135deg, #7C3AED, #EC4899)",
                      color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: !selectedChildId ? 0.45 : 1,
                    }}>
                      {saved ? t.photoLog.saved : t.photoLog.smartSaveAll(bulkResult.length)}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* PHOTO MODE */}
        {activeMode === "photo" && (
          <div style={{ marginBottom: 24, animation: "fadeUp 0.4s ease both", position: "relative", zIndex: 1 }}>
            <div className="photo-zone" onClick={takeOrUploadPhoto}>
              {scanning && <div className="scan-line" />}
              {photo && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearPhoto(); }}
                  aria-label="Remove photo"
                  style={{
                    position: "absolute", top: 12, right: 12, zIndex: 2,
                    width: 34, height: 34, borderRadius: "50%",
                    border: "none", cursor: "pointer",
                    background: "rgba(30,15,60,0.55)",
                    backdropFilter: "blur(8px)",
                    color: "#fff", fontSize: 20, lineHeight: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                  }}
                >
                  ✕
                </button>
              )}
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
                  <div style={{ fontSize: 14, color: "#6b5a9e" }}>{t.photoLog.photoHint}</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: "none" }} onChange={handleFileInput} />
          </div>
        )}

        {activeMode !== "smart" && (
        <>
        {/* Category */}
        <div className="label">{t.photoLog.typeLabel}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20, position: "relative", zIndex: 1 }}>
          {CATEGORIES.map(({ key, Icon }) => {
            const isActive = logType === key;
            return (
              <button key={key} className="type-btn"
                onClick={() => setLogType(key)}
                style={{
                  background: isActive ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.65)",
                  borderColor: isActive ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.95)",
                  color: isActive ? "#7C3AED" : "#6b5a9e",
                  boxShadow: isActive ? "0 4px 16px rgba(124,58,237,0.12)" : "0 2px 8px rgba(139,92,246,0.05)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "10px 2px", fontSize: 13, lineHeight: 1.15,
                }}>
                <Icon size={22} weight="duotone" color={isActive ? "#7C3AED" : "#6b5a9e"} />
                {t.categories[key]}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <div className="label">{t.photoLog.descLabel}</div>
        <textarea className="glass-input" value={desc} onChange={e => setDesc(e.target.value)}
          placeholder={t.photoLog.descPlaceholder} rows={3}
          style={{ resize: "none", lineHeight: 1.7, marginBottom: 8 }} />
        <div style={{ fontSize: 15, color: "#6b5a9e", margin: "0 0 14px", paddingLeft: 4, lineHeight: 1.7 }}>
          💡 {t.photoLog.descExample}
        </div>

        {/* Amount + Times + Age */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          {logType === "time" ? (
            <div style={{ flex: 1 }}>
              <div className="label">{t.photoLog.hoursLabel}</div>
              <input className="glass-input" value={hours} onChange={e => setHours(e.target.value)}
                placeholder={t.photoLog.hoursPlaceholder} type="number" min="0" step="0.5" style={{ marginBottom: 0 }} />
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div className="label">{t.photoLog.amountLabel}</div>
              <input className="glass-input" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={t.photoLog.amountPlaceholder} type="number" style={{ marginBottom: 0 }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div className="label">{t.photoLog.timesLabel}</div>
            <input className="glass-input" value={times} onChange={e => setTimes(e.target.value)}
              placeholder={t.photoLog.timesPlaceholder} type="number" min="1" style={{ marginBottom: 0 }} />
          </div>
          <div style={{ width: 92 }}>
            <div className="label">{t.photoLog.ageLabel}</div>
            <input className="glass-input" value={age} onChange={e => setAge(e.target.value)}
              placeholder={t.photoLog.agePlaceholder} type="number" style={{ marginBottom: 0 }} />
          </div>
        </div>

        {suggestions.length > 0 && (
          <div style={{
            marginTop: 14, padding: "12px 16px",
            background: "rgba(217,119,6,0.07)", border: "1px solid rgba(217,119,6,0.18)",
            borderRadius: 14, color: "#92400e", fontSize: 13, lineHeight: 1.6,
          }}>
            💡 {t.photoLog.suggestIntro} {suggestions.join(", ")}
          </div>
        )}

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
          opacity: !selectedChildId ? 0.45 : 1,
          position: "relative", zIndex: 1,
        }}>
          {saved ? t.photoLog.saved : t.photoLog.save}
        </button>
        </>
        )}

        {recentLogs.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div className="label">{t.photoLog.recentLogs}</div>
            {recentLogs.map((log, i) => (
              <div key={log.id} className="recent-log"
                style={{ animationDelay: `${i * 0.08}s` }}>
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
                  <div style={{ fontSize: 15, color: "#6b5a9e", marginTop: 3 }}>
                    {log.child.name} · {t.categories[log.category] || t.logTypes[log.type] || ""}
                    {log.createdAt ? ` · ${formatDate(log.createdAt)}` : ""}
                  </div>
                </div>
                {log.amount > 0 && (
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: "#7C3AED",
                    fontFamily: titleFont,
                  }}>${log.amount}</div>
                )}
                {!(log.amount > 0) && log.hours > 0 && (
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: "#6366F1",
                    fontFamily: titleFont,
                  }}>{t.photoLog.hoursDisplay(log.hours)}</div>
                )}
                <button onClick={() => navigate(`/child/${log.child.id}/log/${log.id}`)} style={{
                  flexShrink: 0, padding: "7px 12px", borderRadius: 12,
                  border: "1px solid rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.07)",
                  color: "#7C3AED", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5,
                }}>
                  <PencilSimple size={15} weight="bold" /> {t.logEdit.edit}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
