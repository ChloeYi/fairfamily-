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

// Free-tier daily limits per user (Korea time). The app sends `feature` with
// each call; anything unknown counts as "advice" (the expensive one).
const DAILY_LIMITS = { advice: 3, scan: 10 };

// Usage counters live in Firestore at aiUsage/{uid}_{YYYY-MM-DD}_{feature},
// written with a service account so users can't reset them.
// Vercel env var: FIREBASE_SERVICE_ACCOUNT = the whole service-account JSON
// (Firebase console → Project settings → Service accounts → Generate new private key).
// If it's not set, limits are skipped (logged) so the app keeps working.
let saToken = { value: null, exp: 0 };

function serviceAccount() {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) return null;
    const sa = JSON.parse(raw);
    return sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

async function googleAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (saToken.value && saToken.exp - 60 > now) return saToken.value;
  const { SignJWT, importPKCS8 } = await import("jose");
  const key = await importPKCS8(sa.private_key.replace(/\\n/g, "\n"), "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/datastore" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!r.ok) throw new Error(`token ${r.status}`);
  const j = await r.json();
  saToken = { value: j.access_token, exp: now + (j.expires_in || 3600) };
  return saToken.value;
}

function koreaDate() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// Atomically adds 1 to today's counter and returns the new count,
// or null if counting isn't configured / failed (fail open).
async function bumpUsage(projectId, uid, feature) {
  const sa = serviceAccount();
  if (!sa) {
    console.warn("FIREBASE_SERVICE_ACCOUNT not set — AI daily limits are OFF");
    return null;
  }
  try {
    const token = await googleAccessToken(sa);
    const db = `projects/${projectId}/databases/(default)`;
    const doc = `${db}/documents/aiUsage/${uid}_${koreaDate()}_${feature}`;
    const r = await fetch(`https://firestore.googleapis.com/v1/${db}/documents:commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        writes: [{
          update: { name: doc, fields: { uid: { stringValue: uid }, feature: { stringValue: feature }, date: { stringValue: koreaDate() } } },
          updateMask: { fieldPaths: ["uid", "feature", "date"] },
          updateTransforms: [{ fieldPath: "count", increment: { integerValue: "1" } }],
        }],
      }),
    });
    if (!r.ok) throw new Error(`firestore ${r.status} ${await r.text()}`);
    const j = await r.json();
    const v = j.writeResults?.[0]?.transformResults?.[0]?.integerValue;
    return v != null ? Number(v) : null;
  } catch (e) {
    console.error("usage counter failed", e.message);
    return null;
  }
}

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
  const feature = body.feature === "scan" ? "scan" : "advice";
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: "bad_request" });
  }

  const used = await bumpUsage(projectId, uid, feature);
  if (used != null && used > DAILY_LIMITS[feature]) {
    return res.status(429).json({ error: "daily_limit", feature, limit: DAILY_LIMITS[feature] });
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
