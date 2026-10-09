import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";

// Floating "send feedback" button for signed-in users.
// Saves to users/{uid}/feedback (always allowed for the owner) and, if the
// security rules allow it, a copy to the top-level `feedback` collection so
// every tester's feedback can be read in one list in the Firebase console.

const MOODS = [
  { id: "good", emoji: "😊" },
  { id: "okay", emoji: "😐" },
  { id: "bad", emoji: "😞" },
];

const TEXT = {
  ko: {
    button: "의견 보내기",
    title: "FairFamily 어떠세요?",
    sub: "불편한 점, 좋았던 점 무엇이든 한 줄이면 충분해요.",
    placeholder: "예: 기록하는 버튼을 찾기 어려웠어요",
    send: "보내기",
    sending: "보내는 중…",
    thanks: "고마워요! 꼭 읽고 반영할게요.",
    error: "전송에 실패했어요. 잠시 후 다시 시도해 주세요.",
    close: "닫기",
  },
  en: {
    button: "Feedback",
    title: "How is FairFamily working for you?",
    sub: "Anything that bugged you or that you liked — one line is plenty.",
    placeholder: "e.g. I couldn't find where to add a log",
    send: "Send",
    sending: "Sending…",
    thanks: "Thank you! I read every message.",
    error: "Couldn't send. Please try again in a moment.",
    close: "Close",
  },
};

export default function FeedbackButton() {
  const { lang } = useLanguage();
  const tx = TEXT[lang === "ko" ? "ko" : "en"];
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const reset = () => { setMood(null); setMessage(""); setStatus("idle"); };
  const close = () => { setOpen(false); setTimeout(reset, 250); };

  const send = async () => {
    const user = auth.currentUser;
    if (!user || (!mood && !message.trim())) return;
    setStatus("sending");
    const entry = {
      uid: user.uid,
      email: user.email || null,
      mood,
      message: message.trim(),
      page: window.location.pathname,
      lang,
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, "users", user.uid, "feedback"), entry);
      try { await addDoc(collection(db, "feedback"), entry); } catch (e) { /* rules may not allow it yet */ }
      setStatus("done");
      setTimeout(close, 1800);
    } catch (e) {
      console.error("feedback send failed", e);
      setStatus("error");
    }
  };

  const canSend = (mood || message.trim()) && status !== "sending";

  return (
    <>
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={tx.button}
        style={{
          position: "fixed", bottom: 96, left: 16, zIndex: 300,
          height: 40, padding: "0 14px", borderRadius: 20,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(236,72,153,0.25)",
          boxShadow: "0 4px 18px rgba(236,72,153,0.18)",
          color: "#DB2777", fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span aria-hidden="true">💬</span>{tx.button}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={tx.title}
          style={{
            position: "fixed", bottom: 146, left: 14, zIndex: 301,
            width: "min(320px, calc(100vw - 28px))",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.95)", borderRadius: 22,
            boxShadow: "0 20px 60px rgba(236,72,153,0.2), 0 4px 16px rgba(0,0,0,0.08)",
            padding: 18, fontFamily: "'DM Sans', sans-serif", color: "#3b2a5e",
          }}
        >
          {status === "done" ? (
            <div style={{ textAlign: "center", padding: "18px 4px", fontSize: 15, fontWeight: 600 }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>💗</div>
              {tx.thanks}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{tx.title}</div>
                  <div style={{ fontSize: 12.5, color: "#7a6a9e", marginTop: 4, lineHeight: 1.45 }}>{tx.sub}</div>
                </div>
                <button onClick={close} aria-label={tx.close} style={{
                  background: "none", border: "none", fontSize: 18, color: "#9a8bbd", cursor: "pointer", padding: 2,
                }}>✕</button>
              </div>

              <div style={{ display: "flex", gap: 10, margin: "14px 0 12px" }}>
                {MOODS.map(m => (
                  <button key={m.id} onClick={() => setMood(mood === m.id ? null : m.id)} aria-pressed={mood === m.id}
                    style={{
                      flex: 1, height: 46, borderRadius: 14, fontSize: 24, cursor: "pointer",
                      background: mood === m.id ? "rgba(236,72,153,0.14)" : "rgba(124,58,237,0.05)",
                      border: mood === m.id ? "2px solid #EC4899" : "2px solid transparent",
                      transition: "all 0.15s",
                    }}>{m.emoji}</button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={tx.placeholder}
                rows={3}
                maxLength={1000}
                style={{
                  width: "100%", boxSizing: "border-box", resize: "none",
                  border: "1px solid rgba(124,58,237,0.18)", borderRadius: 14,
                  padding: "10px 12px", fontSize: 14, fontFamily: "inherit", color: "#3b2a5e",
                  outline: "none", background: "#fff",
                }}
              />

              {status === "error" && (
                <div style={{ color: "#DC2626", fontSize: 12.5, marginTop: 8 }}>{tx.error}</div>
              )}

              <button onClick={send} disabled={!canSend} style={{
                width: "100%", marginTop: 12, height: 44, borderRadius: 14, border: "none",
                background: canSend ? "linear-gradient(135deg, #EC4899, #F472B6)" : "rgba(236,72,153,0.25)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: canSend ? "pointer" : "default",
                fontFamily: "inherit",
              }}>{status === "sending" ? tx.sending : tx.send}</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
