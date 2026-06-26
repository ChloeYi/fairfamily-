import { useState, useEffect } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { X, ArrowLeft, ArrowRight } from "@phosphor-icons/react";

// Which real on-screen element each step points at (by data-tour="..").
// null = a centered card with no spotlight. Order matches t.tour.steps.
const TARGETS = [null, "children", "radar", "comparison", "lifegraph", "nav-log", "nav-ai", "nav-kids", "settings"];
const PAD = 8;
const TIP_W = 340;

// A guided spotlight tour: dims the screen, highlights the real button/section
// for each step, and floats a bubble next to it.
export default function Tour({ onClose }) {
  const { t } = useLanguage();
  const steps = t.tour.steps;
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const step = steps[i];
  const last = i === steps.length - 1;

  useEffect(() => {
    const measure = () => {
      const key = TARGETS[i];
      if (!key) { setRect(null); return; }
      const el = document.querySelector(`[data-tour="${key}"]`);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const key = TARGETS[i];
    const el = key && document.querySelector(`[data-tour="${key}"]`);
    if (el) el.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [i]);

  const vw = typeof window !== "undefined" ? window.innerWidth : 380;
  const vh = typeof window !== "undefined" ? window.innerHeight : 700;
  const tipW = Math.min(TIP_W, vw - 24);

  // Tooltip placement: below the target if there's room, otherwise above; centered if no target.
  let tipStyle;
  if (!rect) {
    tipStyle = { left: (vw - tipW) / 2, top: Math.max(24, (vh - 360) / 2) };
  } else {
    const below = vh - (rect.top + rect.height);
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - tipW / 2), vw - tipW - 12);
    if (below > 300) tipStyle = { left, top: rect.top + rect.height + PAD + 14 };
    else tipStyle = { left, top: Math.max(16, rect.top - PAD - 14 - 320) };
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes tourPop { from { opacity: 0; transform: translateY(10px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>

      {/* Click blocker (transparent) */}
      <div onClick={() => {}} style={{ position: "fixed", inset: 0, background: "transparent" }} />

      {/* Dim + spotlight hole (or full dim when no target) */}
      {rect ? (
        <div key="spot" style={{
          position: "fixed",
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: 18, pointerEvents: "none",
          boxShadow: "0 0 0 9999px rgba(30,15,60,0.62)",
          border: "2.5px solid rgba(255,255,255,0.95)",
          transition: "top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s, height 0.35s",
        }} />
      ) : (
        <div key="dim" style={{ position: "fixed", inset: 0, background: "rgba(30,15,60,0.62)", pointerEvents: "none" }} />
      )}

      {/* Floating bubble */}
      <div key={i} style={{
        position: "fixed", width: tipW, ...tipStyle,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255,255,255,0.95)",
        borderRadius: 24, padding: "22px 20px 18px",
        boxShadow: "0 24px 70px rgba(124,58,237,0.32)",
        animation: "tourPop 0.3s cubic-bezier(0.34,1.4,0.64,1) both",
      }}>
        <button onClick={onClose} aria-label="close tour" style={{
          position: "absolute", top: 14, right: 14,
          width: 32, height: 32, borderRadius: 10, cursor: "pointer",
          background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><X size={17} color="#7C3AED" weight="bold" /></button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(124,58,237,0.16), rgba(236,72,153,0.12))",
            border: "1px solid rgba(124,58,237,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27,
          }}>{step.icon}</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#1e0f3c", paddingRight: 28 }}>{step.title}</div>
        </div>

        <div style={{ fontSize: 15.5, color: "#3a2a5e", lineHeight: 1.65, marginBottom: 18 }}>{step.body}</div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          {steps.map((_, n) => (
            <div key={n} onClick={() => setI(n)} style={{
              width: n === i ? 20 : 7, height: 7, borderRadius: 4, cursor: "pointer",
              background: n === i ? "linear-gradient(135deg, #7C3AED, #EC4899)" : "rgba(124,58,237,0.22)",
              transition: "all 0.25s",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {i > 0 && (
            <button onClick={() => setI(i - 1)} style={{
              flex: "0 0 auto", padding: "12px 15px", borderRadius: 13, cursor: "pointer",
              background: "rgba(255,255,255,0.8)", border: "1px solid rgba(124,58,237,0.22)",
              color: "#6b5a9e", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              display: "flex", alignItems: "center", gap: 5,
            }}><ArrowLeft size={15} weight="bold" /> {t.tour.prev}</button>
          )}
          <button onClick={() => (last ? onClose() : setI(i + 1))} style={{
            flex: 1, padding: "13px", borderRadius: 13, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 8px 24px rgba(124,58,237,0.32)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {last ? t.tour.done : t.tour.next}
            {!last && <ArrowRight size={16} weight="bold" />}
          </button>
        </div>

        {!last && (
          <button onClick={onClose} style={{
            display: "block", margin: "12px auto 0", background: "none", border: "none",
            color: "#8b7fc0", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>{t.tour.skip}</button>
        )}
      </div>
    </div>
  );
}
