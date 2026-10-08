// Client for Claude that goes through our own server (/api/claude).
// The Anthropic API key is NOT in the app — it lives only in Vercel env vars.
//
// REACT_APP_API_BASE: the deployed site URL, e.g. https://fairfamily.vercel.app
//   - Required for the Android/iOS app (its origin is https://localhost).
//   - Can be left empty for the web build served from the same Vercel project.
import { auth } from "../firebase";

const API_BASE = (process.env.REACT_APP_API_BASE || "").replace(/\/$/, "");

// Thrown when the free daily AI limit is used up (server answers 429 daily_limit).
export class DailyLimitError extends Error {
  constructor(feature, limit) {
    super("daily-limit");
    this.name = "DailyLimitError";
    this.feature = feature;
    this.limit = limit;
  }
}

// feature: "advice" (AI advice, 3/day free) or "scan" (photo/text logging, 10/day free)
async function create({ messages, max_tokens, feature = "advice" }) {
  const user = auth.currentUser;
  if (!user) throw new Error("not-signed-in");
  const idToken = await user.getIdToken();
  const res = await fetch(`${API_BASE}/api/claude`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ messages, max_tokens, feature }),
  });
  if (res.status === 429) {
    const j = await res.json().catch(() => ({}));
    if (j.error === "daily_limit") throw new DailyLimitError(j.feature || feature, j.limit);
  }
  if (!res.ok) throw new Error(`claude-proxy-${res.status}`);
  return res.json(); // { content: [{ type: "text", text }] } — same shape as the SDK
}

// Minimal stand-in for the SDK's messages.stream(): delivers the full text in one
// "text" event once the response arrives (no token-by-token streaming).
function stream(params) {
  const handlers = [];
  const done = create(params).then(msg => {
    const text = (msg.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    handlers.forEach(h => h(text));
    return msg;
  });
  return {
    on(event, cb) { if (event === "text") handlers.push(cb); return this; },
    finalMessage: () => done,
  };
}

export const claude = { messages: { create, stream } };
