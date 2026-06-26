import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Clock, CurrencyDollar, Gift, GraduationCap, UsersThree, Heart, Sparkle, Heartbeat } from "@phosphor-icons/react";
import { useLanguage } from "../hooks/useLanguage";

// "now" label is larger in the native app, normal (readable) on web.
const NOW_FONT = Capacitor.isNativePlatform() ? 20 : 15;

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


const css = `
  @keyframes drawLine {
    from { stroke-dashoffset: 1000; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes lgFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .line-path {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawLine 2s ease forwards;
  }

  .event-node { cursor: pointer; }
  .event-node circle { transition: r 0.2s; }

  .tooltip-box {
    position: absolute;
    background: rgba(8,14,26,0.97);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 10px 14px;
    font-size: 13px;
    pointer-events: none;
    z-index: 30;
    min-width: 140px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    animation: lgFadeUp 0.2s ease both;
  }

  .life-tab {
    flex: 1;
    padding: 10px 8px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .flag-label {
    font-size: 13px;
    fill: #5b4899;
    font-weight: 600;
    text-anchor: middle;
  }
`;

// Same 8 categories as the Log screen and fairness radar.
const CAT_ICONS = {
  time: Clock, money: CurrencyDollar, gifts: Gift, school: GraduationCap,
  oneOnOne: UsersThree, emotional: Heart, experiences: Sparkle, health: Heartbeat,
};
const CAT_COLORS = {
  time: "#6366F1", money: "#EA580C", gifts: "#FF6B6B", school: "#F59E0B",
  oneOnOne: "#14B8A6", emotional: "#EC4899", experiences: "#4ECDC4", health: "#22C55E",
};
const CAT_ORDER = ["time", "money", "gifts", "school", "oneOnOne", "emotional", "experiences", "health"];
// Map old log "type" values onto the new categories.
const LEGACY_TYPE = { gift: "gifts", experience: "experiences", milestone: "experiences", note: "experiences" };
const normCat = (l) => l.category || LEGACY_TYPE[l.type] || l.type || "experiences";
const catColor = (k) => CAT_COLORS[k] || "#8B5CF6";
const catIcon = (k) => CAT_ICONS[k] || Sparkle;

const MAX_AGE = 12;
const H = 440;                 // fixed graph height in px (tall — ~2x the old graph)
const DEFAULT_W = 340;
const PAD = { top: 48, right: 14, bottom: 44, left: 14 };

// Wider vertical spread so the connecting line has visible length.
const getY = (event) => {
  if (event.amount > 200) return 0.9;
  if (event.amount > 50) return 0.58;
  return 0.26;
};

