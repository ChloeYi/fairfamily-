import { useState } from "react";
import { ChatDots, X, ArrowLeft, PaperPlaneTilt, EnvelopeSimple } from "@phosphor-icons/react";
import { useLanguage } from "../hooks/useLanguage";

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
  const { t } = useLanguage();
  const faq = t.faq;
  const FAQS = faq.items;
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
            }}><img src="https://cdn.jsdelivr.net/npm/@svgmoji/openmoji@2.0.0/svg/1F916.svg" width={20} height={20} alt="robot" /></div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{faq.title}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{faq.subtitle}</div>
            </div>
            <button
              onClick={() => { setOpen(false); setSelected(null); }}
              aria-label="close help"
              style={{
                marginLeft: "auto", width: 32, height: 32, borderRadius: 10,
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <X size={18} color="#fff" weight="bold" />
            </button>
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
                  {faq.greeting}
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
                    background: "none", border: "none", color: "#6b5a9e",
                    fontSize: 13, cursor: "pointer", marginBottom: 12,
                    fontFamily: "'DM Sans', sans-serif", padding: 0,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  <ArrowLeft size={13} /> {faq.back}
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
                        {faq.sent}
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, color: "#6b5a9e", marginBottom: 10, lineHeight: 1.5 }}>
                          <EnvelopeSimple size={13} style={{ marginRight: 4 }} />
                          {faq.contactIntro}
                        </div>
                        <input
                          value={contactForm.title}
                          onChange={e => setContactForm(p => ({ ...p, title: e.target.value }))}
                          placeholder={faq.titlePlaceholder}
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
                          placeholder={faq.messagePlaceholder}
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
                          <PaperPlaneTilt size={14} style={{ marginRight: 6 }} /> {faq.send}
                        </button>
                      </>
                    )}
                  </div>
                ) : (() => {
                  // Split step-based answers on "→" and render as numbered circles.
                  const steps = selected.a.split("→").map(s => s.trim()).filter(Boolean);
                  return (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.05))",
                    border: "1px solid rgba(124,58,237,0.12)",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "12px 14px",
                    fontSize: 14, color: "#4a3870", lineHeight: 1.7,
                    marginRight: 24,
                  }}>
                    {steps.length > 1
                      ? steps.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: 9, marginBottom: i < steps.length - 1 ? 10 : 0, alignItems: "flex-start" }}>
                          <div style={{
                            flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                            background: "linear-gradient(135deg, #7C3AED, #EC4899)", color: "#fff",
                            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                          }}>{i + 1}</div>
                          <div style={{ paddingTop: 1 }}>{step}</div>
                        </div>
                      ))
                      : selected.a}
                  </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
