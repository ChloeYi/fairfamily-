import { useState, useEffect, useMemo } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";
import { Command, UsersThree } from "@phosphor-icons/react";

const client = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = "claude-sonnet-4-6";
const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes titleShake {
    0%,100% { transform: translateX(0); }
    15%     { transform: translateX(-7px) rotate(-1deg); }
    30%     { transform: translateX(7px) rotate(1deg); }
    45%     { transform: translateX(-5px); }
    60%     { transform: translateX(5px); }
    75%     { transform: translateX(-2px); }
    90%     { transform: translateX(2px); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(0.97); }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 28px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.9); }
    50%       { box-shadow: 0 0 56px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,1); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }

  .title-text {
    color: #1e0f3c;
    display: inline-block;
    text-shadow: 0 4px 18px rgba(30,15,60,0.18), 0 2px 6px rgba(0,0,0,0.10);
    animation: titleShake 0.45s ease 2;
  }

  .spinner {
    width: 32px; height: 32px;
    border: 2px solid rgba(139,92,246,0.15);
    border-top-color: #8B5CF6; border-radius: 50%;
    animation: spin 0.8s linear infinite; margin: 0 auto;
  }

  .glass-card {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 24px; padding: 22px; margin-bottom: 14px;
    animation: fadeUp 0.5s ease both;
    box-shadow: 0 8px 32px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1);
    position: relative; z-index: 1;
  }

  .ai-btn {
    width: 100%; padding: 18px; border-radius: 20px; border: none;
    cursor: pointer; font-size: 17px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; transition: all 0.3s;
    animation: glowPulse 2.5s ease infinite;
  }

  .quick-tip {
    display: flex; gap: 14px; align-items: flex-start;
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.95);
    border-radius: 20px; padding: 18px; margin-bottom: 10px;
    animation: fadeUp 0.4s ease both; cursor: pointer; transition: all 0.25s;
    box-shadow: 0 4px 20px rgba(139,92,246,0.08);
    position: relative; z-index: 1;
  }
  .quick-tip:hover {
    background: rgba(255,255,255,0.92);
    transform: translateX(6px);
    box-shadow: 0 8px 32px rgba(139,92,246,0.14);
  }

  .child-chip {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 10px; padding: 4px 12px;
    font-size: 13px; font-weight: 600;
    margin-right: 8px; margin-bottom: 4px;
  }
`;

const parseJSON = (text) => {
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
};

export default function AIAdviceScreen() {
  const { t, titleFont } = useLanguage();
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [response, setResponse] = useState("");
  const [activeSection, setActiveSection] = useState("insights");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    return onSnapshot(collection(db, "users", uid, "children"), snap => {
      const kids = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      kids.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setChildren(kids);
      setChildrenLoading(false);
    });
  }, []);

  const familySummary = useMemo(() => {
    if (!children.length) return "No family data available.";
    return children.map((c, i) =>
      `${i}. ${c.name}, age ${c.age}: $${c.totalSpent || 0} total spent, ` +
      `${c.giftCount || 0} gifts, ${c.experienceCount || 0} experiences, ` +
      `${c.milestoneCount || 0} milestones.`
    ).join("\n");
  }, [children]);

  const getInsights = async () => {
    if (!children.length) return;
    setLoading(true); setInsights(null);
    try {
      const message = await client.messages.create({
        model: MODEL, max_tokens: 1024,
        messages: [{ role: "user", content: `You are a caring family advisor analyzing parenting fairness across children.

Children (indexed 0 to ${children.length - 1}):
${familySummary}

Analyze this data and return exactly ${Math.min(3, children.length)} insights as a JSON array.
Each insight must have:
- urgent: boolean
- childIndex: number (0 to ${children.length - 1})
- title: short title with a relevant emoji
- body: 2-3 sentences of specific, caring, actionable advice
- action: action button text string, or null if not urgent

Return ONLY valid JSON with no markdown, no code fences, no explanation.` }],
      });
      const parsed = parseJSON(message.content[0].text);
      setInsights(parsed.map(ins => ({ ...ins, child: children[ins.childIndex] || children[0] })));
    } catch (e) {
      console.error("AI insights error:", e);
      setInsights([{ urgent: false, child: children[0], title: "Connection issue", body: "Could not connect to Claude AI. Please check your API key and try again.", action: null }]);
    } finally { setLoading(false); }
  };

  const askQuestion = async (prompt) => {
    setSelectedPrompt(prompt); setResponse(""); setLoading(true);
    try {
      const stream = client.messages.stream({
        model: MODEL, max_tokens: 1024,
        messages: [{ role: "user", content: `You are a warm, practical family advisor. Answer the question using the family data below.

${familySummary}

Question: ${prompt.text}

