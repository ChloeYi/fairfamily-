import { useState } from "react";
import { ChatDots, X, ArrowLeft, PaperPlaneTilt, EnvelopeSimple } from "@phosphor-icons/react";

const FAQS = [
  {
    q: "How do I add a child?",
    a: "Go to the Kids tab (bottom nav) → tap the + button top right → enter your child's name and age → tap Add Child. They'll appear on your dashboard right away.",
  },
  {
    q: "How do I log an event?",
    a: "Go to the Log tab → select which child it's for → choose a type (Gift, Experience, Milestone, Note) → fill in the description and amount → tap Save Entry.",
  },
  {
    q: "How does photo scanning work?",
    a: "In the Log tab, tap 'Scan Photo' → take a photo or upload one (receipt, gift photo, report card). Claude AI reads it automatically and fills in the description and amount for you.",
  },
  {
    q: "How does AI advice work?",
    a: "Go to the AI Tips tab → tap 'Analyze My Family'. Claude AI reviews all your children's data and gives you honest insights about fairness. You can also ask custom questions in the Ask AI tab.",
  },
  {
    q: "Is my data private?",
    a: "Yes — all data is stored in Firebase under your unique account. No other user can see your family's data. Each login has completely separate data.",
  },
  {
    q: "How do I delete a child?",
    a: "Go to the Kids tab → find the child's card → tap the 🗑 trash icon on the right → confirm deletion. This permanently removes them and their data.",
  },
  {
    q: "Can I switch to Korean?",
    a: "Yes! Tap the 🇺🇸 EN button in the top right corner of any screen to toggle between English and Korean.",
  },
  {
    q: "How is the fairness score calculated?",
    a: "FairFamily compares spending, gifts, experiences, milestones, and time across all your children and generates a fairness score. The closer to 100, the more balanced things are.",
  },
  {
    q: "Contact us",
    a: "",
    isContact: true,
  },
];

const css = `
  @keyframes faqSlideIn {
    from { opacity: 0; transform: translateX(24px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes faqFadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .faq-panel {
    animation: faqSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .faq-item {
    animation: faqFadeUp 0.3s ease both;
  }
  .faq-q-btn:hover {
    background: rgba(124,58,237,0.08) !important;
    transform: translateX(4px);
  }
`;

