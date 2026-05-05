import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";
import LifeLineGraph from "./LifeLineGraph";

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
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
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

  .card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 22px;
    padding: 18px;
    margin-bottom: 12px;
    animation: fadeUp 0.5s ease both;
  }

  .label {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #445566;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 12px;
  }

  .child-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px; background: rgba(255,255,255,0.04);
    border-radius: 16px; margin-bottom: 8px;
    cursor: pointer; transition: all 0.2s;
    border: 1px solid rgba(255,255,255,0.06);
    animation: slideIn 0.4s ease both;
  }
  .child-row:hover { background: rgba(255,255,255,0.08); transform: translateX(4px); }

  .alert {
    border-radius: 16px; padding: 14px 16px;
    margin-bottom: 10px; animation: fadeUp 0.5s ease both;
  }

  .score-ring { animation: countUp 0.8s cubic-bezier(0.34,1.56,0.64,1) both; }

  .age-badge {
    background: rgba(255,230,109,0.15);
    border: 1px solid rgba(255,230,109,0.3);
    border-radius: 8px; padding: 2px 8px;
    font-size: 11px; color: #FFE66D; font-weight: 600;
  }
`;

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [rawChildren, setRawChildren] = useState([]);
  const [childLogs, setChildLogs] = useState({});
  const [loading, setLoading] = useState(true);

  // Load children (real-time)
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

  // Load logs for each child whenever the set of child IDs changes
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
  }, [childIdsKey]);

  // Compute enriched children with relative scores
  const children = useMemo(() => {
    if (!rawChildren.length) return [];
    const metrics = rawChildren.map(c => ({
      ...c,
      totalSpent: c.totalSpent || 0,
      giftCount: c.giftCount || 0,
      experienceCount: c.experienceCount || 0,
      logs: childLogs[c.id] || [],
    }));
    const maxSpent = Math.max(...metrics.map(m => m.totalSpent), 1);
    const maxGifts = Math.max(...metrics.map(m => m.giftCount), 1);
    const maxExp = Math.max(...metrics.map(m => m.experienceCount), 1);
    return metrics.map(c => ({
      ...c,
      scores: {
        time: 50,
        money: Math.round((c.totalSpent / maxSpent) * 100),
        gifts: Math.round((c.giftCount / maxGifts) * 100),
        school: 50, oneOnOne: 50, emotional: 50,
        experiences: Math.round((c.experienceCount / maxExp) * 100),
        health: 50,
      },
    }));
  }, [rawChildren, childLogs]);

  const fairness = useMemo(() => {
    if (children.length < 2) return 100;
    const avgs = children.map(c => Object.values(c.scores).reduce((a, b) => a + b) / 8);
    return Math.round((Math.min(...avgs) / Math.max(...avgs)) * 100);
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
    if (best.totalSpent > 0 && worst.totalSpent < best.totalSpent * 0.5) {
      alerts.push({ child: worst, urgent: true, msg: t.dashboard.alertSpending(worst.name, best.name) });
    }
    if (best.giftCount > 1 && worst.giftCount < best.giftCount * 0.5) {
      alerts.push({ child: worst, urgent: false, msg: t.dashboard.alertGifts(worst.name) });
    }
    children.forEach(c => {
      if (!c.totalSpent && !c.giftCount && !c.experienceCount) {
        if (!alerts.some(a => a.child.id === c.id)) {
          alerts.push({ child: c, urgent: false, msg: t.dashboard.alertNoActivity(c.name) });
        }
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
    return [...ageSet].sort((a, b) => a - b).slice(0, 6);
  }, [children]);

  // Loading
  if (loading) return (
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
        {t.dashboard.loading}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 10%, #0f1e35 0%, #06090f 60%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e8f0f8",
      paddingBottom: 80,
    }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{
        padding: "28px 20px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#334455", textTransform: "uppercase", marginBottom: 4 }}>
            {t.dashboard.greeting}
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
            {t.dashboard.titlePre} <span className="shimmer">{t.dashboard.titleHighlight}</span>
          </h1>
        </div>

        {/* Fairness Ring */}
        <div className="score-ring" style={{
          width: 66, height: 66, borderRadius: "50%",
          background: `conic-gradient(${fairness > 70 ? "#4ECDC4" : "#FF6B6B"} ${fairness * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: "#06090f",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: fairness > 70 ? "#4ECDC4" : "#FF6B6B", lineHeight: 1 }}>
              {fairness}%
            </div>
            <div style={{ fontSize: 8, color: "#334455", letterSpacing: 1 }}>{t.dashboard.fairLabel}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Empty state */}
        {children.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            animation: "fadeUp 0.5s ease both",
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t.dashboard.noChildrenTitle}</div>
            <div style={{ color: "#445566", fontSize: 14 }}>{t.dashboard.noChildrenHint}</div>
          </div>
        )}

        {/* Children list */}
        {children.length > 0 && (
          <>
            <div className="label" style={{ paddingLeft: 4 }}>{t.dashboard.childrenLabel}</div>
            {children.map((c, i) => {
              const avg = Math.round(Object.values(c.scores).reduce((a, b) => a + b) / 8);
              return (
                <div key={c.id} className="child-row" style={{ animationDelay: `${i * 0.08}s` }}
                  onClick={() => navigate(`/child/${c.id}`)}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${c.color}18`, border: `2px solid ${c.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                  }}>{c.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#445566", marginTop: 2 }}>
                      {t.childRoom.ageAt(c.age)}
                      {c.totalSpent > 0 && ` · $${c.totalSpent.toLocaleString()} ${t.dashboard.spent}`}
                      {(c.giftCount + c.experienceCount) > 0 && ` · ${c.giftCount + c.experienceCount} ${t.dashboard.events}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700,
                      color: avg > 60 ? "#4ECDC4" : avg > 40 ? "#FFE66D" : "#FF6B6B",
                    }}>{avg}%</div>
                    <div style={{ fontSize: 9, color: "#334455" }}>{t.dashboard.score}</div>
                  </div>
                  <div style={{ color: "#2a3a4a", fontSize: 16 }}>›</div>
                </div>
              );
            })}

            {/* Life Graph */}
            <LifeLineGraph />

            {/* Radar Chart */}
            <div className="card" style={{ animationDelay: "0.25s" }}>
              <div className="label">{t.dashboard.radarLabel}</div>
              <ResponsiveContainer width="100%" height={230}>
                <RadarChart data={radarData} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="cat" tick={{ fill: "#445566", fontSize: 10, fontFamily: "DM Sans" }} />
                  {children.map(c => (
                    <Radar key={c.id} name={c.name} dataKey={c.name}
                      stroke={c.color} fill={c.color} fillOpacity={0.12} strokeWidth={2} />
                  ))}
                  <Tooltip contentStyle={{
                    background: "#0d1525", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, fontFamily: "DM Sans", fontSize: 12,
                  }} />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 4 }}>
                {children.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#8899aa" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Age Grid */}
            {ageGridAges.length > 0 && (
              <div className="card" style={{ animationDelay: "0.35s" }}>
                <div className="label">{t.dashboard.ageGrid}</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ color: "#334455", fontSize: 11, textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>
                          {t.dashboard.ageCol}
                        </th>
                        {children.map(c => (
                          <th key={c.id} style={{ color: c.color, fontSize: 11, textAlign: "center", padding: "4px 6px", fontWeight: 600 }}>
                            {c.emoji} {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ageGridAges.map(age => (
                        <tr key={age} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "8px" }}>
                            <span className="age-badge">{age}</span>
                          </td>
                          {children.map(c => {
                            const logs = (c.logs || []).filter(l => Math.floor(Number(l.age)) === age);
                            const isCurrent = c.age === age;
                            return (
                              <td key={c.id} style={{ textAlign: "center", padding: "6px 4px" }}>
                                {logs.length > 0
                                  ? logs.map((l, i) => (
                                    <div key={i} style={{
                                      background: `${c.color}15`, border: `1px solid ${c.color}30`,
                                      borderRadius: 8, padding: "3px 6px",
                                      fontSize: 10, color: "#ccd", marginBottom: 2,
                                    }}>{l.desc}</div>
                                  ))
                                  : isCurrent
                                    ? <span style={{ fontSize: 16 }}>⚠️</span>
                                    : <span style={{ color: "#1a2a3a", fontSize: 12 }}>—</span>
                                }
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI Alerts */}
            {dynamicAlerts.length > 0 && (
              <>
                <div className="label" style={{ paddingLeft: 4 }}>{t.dashboard.aiAlerts}</div>
                {dynamicAlerts.map((a, i) => (
                  <div key={i} className="alert" style={{
                    background: a.urgent ? "rgba(255,107,107,0.07)" : "rgba(78,205,196,0.06)",
                    border: `1px solid ${a.urgent ? "rgba(255,107,107,0.2)" : "rgba(78,205,196,0.15)"}`,
                    animationDelay: `${0.4 + i * 0.08}s`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{
                        background: `${a.child.color}20`, border: `1px solid ${a.child.color}40`,
                        borderRadius: 8, padding: "2px 10px",
                        fontSize: 11, color: a.child.color, fontWeight: 600,
                      }}>
                        {a.child.emoji} {a.child.name}
                      </div>
                      {a.urgent && (
                        <span style={{
                          background: "rgba(255,107,107,0.2)", color: "#FF6B6B",
                          borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 600,
                        }}>{t.dashboard.urgent}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "#c0cdd8", lineHeight: 1.6, margin: 0 }}>{a.msg}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