Give specific, actionable advice in 3–5 sentences. Use bullet points if helpful.` }],
      });
      stream.on("text", text => setResponse(prev => prev + text));
      await stream.finalMessage();
    } catch (e) {
      console.error("Ask AI error:", e);
      setResponse("Sorry, I couldn't connect to Claude AI right now.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      fontFamily: "'DM Sans', sans-serif", color: "#1e0f3c",
      paddingBottom: 90, position: "relative", zIndex: 1,
    }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding: "36px 24px 24px" }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
          {t.aiAdvice.poweredBy}
        </div>
        <h1 style={{
          fontFamily: "'Climate Crisis', sans-serif",
          fontSize: 36, fontWeight: 400, lineHeight: 1.1, letterSpacing: 0,
        }}>
          <span className="title-text">{t.aiAdvice.title}</span>
        </h1>
      </div>

      <div style={{ padding: "0 20px" }}>

        {childrenLoading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner" style={{ marginBottom: 16 }} />
            <div style={{ color: "#a394c8", fontSize: 15 }}>{t.aiAdvice.loadingFamily}</div>
          </div>
        )}

        {!childrenLoading && children.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: 24, animation: "fadeUp 0.5s ease both",
            boxShadow: "0 8px 32px rgba(139,92,246,0.08)",
            position: "relative", zIndex: 1,
          }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <UsersThree size={64} weight="duotone" color="#7C3AED" />
            </div>
            <div style={{ fontFamily: "'Climate Crisis', sans-serif", fontSize: 28, fontWeight: 600, marginBottom: 10, color: "#1e0f3c" }}>
              {t.aiAdvice.noChildren}
            </div>
          </div>
        )}

        {!childrenLoading && children.length > 0 && (
          <>
            {/* Section tabs */}
            <div style={{
              display: "flex", gap: 6,
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(16px)",
              borderRadius: 18, padding: 5, marginBottom: 22,
              border: "1px solid rgba(255,255,255,0.95)",
              boxShadow: "0 4px 16px rgba(139,92,246,0.08)",
              position: "relative", zIndex: 1,
            }}>
              {[{ id: "insights", label: t.aiAdvice.analysisTab }, { id: "ask", label: t.aiAdvice.askTab }].map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                  flex: 1, padding: "12px", borderRadius: 13,
                  background: activeSection === s.id ? "rgba(139,92,246,0.12)" : "none",
                  border: activeSection === s.id ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                  color: activeSection === s.id ? "#7C3AED" : "#a394c8",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                }}>{s.label}</button>
              ))}
            </div>

            {/* ANALYSIS */}
            {activeSection === "insights" && (
              <div>
                {!insights && !loading && (
                  <div style={{ textAlign: "center", padding: "24px 0 32px", animation: "fadeUp 0.6s ease both", position: "relative", zIndex: 1 }}>
                    <div style={{
                      width: 110, height: 110, borderRadius: "50%",
                      background: "rgba(255,255,255,0.8)",
                      border: "2px solid rgba(139,92,246,0.2)",
                      backdropFilter: "blur(20px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 24px",
                      animation: "glowPulse 2.5s ease infinite, float 4s ease-in-out infinite",
                      boxShadow: "0 8px 32px rgba(139,92,246,0.15)",
                    }}><img src="https://cdn.jsdelivr.net/npm/@svgmoji/openmoji@2.0.0/svg/1F916.svg" width={52} height={52} alt="robot" /></div>
                    <h2 style={{
                      fontFamily: "'Climate Crisis', sans-serif",
                      fontSize: 34, fontWeight: 700, marginBottom: 12, letterSpacing: -0.3,
                      color: "#1e0f3c",
                    }}>{t.aiAdvice.orbTitle}</h2>
                    <p style={{ color: "#9b8ec4", fontSize: 16, lineHeight: 1.7, maxWidth: 300, margin: "0 auto 28px" }}>
                      {t.aiAdvice.orbSub}
                    </p>
                    <button className="ai-btn" onClick={getInsights}
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #EC4899)", color: "#fff", boxShadow: "0 6px 28px rgba(139,92,246,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <Command size={20} weight="bold" />
                      {t.aiAdvice.analyze}
                    </button>
                  </div>
                )}

                {loading && !insights && (
                  <div style={{ textAlign: "center", padding: "56px 0", animation: "fadeUp 0.4s ease both" }}>
                    <div className="spinner" style={{ marginBottom: 20 }} />
                    <div style={{ color: "#8B5CF6", fontSize: 16, animation: "pulse 1.5s ease infinite" }}>
                      {t.aiAdvice.analyzing}
                    </div>
                    <div style={{ color: "#a394c8", fontSize: 14, marginTop: 10 }}>{t.aiAdvice.analyzingNote}</div>
                  </div>
                )}

                {insights && (
                  <div>
                    <div style={{
                      background: "rgba(139,92,246,0.08)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(139,92,246,0.18)",
                      borderRadius: 20, padding: "14px 18px", marginBottom: 18,
                      display: "flex", alignItems: "center", gap: 12,
                      animation: "fadeUp 0.4s ease both", position: "relative", zIndex: 1,
                    }}>
                      <span style={{ fontSize: 22 }}>✅</span>
                      <div>
                        <div style={{ fontSize: 15, color: "#7C3AED", fontWeight: 600 }}>{t.aiAdvice.complete}</div>
                        <div style={{ fontSize: 13, color: "#9b8ec4" }}>{t.aiAdvice.insightsFound(insights.length)}</div>
                      </div>
                      <button onClick={() => setInsights(null)} style={{
                        marginLeft: "auto", background: "none", border: "none",
                        color: "#a394c8", cursor: "pointer", fontSize: 13,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{t.aiAdvice.refresh}</button>
                    </div>

                    {insights.map((ins, i) => (
                      <div key={i} className="glass-card" style={{
                        borderColor: ins.urgent ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.95)",
                        background: ins.urgent ? "rgba(236,72,153,0.06)" : "rgba(255,255,255,0.72)",
                        animationDelay: `${i * 0.1}s`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          {ins.child && (
                            <span className="child-chip"
                              style={{ background: `${ins.child.color}18`, border: `1px solid ${ins.child.color}38`, color: ins.child.color }}>
                              {ins.child.emoji} {ins.child.name}
                            </span>
                          )}
                          {ins.urgent && (
                            <span style={{
                              background: "rgba(236,72,153,0.12)", color: "#EC4899",
                              fontSize: 11, fontWeight: 600, borderRadius: 8, padding: "3px 10px",
                            }}>{t.aiAdvice.needsAttention}</span>
                          )}
                        </div>
                        <div style={{
                          fontFamily: "'Climate Crisis', sans-serif",
                          fontSize: 22, fontWeight: 600, color: "#1e0f3c", marginBottom: 10, lineHeight: 1.3,
                        }}>{ins.title}</div>
                        <p style={{ fontSize: 15, color: "#6b5b9e", lineHeight: 1.8, margin: 0 }}>{ins.body}</p>
                        {ins.action && ins.child && (
                          <button style={{
                            marginTop: 14, padding: "10px 18px",
                            background: `${ins.child.color}14`, border: `1px solid ${ins.child.color}38`,
                            borderRadius: 12, color: ins.child.color,
                            cursor: "pointer", fontSize: 13, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{ins.action}</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ASK AI */}
            {activeSection === "ask" && (
              <div>
                {!selectedPrompt && (
                  <div>
                    <div style={{ fontSize: 12, letterSpacing: 2.5, color: "#6b5a9e", fontWeight: 700, textTransform: "uppercase", marginBottom: 16 }}>
                      {t.aiAdvice.quickQuestions}
                    </div>
                    {t.aiAdvice.quickPrompts.map((p, i) => (
                      <div key={i} className="quick-tip"
                        style={{ animationDelay: `${i * 0.06}s` }}
                        onClick={() => askQuestion(p)}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</span>
                        <span style={{ fontSize: 15, color: "#4a3870", lineHeight: 1.6 }}>{p.text}</span>
                        <span style={{ color: "#c4b8e0", fontSize: 18, flexShrink: 0, marginLeft: "auto" }}>›</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPrompt && (
                  <div style={{ animation: "fadeUp 0.4s ease both" }}>
                    <button onClick={() => { setSelectedPrompt(null); setResponse(""); setLoading(false); }} style={{
                      background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.95)",
                      borderRadius: 12, color: "#7c6faa", padding: "10px 16px",
                      cursor: "pointer", fontSize: 14, marginBottom: 18,
                      fontFamily: "'DM Sans', sans-serif",
                      boxShadow: "0 2px 12px rgba(139,92,246,0.08)",
                    }}>{t.childRoom.back}</button>

                    <div style={{
                      background: "rgba(139,92,246,0.07)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(139,92,246,0.18)",
                      borderRadius: 20, padding: "16px 18px", marginBottom: 18,
                      position: "relative", zIndex: 1,
                    }}>
                      <div style={{ fontSize: 11, color: "#8B5CF6", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>
                        {t.aiAdvice.yourQuestion}
                      </div>
                      <div style={{ fontSize: 16, color: "#1e0f3c" }}>
                        {selectedPrompt.icon} {selectedPrompt.text}
                      </div>
                    </div>

                    {loading && !response && (
                      <div style={{ textAlign: "center", padding: "32px 0" }}>
                        <div className="spinner" style={{ marginBottom: 14 }} />
                        <div style={{ color: "#8B5CF6", fontSize: 15 }}>{t.aiAdvice.thinking}</div>
                      </div>
                    )}

                    {response && (
                      <div className="glass-card">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 11,
                            background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.08))",
                            border: "1px solid rgba(139,92,246,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}><img src="https://cdn.jsdelivr.net/npm/@svgmoji/openmoji@2.0.0/svg/1F916.svg" width={20} height={20} alt="robot" /></div>
                          <span style={{ fontSize: 14, color: "#7C3AED", fontWeight: 600 }}>Claude AI</span>
                        </div>
                        <div style={{ fontSize: 15, color: "#4a3870", lineHeight: 1.9, whiteSpace: "pre-line" }}>
                          {response}
                          {loading && <span style={{ animation: "pulse 1s ease infinite", display: "inline-block", color: "#8B5CF6" }}>▊</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
