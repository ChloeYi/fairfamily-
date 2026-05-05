import { useState, useEffect, useMemo } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";

const client = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = "claude-sonnet-4-20250514";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
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
    0%, 100% { box-shadow: 0 0 20px rgba(78,205,196,0.2); }
    50%       { box-shadow: 0 0 40px rgba(78,205,196,0.5); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }

  .shimmer {
    background: linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #FF6B6B);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  .spinner {
    width: 28px; height: 28px;
    border: 2px solid rgba(78,205,196,0.2);
    border-top-color: #4ECDC4; border-radius: 50%;
    animation: spin 0.8s linear infinite; margin: 0 auto;
  }

  .insight-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px; padding: 18px; margin-bottom: 12px;
    animation: fadeUp 0.5s ease both;
  }

  .ai-btn {
    width: 100%; padding: 16px; border-radius: 18px; border: none;
    cursor: pointer; font-size: 16px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; transition: all 0.3s;
    animation: glowPulse 2s ease infinite;
  }

  .quick-tip {
    display: flex; gap: 12px; align-items: flex-start;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px; padding: 14px; margin-bottom: 8px;
    animation: fadeUp 0.4s ease both; cursor: pointer; transition: all 0.2s;
  }
  .quick-tip:hover { background: rgba(255,255,255,0.07); transform: translateX(4px); }

  .child-chip {
    display: inline-flex; align-items: center; gap: 5px;
    border-radius: 8px; padding: 2px 10px;
    font-size: 11px; font-weight: 600;
    margin-right: 6px; margin-bottom: 4px;
  }
`;

const parseJSON = (text) => {
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
};

export default function AIAdviceScreen() {
  const { t } = useLanguage();
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [response, setResponse] = useState("");
  const [activeSection, setActiveSection] = useState("insights");

  // Load children from Firestore
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

  // Build dynamic family summary for Claude
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
    setLoading(true);
    setInsights(null);

    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `You are a caring family advisor analyzing parenting fairness across children.

Children (indexed 0 to ${children.length - 1}):
${familySummary}

Analyze this data and return exactly ${Math.min(3, children.length)} insights as a JSON array.
Each insight must have:
- urgent: boolean
- childIndex: number (0 to ${children.length - 1})
- title: short title with a relevant emoji
- body: 2-3 sentences of specific, caring, actionable advice
- action: action button text string, or null if not urgent

Return ONLY valid JSON with no markdown, no code fences, no explanation.`,
        }],
      });

      const parsed = parseJSON(message.content[0].text);
      setInsights(parsed.map(ins => ({
        ...ins,
        child: children[ins.childIndex] || children[0],
      })));
    } catch (e) {
      console.error("AI insights error:", e);
      setInsights([{
        urgent: false, child: children[0],
        title: "Connection issue",
        body: "Could not connect to Claude AI. Please check your API key and try again.",
        action: null,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async (prompt) => {
    setSelectedPrompt(prompt);
    setResponse("");
    setLoading(true);

    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `You are a warm, practical family advisor. Answer the question using the family data below.

${familySummary}

Question: ${prompt.text}

