import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";
import LifeLineGraph from "./LifeLineGraph";
import Tour from "../components/Tour";
import { UsersThree } from "@phosphor-icons/react";

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

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
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
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
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

  .glass-card {
    background: rgba(255,255,255,0.68);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 24px;
    padding: 22px;
    margin-bottom: 14px;
    animation: fadeUp 0.5s ease both;
    box-shadow: 0 8px 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1);
    position: relative; z-index: 1;
  }

  .label {
    font-size: 13px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: #6b5a9e;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 16px;
  }

  .child-row {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 18px;
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 20px; margin-bottom: 10px;
    cursor: pointer; transition: all 0.25s;
    border: 1px solid rgba(255,255,255,0.95);
    animation: slideIn 0.4s ease both;
    box-shadow: 0 4px 20px rgba(139,92,246,0.08);
    position: relative; z-index: 1;
  }
  .child-row:hover {
    background: rgba(255,255,255,0.9);
    transform: translateX(6px);
    box-shadow: 0 8px 32px rgba(139,92,246,0.15);
  }

  .alert-card {
    border-radius: 20px; padding: 18px 20px;
    margin-bottom: 12px; animation: fadeUp 0.5s ease both;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 4px 24px rgba(139,92,246,0.08);
    position: relative; z-index: 1;
  }

  .score-ring { animation: countUp 0.8s cubic-bezier(0.34,1.56,0.64,1) both; }

  .age-badge {
    background: rgba(124,58,237,0.1);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 8px; padding: 3px 10px;
    font-size: 13px; color: #7C3AED; font-weight: 600;
  }