export default function FAQBot() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [contactForm, setContactForm] = useState({ title: "", message: "" });
  const [sent, setSent] = useState(false);

  const sendContact = () => {
    if (!contactForm.title.trim() || !contactForm.message.trim()) return;
    const to = atob("Y2hsb2UuaGV5ZGF5aWlAZ21haWwuY29t");
    const subject = encodeURIComponent(`[FairFamily] ${contactForm.title}`);
    const body = encodeURIComponent(contactForm.message);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setSent(true);
    setContactForm({ title: "", message: "" });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      <style>{css}</style>

      {/* Floating button */}
      <button
        onClick={() => { setOpen(o => !o); setSelected(null); }}
        style={{
          position: "fixed", bottom: 90, right: 18, zIndex: 300,
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "0 4px 24px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, transition: "all 0.3s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        {open ? <X size={22} color="#7C3AED" weight="bold" /> : <ChatDots size={24} color="#7C3AED" weight="fill" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="faq-panel" style={{
          position: "fixed", bottom: 154, right: 14, zIndex: 299,
          width: 310, maxHeight: "65vh",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.95)",
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(124,58,237,0.2), 0 4px 16px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
        }}>

          {/* Header */}
          <div style={{
            padding: "16px 18px",
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 11,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.35)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}><i className="fi fi-sr-robot" style={{ fontSize: 18, color: "#fff" }} /></div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>FairFamily Help</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>FAQ Assistant</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 18px" }}>

            {!selected ? (
              <>
                {/* Bot greeting bubble */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.05))",
                  border: "1px solid rgba(124,58,237,0.12)",
                  borderRadius: "16px 16px 16px 4px",
                  padding: "12px 14px", marginBottom: 14,
                  fontSize: 13, color: "#4a3870", lineHeight: 1.6,
                }}>
                  Hi! 👋 What would you like to know about FairFamily?
                </div>

                {/* Question list */}
                {FAQS.map((faq, i) => (
                  <button
                    key={i}
                    className="faq-q-btn faq-item"
                    onClick={() => setSelected(faq)}
                    style={{
                      animationDelay: `${i * 0.04}s`,
                      width: "100%", textAlign: "left",
                      background: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(124,58,237,0.12)",
                      borderRadius: 14, padding: "10px 14px",
                      marginBottom: 7, cursor: "pointer",
                      fontSize: 13, color: "#1e0f3c",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500, lineHeight: 1.4,
                      transition: "all 0.2s",
                      boxShadow: "0 2px 8px rgba(124,58,237,0.06)",
                    }}
                  >
                    <ChatDots size={13} style={{ marginRight: 6, flexShrink: 0 }} /> {faq.q}
                  </button>
                ))}
              </>
            ) : (
              <>
                {/* Back button */}
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none", border: "none", color: "#9b8ec4",
                    fontSize: 13, cursor: "pointer", marginBottom: 12,
                    fontFamily: "'DM Sans', sans-serif", padding: 0,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <ArrowLeft size={13} /> Back to questions
                </button>

                {/* User question bubble */}
                <div style={{
                  background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                  borderRadius: "16px 16px 4px 16px",
                  padding: "10px 14px", marginBottom: 10,
                  fontSize: 13, color: "#fff", lineHeight: 1.6,
                  marginLeft: 24,
                }}>
                  {selected.q}
                </div>

                {/* Bot answer bubble */}
                {selected.isContact ? (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.05))",
                    border: "1px solid rgba(124,58,237,0.12)",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "14px",
                  }}>
                    {sent ? (
                      <div style={{ textAlign: "center", padding: "12px 0", fontSize: 13, color: "#7C3AED", fontWeight: 600 }}>
                        ✅ Message sent! We'll get back to you soon.
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: "#9b8ec4", marginBottom: 10, lineHeight: 1.5 }}>
                          <EnvelopeSimple size={13} style={{ marginRight: 4 }} />
                          Send us a message and we'll get back to you
                        </div>
                        <input
                          value={contactForm.title}
                          onChange={e => setContactForm(p => ({ ...p, title: e.target.value }))}
                          placeholder="Title"
                          style={{
                            width: "100%", padding: "9px 12px", marginBottom: 8,
                            borderRadius: 10, border: "1px solid rgba(124,58,237,0.2)",
                            background: "rgba(255,255,255,0.8)",
                            fontSize: 13, color: "#1e0f3c",
                            fontFamily: "'DM Sans', sans-serif", outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                        <textarea
                          value={contactForm.message}
                          onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                          placeholder="Message"
                          rows={4}
                          style={{
                            width: "100%", padding: "9px 12px", marginBottom: 10,
                            borderRadius: 10, border: "1px solid rgba(124,58,237,0.2)",
                            background: "rgba(255,255,255,0.8)",
                            fontSize: 13, color: "#1e0f3c",
                            fontFamily: "'DM Sans', sans-serif", outline: "none",
                            resize: "none", boxSizing: "border-box",
                          }}
                        />
                        <button
                          onClick={sendContact}
                          disabled={!contactForm.title.trim() || !contactForm.message.trim()}
                          style={{
                            width: "100%", padding: "10px",
                            borderRadius: 10, border: "none",
                            background: contactForm.title.trim() && contactForm.message.trim()
                              ? "linear-gradient(135deg, #7C3AED, #EC4899)"
                              : "rgba(124,58,237,0.15)",
                            color: contactForm.title.trim() && contactForm.message.trim() ? "#fff" : "#b0a0d0",
                            fontWeight: 700, fontSize: 13, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                            transition: "all 0.2s",
                          }}
                        >
                          <PaperPlaneTilt size={14} style={{ marginRight: 6 }} /> Send Message
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.05))",
                    border: "1px solid rgba(124,58,237,0.12)",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "12px 14px",
                    fontSize: 13, color: "#4a3870", lineHeight: 1.7,
                    marginRight: 24,
                  }}>
                    {selected.a}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
