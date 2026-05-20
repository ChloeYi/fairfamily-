import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Gift, Sparkle, Trophy, Note } from "@phosphor-icons/react";

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
    font-size: 12px;
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
    font-size: 9px;
    fill: #8899aa;
    text-anchor: middle;
  }
`;

const TYPE_PHOSPHOR = { gift: Gift, experience: Sparkle, milestone: Trophy, note: Note };

const TYPE_COLORS = { gift: "#FF6B6B", experience: "#4ECDC4", milestone: "#8B5CF6" };

const MAX_AGE = 12;
const W = 340;
const H = 180;
const PAD = { top: 40, right: 20, bottom: 30, left: 20 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

const getY = (event) => {
  if (event.type === "milestone") return 0.3;
  if (event.amount > 200) return 0.85;
  if (event.amount > 50) return 0.65;
  return 0.45;
};

const getX = (age) => PAD.left + (age / MAX_AGE) * INNER_W;
const getYCoord = (y) => PAD.top + (1 - y) * INNER_H;

const buildPath = (events) => {
  if (events.length < 2) return "";
  const pts = events.map(e => ({ x: getX(e.age), y: getYCoord(getY(e)) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
};

export default function LifeLineGraph() {
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const uid = auth.currentUser?.uid;

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
                type: l.type || "note",
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
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 22, padding: "24px 18px", textAlign: "center",
      color: "#445566", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    }}>
      Add children to see the Life Graph
    </div>
  );

  const areaPath = (() => {
    if (child.events.length < 2) return "";
    const pts = child.events.map(e => ({ x: getX(e.age), y: getYCoord(getY(e)) }));
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
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 22,
        padding: "18px 18px 14px",
      }}>
        <div style={{
          fontSize: 10, letterSpacing: 3, textTransform: "uppercase",
          color: "#445566", fontFamily: "'DM Sans', sans-serif", marginBottom: 12,
        }}>Life Graph</div>

        {/* Child tabs */}
        <div style={{
          display: "flex", gap: 6,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 12, padding: 3, marginBottom: 14,
        }}>
          {children.map(c => (
            <button key={c.id} className="life-tab"
              onClick={() => { setActiveChild(c.id); setTooltip(null); }}
              style={{
                background: activeChild === c.id ? `${c.color}18` : "none",
                border: `1px solid ${activeChild === c.id ? c.color + "44" : "transparent"}`,
                color: activeChild === c.id ? c.color : "#445566",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
              <i className={`fi ${EMOJI_FLATICON[c.emoji] || "fi-sr-star"}`} style={{ fontSize: 13, color: "inherit" }} /> {c.name}
            </button>
          ))}
        </div>

        {/* SVG Graph */}
        <div style={{ position: "relative" }}>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
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
                stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4,4"
              />
            ))}

            {/* Age grid */}
            {[0, 2, 4, 6, 8, 10, 12].map(age => (
              <g key={age}>
                <line x1={getX(age)} y1={PAD.top} x2={getX(age)} y2={PAD.top + INNER_H}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x={getX(age)} y={H - 6} textAnchor="middle" fontSize="9" fill="#334455">
                  {age}
                </text>
              </g>
            ))}

            {/* Current age marker */}
            <line
              x1={getX(child.age)} y1={PAD.top - 10} x2={getX(child.age)} y2={PAD.top + INNER_H}
              stroke={child.color} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.4"
            />
            <text x={getX(child.age)} y={PAD.top - 14}
              textAnchor="middle" fontSize="9" fill={child.color} fontWeight="600">now</text>

            {/* Area fill */}
            <path d={areaPath} fill={`url(#lg-grad-${child.id})`} />

            {/* Line */}
            <path
              key={`line-${child.id}`}
              className="line-path"
              d={buildPath(child.events)}
              fill="none" stroke={child.color}
              strokeWidth="2.5" strokeLinecap="round" opacity="0.8"
            />

            {/* Nodes */}
            {child.events.map((event, i) => {
              const x = getX(event.age);
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
                      fill={`${TYPE_COLORS[event.type]}15`}
                      stroke={TYPE_COLORS[event.type]} strokeWidth="1" opacity="0.5"
                    />
                  )}
                  <circle cx={x} cy={y} r={hovered ? "8" : "6"}
                    fill={TYPE_COLORS[event.type]} stroke="#06090f" strokeWidth="2" />
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
              <div style={{ fontWeight: 600, color: TYPE_COLORS[tooltip.event.type], marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                {(() => { const Icon = TYPE_PHOSPHOR[tooltip.event.type] || Note; return <Icon size={13} weight="fill" />; })()}
                {tooltip.event.label}
              </div>
              <div style={{ color: "#8899aa", fontSize: 11 }}>Age {tooltip.event.age}</div>
              {tooltip.event.amount > 0 && (
                <div style={{ color: "#EA580C", fontSize: 11, marginTop: 2 }}>💰 ${tooltip.event.amount}</div>
              )}
              <div style={{ color: "#334455", fontSize: 10, marginTop: 2, textTransform: "capitalize" }}>
                {tooltip.event.type}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap" }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, color: "#8899aa" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: color }} />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
          ))}
        </div>

        {/* Events list */}
        <div style={{ marginTop: 14 }}>
          {child.events.map((event, i) => {
            const Icon = TYPE_PHOSPHOR[event.type] || Note;
            return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 0",
              borderBottom: i < child.events.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: `${TYPE_COLORS[event.type]}18`,
                border: `1px solid ${TYPE_COLORS[event.type]}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}><Icon size={14} color={TYPE_COLORS[event.type]} weight="fill" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#ddeeff" }}>{event.label}</div>
                <div style={{ fontSize: 10, color: "#445566", marginTop: 1 }}>
                  Age {event.age} · {event.type}
                </div>
              </div>
              {event.amount > 0 && (
                <div style={{ fontSize: 12, fontWeight: 600, color: "#EA580C" }}>${event.amount}</div>
              )}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