`;

// Comparison metrics — broad categories plus keyword-matched sub-items.
const reBirthday = /birthday|생일/i;
const reChristmas = /christmas|크리스마스|성탄/i;
const reClothes = /cloth|옷|dress|jacket|coat|shirt|pants|shoe|신발|패딩|니트|바지|치마|점퍼/i;
const reEducation = /education|학원|교육|tuition|학비|lesson|레슨|academy|과외|수업|문제집/i;
const sumAmt = (logs) => logs.reduce((s, l) => s + (Number(l.amount) || 0), 0);
// Count metrics sum "times" (how many times it happened), defaulting to 1 per log.
const sumTimes = (logs) => logs.reduce((s, l) => s + (Number(l.times) || 1), 0);
const catOf = (l) => l.category
  || ({ gift: "gifts", experience: "experiences", milestone: "experiences", note: "experiences" })[l.type]
  || l.type;

// A distinct accent color per comparison metric (for the colorful glass pills).
const CMP_COLORS = {
  all: "#7C3AED", money: "#EA580C", birthday: "#EC4899", time: "#6366F1",
  oneOnOne: "#14B8A6", school: "#F59E0B", christmas: "#DC2626",
  clothes: "#F43F5E", education: "#3B82F6",
};

const COMPARE_METRICS = [
  { key: "all",       money: false, calc: () => 0 },
  { key: "money",     money: true,  calc: (logs) => sumAmt(logs) },
  { key: "birthday",  money: false, calc: (logs) => sumTimes(logs.filter(l => catOf(l) === "gifts" && reBirthday.test(l.desc || ""))) },
  { key: "time",      money: false, calc: (logs) => sumTimes(logs.filter(l => catOf(l) === "time")) },
  { key: "oneOnOne",  money: false, calc: (logs) => sumTimes(logs.filter(l => catOf(l) === "oneOnOne")) },
  { key: "school",    money: false, calc: (logs) => sumTimes(logs.filter(l => catOf(l) === "school")) },
  { key: "christmas", money: false, calc: (logs) => sumTimes(logs.filter(l => catOf(l) === "gifts" && reChristmas.test(l.desc || ""))) },
  { key: "clothes",   money: true,  calc: (logs) => sumAmt(logs.filter(l => reClothes.test(l.desc || ""))) },
  { key: "education", money: true,  calc: (logs) => sumAmt(logs.filter(l => reEducation.test(l.desc || ""))) },
];

export default function DashboardScreen() {
  const navigate = useNavigate();
  const [showTour, setShowTour] = useState(false);
  const [compareMetric, setCompareMetric] = useState("all");
  // Which "All"-mode event cells are expanded (key: `${childId}-${age}`).
  const [expandedCells, setExpandedCells] = useState({});
  const toggleCell = (key) => setExpandedCells(p => ({ ...p, [key]: !p[key] }));
  const { t, titleFont } = useLanguage();

  const [rawChildren, setRawChildren] = useState([]);
  const [childLogs, setChildLogs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    return onSnapshot(collection(db, "users", uid, "children"), snap => {
      const kids = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      kids.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setRawChildren(kids);
      setLoading(false);
    });
  }, []);

  const childIdsKey = rawChildren.map(c => c.id).sort().join(",");
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !childIdsKey) return;
    const ids = childIdsKey.split(",").filter(Boolean);
    const unsubs = ids.map(cid =>
      onSnapshot(collection(db, "users", uid, "children", cid, "logs"), snap => {
        setChildLogs(prev => ({
          ...prev,
          [cid]: snap.docs.map(d => ({ id: d.id, ...d.data() })),
        }));
      }),
    );
    return () => unsubs.forEach(u => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childIdsKey]);

  const children = useMemo(() => {
    if (!rawChildren.length) return [];
    const CATS = ["time", "money", "gifts", "school", "oneOnOne", "emotional", "experiences", "health"];
    const LEGACY = { gift: "gifts", experience: "experiences", milestone: "experiences", note: "experiences" };
    // Count actual log entries per category; "money" uses total amount spent.
    const metrics = rawChildren.map(c => {
      const logs = childLogs[c.id] || [];
      const counts = Object.fromEntries(CATS.map(k => [k, 0]));
      let totalSpent = 0;
      logs.forEach(l => {
        const cat = l.category || LEGACY[l.type] || l.type; // backward compat with old logs
        if (counts[cat] !== undefined) counts[cat] += Number(l.times) || 1;
        totalSpent += Number(l.amount) || 0;
      });
      return {
        ...c, logs, counts, totalSpent,
        giftCount: counts.gifts, experienceCount: counts.experiences,
      };
    });
    const maxCount = {};
    CATS.forEach(k => { maxCount[k] = Math.max(...metrics.map(m => m.counts[k]), 1); });
    const maxSpent = Math.max(...metrics.map(m => m.totalSpent), 1);
    return metrics.map(c => ({
      ...c,
      scores: {
        time: Math.round((c.counts.time / maxCount.time) * 100),
        money: Math.round((c.totalSpent / maxSpent) * 100),
        gifts: Math.round((c.counts.gifts / maxCount.gifts) * 100),
        school: Math.round((c.counts.school / maxCount.school) * 100),
        oneOnOne: Math.round((c.counts.oneOnOne / maxCount.oneOnOne) * 100),
        emotional: Math.round((c.counts.emotional / maxCount.emotional) * 100),
        experiences: Math.round((c.counts.experiences / maxCount.experiences) * 100),
        health: Math.round((c.counts.health / maxCount.health) * 100),
      },
    }));
  }, [rawChildren, childLogs]);

  const fairness = useMemo(() => {
    if (children.length < 2) return 100;
    const avgs = children.map(c => Object.values(c.scores).reduce((a, b) => a + b) / 8);
    const maxAvg = Math.max(...avgs);
    if (maxAvg === 0) return 100; // no logs yet → nothing unfair
    return Math.round((Math.min(...avgs) / maxAvg) * 100);
  }, [children]);

  const radarData = useMemo(() =>
    t.dashboard.radarCats.map(cat => {
      const entry = { cat: cat.label };
      children.forEach(c => { entry[c.name] = c.scores[cat.key]; });
      return entry;
    }), [children, t]);

  const dynamicAlerts = useMemo(() => {
    if (children.length < 2) return [];
    const alerts = [];
    const sorted = [...children].sort((a, b) => {
      const avgA = Object.values(a.scores).reduce((s, v) => s + v) / 8;
      const avgB = Object.values(b.scores).reduce((s, v) => s + v) / 8;
      return avgA - avgB;
    });
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];
    if (best.totalSpent > 0 && worst.totalSpent < best.totalSpent * 0.5)
      alerts.push({ child: worst, urgent: true, msg: t.dashboard.alertSpending(worst.name, best.name) });
    if (best.giftCount > 1 && worst.giftCount < best.giftCount * 0.5)
      alerts.push({ child: worst, urgent: false, msg: t.dashboard.alertGifts(worst.name) });
    children.forEach(c => {
      if (!c.totalSpent && !c.giftCount && !c.experienceCount) {
        if (!alerts.some(a => a.child.id === c.id))
          alerts.push({ child: c, urgent: false, msg: t.dashboard.alertNoActivity(c.name) });
      }
    });
    return alerts.slice(0, 3);
  }, [children, t]);

  const ageGridAges = useMemo(() => {
    const ageSet = new Set();
    children.forEach(c => {
      (c.logs || []).forEach(l => { if (l.age) ageSet.add(Math.floor(Number(l.age))); });
      if (c.age) ageSet.add(Number(c.age));
    });
    return [...ageSet].sort((a, b) => a - b);
  }, [children]);

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16, position: "relative", zIndex: 1,
    }}>
      <style>{css}</style>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#4ECDC4",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ color: "#6a7f94", fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
        {t.dashboard.loading}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'DM Sans', sans-serif",
      color: "#1e0f3c", paddingBottom: 90, position: "relative", zIndex: 1,
    }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding: "36px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, letterSpacing: 3, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            {t.dashboard.greeting}
          </div>
          <h1 style={{
            fontFamily: titleFont,
            fontSize: 36, fontWeight: 400, lineHeight: 1.1, letterSpacing: 0,
          }}>
            {t.dashboard.titlePre}{" "}
            <span className="title-text">{t.dashboard.titleHighlight}</span>
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div className="score-ring" style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `conic-gradient(${fairness > 70 ? "#7C3AED" : "#EC4899"} ${fairness * 3.6}deg, rgba(139,92,246,0.08) 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 24px ${fairness > 70 ? "rgba(124,58,237,0.25)" : "rgba(236,72,153,0.25)"}`,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(10px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: fairness > 70 ? "#7C3AED" : "#EC4899", lineHeight: 1 }}>
              {fairness}%
            </div>
            <div style={{ fontSize: 8, color: "#6b5a9e", letterSpacing: 1.5, marginTop: 2 }}>{t.dashboard.fairLabel}</div>
          </div>
        </div>
          <button onClick={() => setShowTour(true)} style={{
            fontSize: 13, color: "#7C3AED", background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.25)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.3, padding: "5px 11px", borderRadius: 10, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 4,
            boxShadow: "0 2px 8px rgba(124,58,237,0.12)",
          }}>🧭 {t.tour.start}</button>
          <button data-tour="settings" onClick={() => navigate("/settings")} style={{
            fontSize: 13, color: "#6b5a9e", background: "none",
            border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.3, padding: 0, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 3,
          }}>⚙ {t.nav.settings}</button>
          <button onClick={() => signOut(auth)} style={{
            fontSize: 13, color: "#6b5a9e", background: "none",
            border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.3, padding: 0,
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* Empty state */}
        {children.length === 0 && (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            animation: "fadeUp 0.5s ease both",
          }}>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
              <UsersThree size={72} weight="duotone" color="#7C3AED" />
            </div>
            <div style={{
              fontFamily: titleFont,
              fontSize: 32, fontWeight: 600, marginBottom: 12,
            }}>{t.dashboard.noChildrenTitle}</div>
            <div style={{ color: "#6a7f94", fontSize: 16, lineHeight: 1.7 }}>{t.dashboard.noChildrenHint}</div>
          </div>
        )}

        {children.length > 0 && (
          <>
            <div className="label" style={{ paddingLeft: 4 }}>{t.dashboard.childrenLabel}</div>

            {children.map((c, i) => {
              const avg = Math.round(Object.values(c.scores).reduce((a, b) => a + b) / 8);
              return (
                <div key={c.id} className="child-row" {...(i === 0 ? { "data-tour": "children" } : {})} style={{ animationDelay: `${i * 0.09}s` }}
                  onClick={() => navigate(`/child/${c.id}`)}>
                  <div style={{
                    width: 58, height: 58, borderRadius: 18, flexShrink: 0,
                    background: `linear-gradient(135deg, ${c.color}35, ${c.color}18)`,
                    border: `2px solid ${c.color}50`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 16px ${c.color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}><KidIcon emoji={c.emoji} size={26} color={c.color} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: -0.2 }}>{c.name}</div>
                    <div style={{ fontSize: 15, color: "#6b5a9e", marginTop: 3 }}>
                      {t.childRoom.ageAt(c.age)}
                      {c.totalSpent > 0 && ` · $${c.totalSpent.toLocaleString()} ${t.dashboard.spent}`}
                      {(c.giftCount + c.experienceCount) > 0 && ` · ${c.giftCount + c.experienceCount} ${t.dashboard.events}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 4 }}>
                    <div style={{
                      fontSize: 20, fontWeight: 700, fontFamily: titleFont,
                      color: avg > 60 ? "#7C3AED" : avg > 40 ? "#EA580C" : "#EC4899",
                    }}>{avg}%</div>
                    <div style={{ fontSize: 13, color: "#445566", letterSpacing: 1 }}>{t.dashboard.score}</div>
                  </div>
                  <div style={{ color: "#6b5a9e", fontSize: 20 }}>›</div>
                </div>
              );
            })}

            <div data-tour="lifegraph"><LifeLineGraph /></div>

            {/* Radar Chart */}
            <div className="glass-card" data-tour="radar" style={{ animationDelay: "0.25s" }}>
              <div className="label">{t.dashboard.radarLabel}</div>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} margin={{ top: 4, right: 14, bottom: 4, left: 14 }}>
                  <PolarGrid stroke="rgba(139,92,246,0.1)" />
                  <PolarAngleAxis dataKey="cat" tick={{ fill: "#6b5a9e", fontSize: 14, fontFamily: "DM Sans" }} />
                  {children.map(c => (
                    <Radar key={c.id} name={c.name} dataKey={c.name}
                      stroke={c.color} fill={c.color} fillOpacity={0.18} strokeWidth={2} />
                  ))}
                  <Tooltip contentStyle={{
                    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.95)",
                    borderRadius: 14, fontFamily: "DM Sans", fontSize: 13, color: "#1e0f3c",
                  }} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 8 }}>
                {children.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, color: "#6b5a9e" }}>
                    <div style={{
                      width: 9, height: 9, borderRadius: 3,
                      background: c.color,
                      boxShadow: `0 0 8px ${c.color}66`,
                    }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Age Grid */}
            {ageGridAges.length > 0 && (() => {
              const metric = COMPARE_METRICS.find(m => m.key === compareMetric) || COMPARE_METRICS[0];
              const showVal = (v) => metric.money ? `$${v.toLocaleString()}` : t.dashboard.times(v);
              return (
              <div className="glass-card" data-tour="comparison" style={{ animationDelay: "0.35s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div className="label" style={{ marginBottom: 0 }}>{t.dashboard.ageGrid}</div>
                </div>

                {/* Metric buttons — tap one to compare just that item */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}>
                  {COMPARE_METRICS.map(m => {
                    const active = compareMetric === m.key;
                    const c = CMP_COLORS[m.key] || "#7C3AED";
                    return (
                      <button key={m.key} onClick={() => setCompareMetric(m.key)} style={{
                        flex: "0 0 auto", padding: "8px 15px", borderRadius: 13,
                        border: `1px solid ${active ? c + "cc" : c + "44"}`,
                        background: active
                          ? `linear-gradient(135deg, ${c}33, ${c}1f)`
                          : `linear-gradient(135deg, ${c}1c, ${c}0c)`,
                        color: c,
                        fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                        fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                        boxShadow: active
                          ? `0 4px 16px ${c}40, inset 0 1px 0 rgba(255,255,255,0.6)`
                          : `0 2px 8px ${c}1f, inset 0 1px 0 rgba(255,255,255,0.5)`,
                        transform: active ? "translateY(-1px)" : "none",
                      }}>{t.dashboard.cmp[m.key]}</button>
                    );
                  })}
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ color: "#6b5a9e", fontSize: 14, textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>
                          {t.dashboard.ageCol}
                        </th>
                        {children.map(c => (
                          <th key={c.id} style={{ color: c.color, fontSize: 14, textAlign: "center", padding: "4px 6px", fontWeight: 600 }}>
                            <KidIcon emoji={c.emoji} size={12} color={c.color} /> {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ageGridAges.map(age => {
                        const vals = children.map(c =>
                          metric.calc((c.logs || []).filter(l => Math.floor(Number(l.age)) === age)));
                        const maxVal = Math.max(...vals, 0);
                        return (
                        <tr key={age} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px 8px" }}>
                            <span className="age-badge">{age}</span>
                          </td>
                          {children.map((c, ci) => {
                            const logs = (c.logs || []).filter(l => Math.floor(Number(l.age)) === age);
                            const isCurrent = c.age === age;
                            if (compareMetric === "all") {
                              const cellKey = `${c.id}-${age}`;
                              const expanded = expandedCells[cellKey];
                              const shown = expanded ? logs : logs.slice(0, 3);
                              const extra = logs.length - 3;
                              return (
                                <td key={c.id} style={{ textAlign: "center", padding: "6px 4px" }}>
                                  {logs.length > 0
                                    ? <>
                                        {shown.map((l, i) => (
                                          <div key={i} style={{
                                            background: `${c.color}14`, border: `1px solid ${c.color}28`,
                                            borderRadius: 8, padding: "4px 7px",
                                            fontSize: 14, color: "#3a2a5e", marginBottom: 3,
                                          }}>{l.desc}</div>
                                        ))}
                                        {extra > 0 && (
                                          <button onClick={() => toggleCell(cellKey)} style={{
                                            marginTop: 2, padding: "3px 10px", borderRadius: 8,
                                            border: `1px solid ${c.color}44`, background: `${c.color}10`,
                                            color: c.color, fontSize: 13, fontWeight: 600, cursor: "pointer",
                                            fontFamily: "'DM Sans', sans-serif",
                                          }}>{expanded ? t.dashboard.collapse : t.dashboard.showMoreN(extra)}</button>
                                        )}
                                      </>
                                    : isCurrent
                                      ? <span style={{ fontSize: 16 }}>⚠️</span>
                                      : <span style={{ color: "#1a2a3a", fontSize: 13 }}>—</span>
                                  }
                                </td>
                              );
                            }
                            const v = vals[ci];
                            const isMax = v > 0 && v === maxVal;
                            return (
                              <td key={c.id} style={{ textAlign: "center", padding: "8px 4px" }}>
                                {v > 0
                                  ? <span style={{ fontSize: 15, fontWeight: isMax ? 700 : 500, color: isMax ? c.color : "#6b5a9e" }}>{showVal(v)}</span>
                                  : <span style={{ color: "#1a2a3a", fontSize: 13 }}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );})}

                      {compareMetric !== "all" && (() => {
                        const totals = children.map(c => metric.calc(c.logs || []));
                        const maxT = Math.max(...totals, 0);
                        return (
                          <tr style={{ borderTop: "2px solid rgba(255,255,255,0.14)" }}>
                            <td style={{ padding: "11px 8px", fontSize: 14, color: "#6b5a9e", fontWeight: 600 }}>
                              {t.dashboard.cmpTotal}
                            </td>
                            {children.map((c, ci) => {
                              const v = totals[ci];
                              const isMax = v > 0 && v === maxT;
                              return (
                                <td key={c.id} style={{ textAlign: "center", padding: "11px 4px" }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: isMax ? c.color : "#6b5a9e" }}>
                                    {v > 0 ? showVal(v) : "—"}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

              </div>
              );
            })()}

            {/* AI Alerts */}
            {dynamicAlerts.length > 0 && (
              <>
                <div className="label" style={{ paddingLeft: 4, marginTop: 4 }}>{t.dashboard.aiAlerts}</div>
                {dynamicAlerts.map((a, i) => (
                  <div key={i} className="alert-card" style={{
                    background: a.urgent ? "rgba(236,72,153,0.07)" : "rgba(255,255,255,0.72)",
                    border: `1px solid ${a.urgent ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.95)"}`,
                    animationDelay: `${0.4 + i * 0.08}s`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{
                        background: `${a.child.color}1a`, border: `1px solid ${a.child.color}40`,
                        borderRadius: 10, padding: "4px 12px",
                        fontSize: 15, color: a.child.color, fontWeight: 600,
                      }}>
                        <KidIcon emoji={a.child.emoji} size={13} color={a.child.color} /> {a.child.name}
                      </div>
                      {a.urgent && (
                        <span style={{
                          background: "rgba(236,72,153,0.12)", color: "#EC4899",
                          borderRadius: 8, padding: "2px 10px", fontSize: 14, fontWeight: 600,
                        }}>{t.dashboard.urgent}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 15, color: "#6b5b9e", lineHeight: 1.7, margin: 0 }}>{a.msg}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

      </div>

      {showTour && <Tour onClose={() => setShowTour(false)} />}
    </div>
  );
}