Give specific, actionable advice in 3–5 sentences. Use bullet points if helpful.`,
        }],
      });

      stream.on("text", text => setResponse(prev => prev + text));
      await stream.finalMessage();
    } catch (e) {
      console.error("Ask AI error:", e);
      setResponse("Sorry, I couldn't connect to Claude AI right now. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #0a1520 0%, #06090f 60%)",
      fontFamily: "'DM Sans', sans-serif", color: "#e8f0f8", paddingBottom: 80,
    }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ padding: "28px 20px 20px" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#334455", textTransform: "uppercase", marginBottom: 4 }}>
          {t.aiAdvice.poweredBy}
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700 }}>
          <span className="shimmer">{t.aiAdvice.title}</span>
        </h1>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Loading children */}
        {childrenLoading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" style={{ marginBottom: 12 }} />
            <div style={{ color: "#334455", fontSize: 13 }}>{t.aiAdvice.loadingFamily}</div>
          </div>
        )}

        {/* No children */}
        {!childrenLoading && children.length === 0 && (
          <div style={{
            textAlign: "center", padding: "48px 20px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, animation: "fadeUp 0.5s ease both",
          }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
            <div style={{ fontSize: 15, color: "#8899aa" }}>{t.aiAdvice.noChildren}</div>
          </div>
        )}

        {/* Main content */}
        {!childrenLoading && children.length > 0 && (
          <>
            {/* Section tabs */}
            <div style={{
              display: "flex", gap: 6,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 14, padding: 4, marginBottom: 20,
            }}>
              {[
                { id: "insights", label: t.aiAdvice.analysisTab },
                { id: "ask", label: t.aiAdvice.askTab },
              ].map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                  flex: 1, padding: "10px", borderRadius: 10,
                  background: activeSection === s.id
                    ? "linear-gradient(135deg, rgba(78,205,196,0.2), rgba(78,205,196,0.08))"
                    : "none",
                  border: activeSection === s.id
                    ? "1px solid rgba(78,205,196,0.3)" : "1px solid transparent",
                  color: activeSection === s.id ? "#4ECDC4" : "#445566",
                  cursor: "pointer", fontSize: 13, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                }}>{s.label}</button>
              ))}
            </div>

            {/* ANALYSIS SECTION */}
            {activeSection === "insights" && (
              <div>
                {!insights && !loading && (
                  <div style={{ textAlign: "center", padding: "20px 0 28px", animation: "fadeUp 0.6s ease both" }}>
                    <div style={{
                      width: 100, height: 100, borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(78,205,196,0.2), rgba(255,107,107,0.1))",
                      border: "2px solid rgba(78,205,196,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 20px", fontSize: 44,
                      animation: "glowPulse 2s ease infinite, float 4s ease-in-out infinite",
                    }}>🤖</div>
                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                      {t.aiAdvice.orbTitle}
                    </h2>
                    <p style={{ color: "#445566", fontSize: 14, lineHeight: 1.7, maxWidth: 280, margin: "0 auto 24px" }}>
                      {t.aiAdvice.orbSub}
                    </p>
                    <button className="ai-btn" onClick={getInsights} style={{ background: "linear-gradient(135deg, #4ECDC4, #45B7D1)", color: "#000" }}>
                      {t.aiAdvice.analyze}
                    </button>
                  </div>
                )}

                {loading && !insights && (
                  <div style={{ textAlign: "center", padding: "40px 0", animation: "fadeUp 0.4s ease both" }}>
                    <div className="spinner" style={{ marginBottom: 16 }} />
                    <div style={{ color: "#4ECDC4", fontSize: 14, animation: "pulse 1.5s ease infinite" }}>
                      {t.aiAdvice.analyzing}
                    </div>
                    <div style={{ color: "#334455", fontSize: 12, marginTop: 8 }}>
                      {t.aiAdvice.analyzingNote}
                    </div>
                  </div>
                )}

                {insights && (
                  <div>
                    <div style={{
                      background: "rgba(78,205,196,0.06)", border: "1px solid rgba(78,205,196,0.2)",
                      borderRadius: 16, padding: "12px 16px", marginBottom: 16,
                      display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.4s ease both",
                    }}>
                      <span style={{ fontSize: 20 }}>✅</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#4ECDC4", fontWeight: 600 }}>{t.aiAdvice.complete}</div>
                        <div style={{ fontSize: 11, color: "#334455" }}>{t.aiAdvice.insightsFound(insights.length)}</div>
                      </div>
                      <button onClick={() => setInsights(null)} style={{
                        marginLeft: "auto", background: "none", border: "none",
                        color: "#334455", cursor: "pointer", fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{t.aiAdvice.refresh}</button>
                    </div>

                    {insights.map((ins, i) => (
                      <div key={i} className="insight-card" style={{
                        borderColor: ins.urgent ? "rgba(255,107,107,0.2)" : "rgba(255,255,255,0.08)",
                        background: ins.urgent ? "rgba(255,107,107,0.05)" : "rgba(255,255,255,0.04)",
                        animationDelay: `${i * 0.1}s`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          {ins.child && (
                            <span style={{ background: `${ins.child.color}18`, border: `1px solid ${ins.child.color}44` }}
                              className="child-chip">
                              {ins.child.emoji} {ins.child.name}
                            </span>
                          )}
                          {ins.urgent && (
                            <span style={{
                              background: "rgba(255,107,107,0.15)", color: "#FF6B6B",
                              fontSize: 10, fontWeight: 600, borderRadius: 6, padding: "2px 8px",
                            }}>{t.aiAdvice.needsAttention}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#ddeeff", marginBottom: 8 }}>{ins.title}</div>
                        <p style={{ fontSize: 13, color: "#8899aa", lineHeight: 1.7, margin: 0 }}>{ins.body}</p>
                        {ins.action && ins.child && (
                          <button style={{
                            marginTop: 12, padding: "8px 16px",
                            background: `${ins.child.color}18`, border: `1px solid ${ins.child.color}44`,
                            borderRadius: 10, color: ins.child.color,
                            cursor: "pointer", fontSize: 12, fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{ins.action}</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ASK AI SECTION */}
            {activeSection === "ask" && (
              <div>
                {!selectedPrompt && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: "#445566", textTransform: "uppercase", marginBottom: 12 }}>
                      {t.aiAdvice.quickQuestions}
                    </div>
                    {t.aiAdvice.quickPrompts.map((p, i) => (
                      <div key={i} className="quick-tip"
                        style={{ animationDelay: `${i * 0.06}s` }}
                        onClick={() => askQuestion(p)}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
                        <span style={{ fontSize: 14, color: "#c0cdd8", lineHeight: 1.5 }}>{p.text}</span>
                        <span style={{ color: "#2a3a4a", fontSize: 16, flexShrink: 0 }}>›</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPrompt && (
                  <div style={{ animation: "fadeUp 0.4s ease both" }}>
                    <button onClick={() => { setSelectedPrompt(null); setResponse(""); setLoading(false); }}
                      style={{
                        background: "rgba(255,255,255,0.07)", border: "none",
                        borderRadius: 10, color: "#aaa", padding: "8px 14px",
                        cursor: "pointer", fontSize: 13, marginBottom: 16,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{t.childRoom.back}</button>

                    <div style={{
                      background: "rgba(78,205,196,0.08)", border: "1px solid rgba(78,205,196,0.2)",
                      borderRadius: 16, padding: "12px 16px", marginBottom: 16,
                    }}>
                      <div style={{ fontSize: 11, color: "#4ECDC4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
                        {t.aiAdvice.yourQuestion}
                      </div>
                      <div style={{ fontSize: 14, color: "#ddeeff" }}>
                        {selectedPrompt.icon} {selectedPrompt.text}
                      </div>
                    </div>

                    {loading && !response && (
                      <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div className="spinner" style={{ marginBottom: 10 }} />
                        <div style={{ color: "#4ECDC4", fontSize: 13 }}>{t.aiAdvice.thinking}</div>
                      </div>
                    )}

                    {response && (
                      <div style={{
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 18, padding: 18,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 20 }}>🤖</span>
                          <span style={{ fontSize: 12, color: "#4ECDC4", fontWeight: 600 }}>Claude AI</span>
                        </div>
                        <div style={{ fontSize: 14, color: "#c0cdd8", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                          {response}
                          {loading && <span style={{ animation: "pulse 1s ease infinite", display: "inline-block" }}>▊</span>}
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