export default function LifeLineGraph() {
  const { t } = useLanguage();
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  // Measure the real pixel width so the SVG viewBox == container px:
  // the axis fills full width while dots/text keep a fixed px size.
  const wrapRef = useRef(null);
  const [vw, setVw] = useState(DEFAULT_W);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setVw(el.clientWidth || DEFAULT_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  // Re-attach/measure once the graph (with its ref) actually renders.
  }, [activeChild]);

  const W = vw;
  const INNER_W = W - PAD.left - PAD.right;
  const INNER_H = H - PAD.top - PAD.bottom;
  const getX = (age, maxAge = MAX_AGE) => PAD.left + (age / maxAge) * INNER_W;
  const getYCoord = (y) => PAD.top + (1 - y) * INNER_H;
  const buildPath = (events, maxAge = MAX_AGE) => {
    if (events.length < 2) return "";
    const pts = events.map(e => ({ x: getX(e.age, maxAge), y: getYCoord(getY(e)) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(collection(db, "users", uid, "children"), snap => {
      const kids = snap.docs.map(d => ({ id: d.id, ...d.data(), events: [] }));
      kids.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setChildren(kids);
      if (kids.length > 0) setActiveChild(prev => prev || kids[0].id);

      kids.forEach(kid => {
        onSnapshot(
          query(collection(db, "users", uid, "children", kid.id, "logs"), orderBy("createdAt", "asc")),
          logSnap => {
            const events = logSnap.docs.map(d => {
              const l = d.data();
              return {
                age: l.age || kid.age || 1,
                category: normCat(l),
                label: l.desc || "",
                amount: l.amount || 0,
              };
            });
            setChildren(prev => prev.map(c => c.id === kid.id ? { ...c, events } : c));
          }
        );
      });
    });
  }, [uid]);

  const child = children.find(c => c.id === activeChild);

  if (!child) return (
    <div style={{
      background: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.95)",
      borderRadius: 22, padding: "24px 18px", textAlign: "center",
      color: "#6b5a9e", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    }}>
      Add children to see the Life Graph
    </div>
  );

  // Stretch the axis so the child's current age (and any later events) always fit.
  const rawMax = Math.max(MAX_AGE, Math.ceil(child.age || 0), ...child.events.map(e => Math.ceil(e.age || 0)));
  const maxAge = rawMax % 2 === 0 ? rawMax : rawMax + 1;
  const axisTicks = Array.from({ length: maxAge / 2 + 1 }, (_, i) => i * 2);

  const areaPath = (() => {
    if (child.events.length < 2) return "";
    const pts = child.events.map(e => ({ x: getX(e.age, maxAge), y: getYCoord(getY(e)) }));
    let d = `M ${pts[0].x} ${PAD.top + INNER_H} L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${PAD.top + INNER_H} Z`;
    return d;
  })();

  return (
    <div style={{ marginBottom: 12, animation: "lgFadeUp 0.5s 0.2s ease both" }}>
      <style>{css}</style>

      <div style={{
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(255,255,255,0.95)",
        borderRadius: 22,
        padding: "18px 18px 14px",
        boxShadow: "0 8px 32px rgba(139,92,246,0.09), inset 0 1px 0 rgba(255,255,255,1)",
      }}>
        <div style={{
          fontSize: 13, letterSpacing: 3, textTransform: "uppercase",
          color: "#6b5a9e", fontFamily: "'DM Sans', sans-serif", marginBottom: 12,
        }}>Life Graph</div>

        {/* Child tabs */}
        <div style={{
          display: "flex", gap: 6,
          background: "rgba(124,58,237,0.08)",
          borderRadius: 12, padding: 3, marginBottom: 14,
        }}>
          {children.map(c => (
            <button key={c.id} className="life-tab"
              onClick={() => { setActiveChild(c.id); setTooltip(null); }}
              style={{
                background: activeChild === c.id ? `${c.color}18` : "none",
                border: `1px solid ${activeChild === c.id ? c.color + "44" : "transparent"}`,
                color: activeChild === c.id ? c.color : "#6b5a9e",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
              <i className={`fi ${EMOJI_FLATICON[c.emoji] || "fi-sr-star"}`} style={{ fontSize: 13, color: "inherit" }} /> {c.name}
            </button>
          ))}
        </div>

        {/* SVG Graph */}
        <div ref={wrapRef} style={{ position: "relative" }}>
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible", display: "block" }}>
            <defs>
              <linearGradient id={`lg-grad-${child.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={child.color} stopOpacity="0.15" />
                <stop offset="100%" stopColor={child.color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0.3, 0.55, 0.8].map((y, i) => (
              <line key={i}
                x1={PAD.left} y1={getYCoord(y)} x2={W - PAD.right} y2={getYCoord(y)}
                stroke="rgba(124,58,237,0.08)" strokeWidth="1" strokeDasharray="4,4"
              />
            ))}

            {/* Age grid */}
            {axisTicks.map(age => (
              <g key={age}>
                <line x1={getX(age, maxAge)} y1={PAD.top} x2={getX(age, maxAge)} y2={PAD.top + INNER_H}
                  stroke="rgba(124,58,237,0.08)" strokeWidth="1" />
                <text x={getX(age, maxAge)} y={H - 16} textAnchor="middle" fontSize="13" fontWeight="600" fill="#6b5a9e">
                  {age}
                </text>
              </g>
            ))}

            {/* Current age marker */}
            <line
              x1={getX(child.age, maxAge)} y1={PAD.top - 10} x2={getX(child.age, maxAge)} y2={PAD.top + INNER_H}
              stroke={child.color} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.4"
            />
            <text x={getX(child.age, maxAge)} y={PAD.top - 16}
              textAnchor="middle" fontSize={NOW_FONT} fill={child.color} fontWeight="700">now</text>

            {/* Area fill */}
            <path d={areaPath} fill={`url(#lg-grad-${child.id})`} />

            {/* Line */}
            <path
              key={`line-${child.id}`}
              className="line-path"
              d={buildPath(child.events, maxAge)}
              fill="none" stroke={child.color}
              strokeWidth="2.5" strokeLinecap="round" opacity="0.8"
            />

            {/* Nodes */}
            {child.events.map((event, i) => {
              const x = getX(event.age, maxAge);
              const y = getYCoord(getY(event));
              const hovered = tooltip?.id === `${child.id}-${i}`;
              return (
                <g key={i} className="event-node"
                  onMouseEnter={() => setTooltip({ id: `${child.id}-${i}`, x, y, event })}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => setTooltip(tooltip?.id === `${child.id}-${i}` ? null : { id: `${child.id}-${i}`, x, y, event })}
                >
                  {hovered && (
                    <circle cx={x} cy={y} r="14"
                      fill={`${catColor(event.category)}15`}
                      stroke={catColor(event.category)} strokeWidth="1" opacity="0.5"
                    />
                  )}
                  <circle cx={x} cy={y} r={hovered ? "8" : "6"}
                    fill={catColor(event.category)} stroke="#06090f" strokeWidth="2" />
                  <text x={x} y={y + 18} className="flag-label">{event.age}</text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div className="tooltip-box" style={{
              left: `${(tooltip.x / W) * 100}%`,
              bottom: `${((H - tooltip.y) / H) * 100 + 5}%`,
              transform: "translateX(-50%)",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <div style={{ fontWeight: 600, color: catColor(tooltip.event.category), marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                {(() => { const Icon = catIcon(tooltip.event.category); return <Icon size={13} weight="fill" />; })()}
                {tooltip.event.label}
              </div>
              <div style={{ color: "#8899aa", fontSize: 13 }}>Age {tooltip.event.age}</div>
              {tooltip.event.amount > 0 && (
                <div style={{ color: "#EA580C", fontSize: 13, marginTop: 2 }}>💰 ${tooltip.event.amount}</div>
              )}
              <div style={{ color: "#6b5a9e", fontSize: 13, marginTop: 2 }}>
                {t.categories[tooltip.event.category] || tooltip.event.category}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          {CAT_ORDER.map(key => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b5a9e" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: catColor(key) }} />
              {t.categories[key]}
            </div>
          ))}
        </div>

        {/* Events list — show only the first 3 */}
        <div style={{ marginTop: 14 }}>
          {child.events.slice(0, 3).map((event, i, arr) => {
            const Icon = catIcon(event.category);
            const color = catColor(event.category);
            return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 0",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(124,58,237,0.08)" : "none",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: `${color}18`,
                border: `1px solid ${color}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}><Icon size={14} color={color} weight="fill" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: "#1e0f3c" }}>{event.label}</div>
                <div style={{ fontSize: 15, color: "#6b5a9e", marginTop: 1 }}>
                  Age {event.age} · {t.categories[event.category] || event.category}
                </div>
              </div>
              {event.amount > 0 && (
                <div style={{ fontSize: 15, fontWeight: 600, color: "#EA580C" }}>${event.amount}</div>
              )}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
