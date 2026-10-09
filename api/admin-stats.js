// Vercel serverless function: tester metrics for the admin page (/app/admin).
// Only the emails in ADMIN_EMAILS may call it. Reads Firestore with the
// service account (same FIREBASE_SERVICE_ACCOUNT env var as api/claude.js),
// so no Firestore security rule has to open other users' data.
//
// Vercel env vars:
//   FIREBASE_SERVICE_ACCOUNT  service-account JSON (already used by api/claude.js)
//   ADMIN_EMAILS              optional, comma-separated; defaults below

const DEFAULT_ADMINS = ["chloe.heydayii@gmail.com", "jessicamakethings@gmail.com"];
const DAY = 24 * 3600 * 1000;
const RETENTION_DAYS = 14;

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwks;
let saToken = { value: null, exp: 0 };

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

function admins() {
  const raw = process.env.ADMIN_EMAILS;
  const list = raw ? raw.split(",") : DEFAULT_ADMINS;
  return list.map(s => s.trim().toLowerCase()).filter(Boolean);
}

async function verifyAdmin(idToken, projectId) {
  if (!idToken) return null;
  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  jwks ||= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
    });
    const email = String(payload.email || "").toLowerCase();
    if (!payload.email_verified || !admins().includes(email)) return null;
    return email;
  } catch {
    return null;
  }
}

function serviceAccount() {
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "");
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

// Runs a collection-group query over the whole database and returns
// [{ path, fields }] for every document in collections named `collectionId`.
async function allDocs(projectId, token, collectionId, fieldPaths) {
  const base = `projects/${projectId}/databases/(default)/documents`;
  const structuredQuery = { from: [{ collectionId, allDescendants: true }] };
  if (fieldPaths) structuredQuery.select = { fields: fieldPaths.map(f => ({ fieldPath: f })) };
  const r = await fetch(`https://firestore.googleapis.com/v1/${base}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ structuredQuery }),
  });
  if (!r.ok) throw new Error(`firestore ${collectionId} ${r.status} ${await r.text()}`);
  const rows = await r.json();
  return rows
    .filter(x => x.document)
    .map(x => ({ path: x.document.name.slice(base.length + 1), fields: x.document.fields || {} }));
}

// Firestore REST value → plain JS
function val(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("mapValue" in v) {
    const o = {};
    for (const [k, x] of Object.entries(v.mapValue.fields || {})) o[k] = val(x);
    return o;
  }
  return null;
}

const ms = s => (s ? Date.parse(s) : NaN);

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const idToken = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const admin = projectId && (await verifyAdmin(idToken, projectId));
  if (!admin) return res.status(403).json({ error: "forbidden" });

  const sa = serviceAccount();
  if (!sa) return res.status(500).json({ error: "service_account_missing" });

  try {
    const token = await googleAccessToken(sa);
    const [users, children, logs, feedback] = await Promise.all([
      allDocs(projectId, token, "users", ["email", "displayName", "createdAt", "onboardingComplete", "acquisition"]),
      allDocs(projectId, token, "children", ["name"]),
      allDocs(projectId, token, "logs", ["createdAt"]),
      allDocs(projectId, token, "feedback", ["createdAt"]),
    ]);

    // Only real user data lives under users/{uid}/... (marketing demo data is elsewhere)
    const uidOf = path => {
      const m = /^users\/([^/]+)\//.exec(path);
      return m ? m[1] : null;
    };

    const byUid = {};
    for (const u of users) {
      if (!/^users\/[^/]+$/.test(u.path)) continue;
      const uid = u.path.split("/")[1];
      const acq = val(u.fields.acquisition) || {};
      byUid[uid] = {
        uid,
        email: val(u.fields.email),
        name: val(u.fields.displayName),
        signedUpAt: val(u.fields.createdAt),
        onboarded: val(u.fields.onboardingComplete) === true,
        source: acq.source || "unknown",
        children: 0,
        logs: 0,
        logTimes: [],
        feedback: 0,
      };
    }
    const get = uid => uid && byUid[uid];
    for (const c of children) { const u = get(uidOf(c.path)); if (u) u.children++; }
    for (const l of logs) {
      const u = get(uidOf(l.path));
      if (!u) continue;
      u.logs++;
      const t = ms(val(l.fields.createdAt));
      if (!Number.isNaN(t)) u.logTimes.push(t);
    }
    for (const f of feedback) { const u = get(uidOf(f.path)); if (u) u.feedback++; }

    const now = Date.now();
    const rows = Object.values(byUid).map(u => {
      const signed = ms(u.signedUpAt);
      const lastLog = u.logTimes.length ? Math.max(...u.logTimes) : null;
      const eligible = !Number.isNaN(signed) && now - signed >= RETENTION_DAYS * DAY;
      const retained = eligible ? u.logTimes.some(t => t - signed >= RETENTION_DAYS * DAY) : null;
      const activeThisWeek = u.logTimes.some(t => now - t <= 7 * DAY);
      const { logTimes, ...rest } = u;
      return { ...rest, lastLogAt: lastLog ? new Date(lastLog).toISOString() : null, retained, activeThisWeek };
    }).sort((a, b) => (ms(b.signedUpAt) || 0) - (ms(a.signedUpAt) || 0));

    const eligible = rows.filter(r => r.retained !== null);
    const summary = {
      users: rows.length,
      multiChild: rows.filter(r => r.children >= 2).length,
      withLogs: rows.filter(r => r.logs > 0).length,
      activeThisWeek: rows.filter(r => r.activeThisWeek).length,
      retentionEligible: eligible.length,
      retained: eligible.filter(r => r.retained).length,
      feedback: feedback.filter(f => uidOf(f.path)).length,
    };

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ generatedAt: new Date(now).toISOString(), summary, rows });
  } catch (e) {
    console.error("admin-stats failed", e.message);
    return res.status(502).json({ error: "firestore_error" });
  }
};
