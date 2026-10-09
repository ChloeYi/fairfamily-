import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

// Admin-only tester metrics. The server (api/admin-stats.js) checks the
// signed-in email, so other users only ever see "no access".
const API_BASE = (process.env.REACT_APP_API_BASE || "").replace(/\/$/, "");

const fmtDate = s => {
  if (!s) return "–";
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};
const daysAgo = s => (s ? Math.floor((Date.now() - new Date(s).getTime()) / 86400000) : null);

const ERRORS = {
  403: "이 페이지는 관리자 계정만 볼 수 있어요.",
  service_account_missing: "Vercel에 FIREBASE_SERVICE_ACCOUNT 환경변수가 없어요.",
  default: "데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요.",
};

function Stat({ label, value, sub, accent }) {
  return (
    <div style={{
      flex: "1 1 140px", background: "rgba(255,255,255,0.85)", borderRadius: 18,
      padding: "14px 16px", border: "1px solid rgba(255,255,255,0.95)",
      boxShadow: "0 4px 16px rgba(139,92,246,0.08)",
    }}>
      <div style={{ fontSize: 12.5, color: "#7a6a9e", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent || "#3b2a5e", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#9a8bbd", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function AdminScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const r = await fetch(`${API_BASE}/api/admin-stats`, { headers: { Authorization: `Bearer ${idToken}` } });
      const j = await r.json().catch(() => ({}));
      if (r.status === 403) throw new Error(ERRORS[403]);
      if (!r.ok) throw new Error(ERRORS[j.error] || ERRORS.default);
      setData(j);
    } catch (e) {
      setError(e.message || ERRORS.default);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const s = data?.summary;
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "–");

  const th = { textAlign: "left", padding: "10px 10px", fontSize: 12, color: "#7a6a9e", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid rgba(124,58,237,0.12)" };
  const td = { padding: "10px 10px", fontSize: 13, color: "#3b2a5e", whiteSpace: "nowrap", borderBottom: "1px solid rgba(124,58,237,0.06)" };

  return (
    <div style={{ minHeight: "100vh", padding: "70px 16px 40px", fontFamily: "'DM Sans', sans-serif", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <button onClick={() => navigate("/dashboard")} style={{
            background: "rgba(255,255,255,0.8)", border: "none", borderRadius: 12, padding: "8px 12px",
            color: "#5b4899", fontWeight: 700, cursor: "pointer",
          }}>←</button>
          <h1 style={{ margin: 0, fontSize: 22, color: "#3b2a5e" }}>테스터 현황</h1>
          <button onClick={load} disabled={loading} style={{
            marginLeft: "auto", background: "#EC4899", color: "#fff", border: "none", borderRadius: 12,
            padding: "8px 14px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.6 : 1,
          }}>{loading ? "불러오는 중…" : "새로고침"}</button>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", color: "#B91C1C", borderRadius: 14, padding: 14, fontSize: 14 }}>{error}</div>
        )}

        {s && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
              <Stat label="가입자" value={s.users} sub={`아이 2명 이상 ${s.multiChild}명`} />
              <Stat label="기록 1번 이상" value={s.withLogs} sub={`가입자의 ${pct(s.withLogs, s.users)}`} />
              <Stat label="최근 7일 기록" value={s.activeThisWeek} sub="이번 주 실제 사용자" />
              <Stat label="2주 잔존율" value={pct(s.retained, s.retentionEligible)} accent="#DB2777"
                sub={`가입 14일 지난 ${s.retentionEligible}명 중 ${s.retained}명`} />
              <Stat label="받은 의견" value={s.feedback} />
            </div>

            <div style={{ background: "rgba(255,255,255,0.88)", borderRadius: 18, overflowX: "auto", border: "1px solid rgba(255,255,255,0.95)" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={th}>사용자</th><th style={th}>가입일</th><th style={th}>유입</th>
                    <th style={th}>아이</th><th style={th}>기록</th><th style={th}>마지막 기록</th>
                    <th style={th}>2주 잔존</th><th style={th}>의견</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map(r => {
                    const ago = daysAgo(r.lastLogAt);
                    return (
                      <tr key={r.uid}>
                        <td style={td}>{r.name || r.email || r.uid.slice(0, 8)}{!r.onboarded && <span style={{ color: "#9a8bbd" }}> · 온보딩 전</span>}</td>
                        <td style={td}>{fmtDate(r.signedUpAt)}</td>
                        <td style={td}>{r.source}</td>
                        <td style={td}>{r.children}</td>
                        <td style={td}>{r.logs}</td>
                        <td style={td}>{r.lastLogAt ? `${fmtDate(r.lastLogAt)} (${ago}일 전)` : "–"}</td>
                        <td style={td}>{r.retained === null ? <span style={{ color: "#9a8bbd" }}>아직</span> : r.retained ? "✅" : "❌"}</td>
                        <td style={td}>{r.feedback || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.rows.length === 0 && <div style={{ padding: 20, color: "#7a6a9e", fontSize: 14 }}>아직 가입자가 없어요.</div>}
            </div>
            <div style={{ fontSize: 12, color: "#9a8bbd", marginTop: 10 }}>
              2주 잔존 = 가입하고 14일이 지난 뒤에도 기록을 남긴 사람. 업데이트 {fmtDate(data.generatedAt)} {new Date(data.generatedAt).toLocaleTimeString("ko-KR")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
