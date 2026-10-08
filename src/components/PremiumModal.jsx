import { useState, useEffect } from "react";
import { doc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";

// "Fake door" for a paid plan: no payment yet. Records interest (opens,
// optional email) at users/{uid}/meta/premiumInterest so we can see how many
// parents would pay before building billing.
// reason: "button" (opened from the Premium button) or "limit" (hit the daily AI limit)
const COPY = {
  ko: {
    badge: "준비 중",
    title: "FairFamily 프리미엄",
    limitTitle: "오늘 무료 AI 사용을 다 썼어요",
    limitBody: (n) => `무료는 하루 ${n}회까지예요. 내일 다시 쓸 수 있어요.`,
    perks: ["AI 조언 무제한", "사진·한 번에 기록 무제한", "아이별 월간 공평 리포트"],
    price: "월 4,900원 예정",
    emailPh: "이메일 (출시 알림용)",
    cta: "출시 알림 받기",
    done: "신청됐어요! 출시되면 가장 먼저 알려드릴게요.",
    close: "닫기",
    bad: "이메일을 확인해 주세요",
  },
  en: {
    badge: "Coming soon",
    title: "FairFamily Premium",
    limitTitle: "You've used today's free AI",
    limitBody: (n) => `The free plan includes ${n} per day. It resets tomorrow.`,
    perks: ["Unlimited AI advice", "Unlimited photo & quick logging", "Monthly fairness report per child"],
    price: "Planned: $3.99/month",
    emailPh: "Email (for launch notice)",
    cta: "Notify me",
    done: "You're on the list! We'll tell you first when it launches.",
    close: "Close",
    bad: "Please check your email",
  },
};

export default function PremiumModal({ open, onClose, reason = "button", limit }) {
  const { lang } = useLanguage();
  const c = COPY[lang === "ko" ? "ko" : "en"];
  const [email, setEmail] = useState(auth.currentUser?.email || "");
  const [state, setState] = useState("idle"); // idle | saving | done | error

  const ref = () => {
    const uid = auth.currentUser?.uid;
    return uid ? doc(db, "users", uid, "meta", "premiumInterest") : null;
  };

  // Count every open (this is the click-through we want to measure).
  useEffect(() => {
    if (!open) return;
    setState("idle");
    const r = ref();
    if (!r) return;
    setDoc(r, {
      opens: increment(1),
      [`opensBy_${reason}`]: increment(1),
      lastOpenedAt: serverTimestamp(),
      lang,
    }, { merge: true }).catch(e => console.warn("premiumInterest", e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setState("error"); return; }
    const r = ref();
    setState("saving");
    try {
      if (r) await setDoc(r, { email: email.trim(), signedUpAt: serverTimestamp(), source: reason }, { merge: true });
      setState("done");
    } catch (e) {
      console.warn("premiumInterest", e);
      setState("error");
    }
  };

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
        {reason === "limit" && (
          <div style={{ background: "#fff1f7", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#db2777", marginBottom: 4 }}>{c.limitTitle}</div>
            <div style={{ fontSize: 14, color: "#6b5a9e" }}>{c.limitBody(limit || 3)}</div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800 }}>✨ {c.title}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "rgba(124,58,237,0.1)", padding: "3px 8px", borderRadius: 8 }}>{c.badge}</span>
        </div>
        <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0 }}>
          {c.perks.map(p => <li key={p} style={{ fontSize: 15, padding: "5px 0" }}>✓ {p}</li>)}
        </ul>
        <div style={{ fontSize: 14, color: "#6b5a9e", marginBottom: 16 }}>{c.price}</div>

        {state === "done" ? (
          <div style={{ fontSize: 15, fontWeight: 600, color: "#7C3AED", padding: "12px 0" }}>{c.done}</div>
        ) : (
          <>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
              placeholder={c.emailPh}
              style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: `1px solid ${state === "error" ? "#ec4899" : "rgba(124,58,237,0.25)"}`, fontSize: 15, marginBottom: 6, outline: "none" }} />
            {state === "error" && <div style={{ fontSize: 12, color: "#ec4899", marginBottom: 6 }}>{c.bad}</div>}
            <button onClick={submit} disabled={state === "saving"} style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#7C3AED,#EC4899)", color: "#fff", fontSize: 16, fontWeight: 700, marginTop: 6,
            }}>{c.cta}</button>
          </>
        )}
        <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: 10, background: "none", border: "none", color: "#6b5a9e", fontSize: 14, cursor: "pointer" }}>{c.close}</button>
      </div>
    </div>
  );
}
