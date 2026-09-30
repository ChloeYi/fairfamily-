// Vercel serverless function: the ONLY place the Anthropic API key lives.
// The app sends { messages, max_tokens } plus the user's Firebase ID token;
// this function verifies the token, then calls Claude with the server-side key.
//
// Vercel → Project → Settings → Environment Variables:
//   ANTHROPIC_API_KEY              your Claude API key (NO "REACT_APP_" prefix)
//   REACT_APP_FIREBASE_PROJECT_ID  already set for the web build; reused here

const Anthropic = require("@anthropic-ai/sdk").default;

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS_CAP = 1500;
const MAX_MESSAGES = 20;

// Firebase ID tokens are RS256 JWTs signed by Google's securetoken service.
const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let client;
let jwks;

function setCors(res) {
  // Auth is by Bearer token (no cookies), so any origin is fine — this also
  // covers the Capacitor app, whose origin is https://localhost.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

// Verifies signature, issuer, audience and expiry of a Firebase ID token.
// Returns the user's uid, or null if the token is missing/invalid/expired.
async function verifyFirebaseToken(idToken, projectId) {
  if (!idToken) return null;
  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  jwks ||= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID;
  if (!process.env.ANTHROPIC_API_KEY || !projectId) {
    return res.status(500).json({ error: "server_not_configured" });
  }

  const idToken = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const uid = await verifyFirebaseToken(idToken, projectId);
  if (!uid) return res.status(401).json({ error: "unauthorized" });

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch {
    return res.status(400).json({ error: "bad_request" });
  }
  const { messages, max_tokens } = body;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: "bad_request" });
  }

  client ||= new Anthropic(); // reads ANTHROPIC_API_KEY
  try {
    const message = await client.messages.create({
      model: MODEL, // fixed server-side so clients can't pick pricier models
      max_tokens: Math.min(Number(max_tokens) || 1024, MAX_TOKENS_CAP),
      messages,
      metadata: { user_id: uid },
    });
    return res.status(200).json({ content: message.content });
  } catch (e) {
    if (e instanceof Anthropic.BadRequestError) {
      return res.status(400).json({ error: "bad_request" });
    } else if (e instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "rate_limited" });
    } else if (e instanceof Anthropic.APIError) {
      console.error("Anthropic error", e.status, e.message);
    } else {
      console.error("Claude proxy failure", e);
    }
    return res.status(502).json({ error: "upstream_error" });
  }
};
