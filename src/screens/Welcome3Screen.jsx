import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @keyframes pageFadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes bubbleShake {
    0%   { transform: translateX(0); }
    12%  { transform: translateX(-8px) rotate(-2deg); }
    25%  { transform: translateX(8px) rotate(2deg); }
    37%  { transform: translateX(-6px) rotate(-1deg); }
    50%  { transform: translateX(6px) rotate(1deg); }
    62%  { transform: translateX(-3px); }
    75%  { transform: translateX(3px); }
    87%  { transform: translateX(-1px); }
    100% { transform: translateX(0); }
  }
`;

const LINE_DATA = [
  { age: "Born",    Emma: 140, Zoe: 95  },
  { age: "1yr",     Emma: 180, Zoe: 40  },
  { age: "2yrs",    Emma: 160, Zoe: 110 },
  { age: "3yrs",    Emma: 200, Zoe: 50  },
  { age: "4yrs",    Emma: 175, Zoe: 120 },
  { age: "5yrs",    Emma: 220, Zoe: 55  },
  { age: "6yrs",    Emma: 190, Zoe: 140 },
  { age: "7yrs",    Emma: 240, Zoe: 70  },
  { age: "8yrs",    Emma: 210, Zoe: 155 },
];

const RADAR_AXES = ["Time", "Gifts", "Experiences", "Milestones", "Emotional", "School"];
const RADAR_EMMA = [85, 90, 38, 75, 28, 68];
const RADAR_ZOE  = [38, 28, 90, 32, 88, 48];

function smoothRadarPath(values, cx, cy, r) {
  const n = values.length;
  const pts = values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (v / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  });

  // Rounded polygon: straight lines between data points,
  // quadratic bezier curve only AT each data point (corner rounding).
  function approach(from, to, maxDist) {
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    const d = Math.min(maxDist, len * 0.42);
    return [from[0] + (dx / len) * d, from[1] + (dy / len) * d];
  }

  const cr = 10; // corner radius
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];
    const incoming = approach(curr, prev, cr);
    const outgoing = approach(curr, next, cr);
    if (i === 0) d += `M ${incoming[0]} ${incoming[1]}`;
    else         d += ` L ${incoming[0]} ${incoming[1]}`;
    d += ` Q ${curr[0]} ${curr[1]} ${outgoing[0]} ${outgoing[1]}`;
  }
  return d + " Z";
}

function SmoothRadar({ showDot }) {
  const size = 260;
  const cx = size / 2, cy = size / 2, r = 90;
  const n = RADAR_AXES.length;
  const rings = [25, 50, 75, 100];

  const axisPoints = RADAR_AXES.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle };
  });

  // Emma's "Gifts" dot (index 1) — upper-right area
  const expAngle = (Math.PI * 2 * 1) / n - Math.PI / 2;
  const expDist = (RADAR_EMMA[1] / 100) * r;
  const dotX = cx + expDist * Math.cos(expAngle);
  const dotY = cy + expDist * Math.sin(expAngle);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        {/* Grid rings */}
        {rings.map(pct => (
          <circle key={pct} cx={cx} cy={cy} r={(pct / 100) * r}
            fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth={1} />
        ))}
        {/* Axis lines */}
        {axisPoints.map((pt, i) => (
          <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y}
            stroke="rgba(139,92,246,0.1)" strokeWidth={1} />
        ))}
        {/* Zoe blob */}
        <path d={smoothRadarPath(RADAR_ZOE, cx, cy, r)}
          fill="rgba(236,72,153,0.15)" stroke="#EC4899" strokeWidth={2.2}
          strokeLinejoin="round" />
        {/* Emma blob */}
        <path d={smoothRadarPath(RADAR_EMMA, cx, cy, r)}
          fill="rgba(124,58,237,0.15)" stroke="#7C3AED" strokeWidth={2.2}
          strokeLinejoin="round" />
        {/* Axis labels */}
        {axisPoints.map((pt, i) => {
          const lx = cx + (r + 20) * Math.cos(pt.angle);
          const ly = cy + (r + 20) * Math.sin(pt.angle);
          return (
            <text key={i} x={lx} y={ly}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={11} fill="#7c6aaa" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
              {RADAR_AXES[i]}
            </text>
          );
        })}
        {/* Special dot on Zoe's Experiences */}
        {showDot && (
          <g>
            <circle cx={dotX} cy={dotY} r={11} fill="#1e0f3c" opacity={0.13} />
            <circle cx={dotX} cy={dotY} r={6} fill="#1e0f3c" />
          </g>
        )}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
        {[["#7C3AED", "Emma"], ["#EC4899", "Zoe"]].map(([color, name]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 13, color: "#7c6aaa", fontFamily: "'DM Sans', sans-serif" }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const glassCard = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.95)",
  borderRadius: 24,
  padding: "20px 16px",
  boxShadow: "0 8px 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1)",
};

export default function Welcome3Screen() {
  const navigate = useNavigate();
  const { t, titleFont } = useLanguage();
  const [show, setShow] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [showInsight2, setShowInsight2] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!show) return;
    const t1 = setTimeout(() => setShowInsight(true), 1400);
    const t2 = setTimeout(() => setShowInsight2(true), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show]);

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'DM Sans', sans-serif",
      padding: "56px 20px 120px",
      animation: "pageFadeIn 0.5s ease both",
    }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeUp 0.6s ease both" }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
          {t.welcome3.sectionLabel}
        </div>
        <h2 style={{
          fontFamily: titleFont,
          fontSize: 28, fontWeight: 400, color: "#1e0f3c", lineHeight: 1.2,
        }}>
          {t.welcome3.title}
        </h2>
      </div>

      {/* Line chart */}
      <div style={{ ...glassCard, marginBottom: 16, animation: show ? "fadeUp 0.6s ease both" : "none" }}>
        <div style={{ fontSize: 13, letterSpacing: 2.5, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
          {t.welcome3.chartLabel}
        </div>
        <div style={{ fontSize: 13, color: "#6b5a9e", marginBottom: 16 }}>{t.welcome3.chartSub}</div>

        {/* Chart + insight bubble overlay */}
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={LINE_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
              <XAxis dataKey="age" tick={{ fontSize: 10, fill: "#7C3AED", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#7C3AED", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip
                defaultIndex={4}
                contentStyle={{
                  background: "rgba(255,255,255,0.92)", border: "1px solid rgba(255,255,255,0.95)",
                  borderRadius: 12, boxShadow: "0 4px 16px rgba(139,92,246,0.12)",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                }}
                itemStyle={{ fontFamily: "'DM Sans', sans-serif" }}
                formatter={(value, name) => [
                  <span style={{ color: name === "Emma" ? "#7C3AED" : "#EC4899", fontWeight: 600 }}>
                    {value}
                  </span>, name
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }} />
              <Line type="monotone" dataKey="Emma" stroke="#7C3AED" strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, index, key } = props;
                  if (index === 1) return (
                    <g key={key}>
                      <circle cx={cx} cy={cy} r={11} fill="#1e0f3c" opacity={0.13} />
                      <circle cx={cx} cy={cy} r={6} fill="#1e0f3c" />
                    </g>
                  );
                  return <circle key={key} cx={cx} cy={cy} r={4} fill="#7C3AED" />;
                }}
                activeDot={{ r: 6 }}
              />
              <Line type="monotone" dataKey="Zoe" stroke="#EC4899" strokeWidth={2.5} dot={{ r: 4, fill: "#EC4899" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>

        </div>
      </div>

      {/* Insight bubble — between cards, tail points up toward the black dot on the chart */}
      <div style={{
        marginBottom: 16, paddingLeft: 12,
        opacity: showInsight ? 1 : 0,
        transition: "opacity 0.4s ease",
        animation: showInsight ? "bubbleShake 0.6s ease 0.5s 1" : "none",
        pointerEvents: "none",
      }}>
        <div style={{
          transform: showInsight ? "scale(1)" : "scale(0.88)",
          transformOrigin: "left top",
          transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{
            position: "relative",
            display: "inline-block",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid rgba(255,255,255,0.9)",
            color: "#1e0f3c",
            borderRadius: 14,
            padding: "11px 13px",
            fontSize: 13,
            lineHeight: 1.5,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 8px 24px rgba(30,15,60,0.1)",
          }}>
            {/* Tail pointing up toward the origin dot */}
            <div style={{
              position: "absolute", left: 20, top: -10,
              width: 0, height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: "10px solid rgba(255,255,255,0.9)",
            }} />
            {t.welcome3.insight1}
          </div>
        </div>
      </div>

      {/* Radar chart */}
      <div style={{ ...glassCard, position: "relative", animation: show ? "fadeUp 0.7s 0.15s ease both" : "none" }}>
        <div style={{ fontSize: 13, letterSpacing: 2.5, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
          {t.welcome3.radarLabel}
        </div>
        <div style={{ fontSize: 13, color: "#6b5a9e", marginBottom: 16 }}>{t.welcome3.radarSub}</div>
        <SmoothRadar showDot={showInsight2} />

      </div>

      {/* Insight bubble — below radar card, tail points up toward origin dot */}
      <div style={{
        marginTop: 16, paddingRight: 12, display: "flex", justifyContent: "flex-end",
        opacity: showInsight2 ? 1 : 0,
        transition: "opacity 0.4s ease",
        animation: showInsight2 ? "bubbleShake 0.6s ease 0.5s 1" : "none",
        pointerEvents: "none",
      }}>
        <div style={{
          transform: showInsight2 ? "scale(1)" : "scale(0.88)",
          transformOrigin: "right top",
          transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          <div style={{
            position: "relative",
            display: "inline-block",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid rgba(255,255,255,0.9)",
            color: "#1e0f3c",
            borderRadius: 14,
            padding: "11px 13px",
            fontSize: 12.5,
            lineHeight: 1.5,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 8px 24px rgba(30,15,60,0.08)",
          }}>
            {/* Tail pointing up toward the origin dot */}
            <div style={{
              position: "absolute", right: 20, top: -10,
              width: 0, height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: "10px solid rgba(255,255,255,0.9)",
            }} />
            {t.welcome3.insight2}
          </div>
        </div>
      </div>

      {/* Get Started button */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 24px 40px",
        background: "linear-gradient(to top, rgba(248,240,255,0.98) 70%, transparent)",
      }}>
        <button onClick={() => navigate("/login")} style={{
          width: "100%", padding: "18px",
          borderRadius: 20, border: "none",
          background: "linear-gradient(135deg, #7C3AED, #EC4899)",
          color: "#fff", fontSize: 17, fontWeight: 700,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 8px 28px rgba(124,58,237,0.35)", letterSpacing: 0.3,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {t.welcome3.getStarted}
        </button>
      </div>
    </div>
  );
}
