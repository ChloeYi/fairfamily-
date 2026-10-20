import { useLanguage } from "../hooks/useLanguage";

// Shown when the free daily AI allowance is used up.
//
// This file used to also pitch a paid plan and collect emails for it. That was
// taken out before the first release: a paid plan does not exist yet, so the
// app should not advertise one. When billing is real, the upsell goes back here
// (and back on the dashboard, see DashboardScreen).
const COPY = {
  ko: {
    title: "오늘 무료 AI 사용을 다 썼어요",
    body: (n) => `무료는 하루 ${n}회까지예요. 내일 다시 쓸 수 있어요.`,
    close: "닫기",
  },
  en: {
    title: "You've used today's free AI",
    body: (n) => `The free plan includes ${n} per day. It resets tomorrow.`,
    close: "Close",
  },
};

export default function LimitModal({ open, onClose, limit }) {
  const { lang } = useLanguage();
  const c = COPY[lang === "ko" ? "ko" : "en"];

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(30,15,60,0.45)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480, background: "#fff", borderRadius: "24px 24px 0 0",
        padding: "26px 22px 30px", fontFamily: "'DM Sans', sans-serif", color: "#1e0f3c",
        boxShadow: "0 -10px 40px rgba(124,58,237,0.2)",
      }}>
        <div style={{ background: "#fff1f7", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: "#db2777", marginBottom: 4 }}>{c.title}</div>
          <div style={{ fontSize: 14, color: "#6b5a9e" }}>{c.body(limit || 3)}</div>
        </div>
        <button onClick={onClose} style={{
          width: "100%", padding: 12, borderRadius: 14, border: "none", cursor: "pointer",
          background: "rgba(124,58,237,0.1)", color: "#7C3AED",
          fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
        }}>{c.close}</button>
      </div>
    </div>
  );
}
