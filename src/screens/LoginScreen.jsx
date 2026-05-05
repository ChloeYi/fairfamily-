import { useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";

const saveUserToFirestore = async (user) => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      onboardingComplete: false,
    });
  }
};

export default function LoginScreen() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user);
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") {
        setError(e.code === "auth/popup-blocked"
          ? t.login.popupBlocked
          : t.login.googleFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(result.user);
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          await saveUserToFirestore(result.user);
        } catch (createErr) {
          setError(createErr.code === "auth/weak-password"
            ? t.login.weakPassword
            : t.login.createFailed);
        }
      } else if (e.code === "auth/wrong-password") {
        setError(t.login.wrongPassword);
      } else if (e.code === "auth/invalid-email") {
        setError(t.login.invalidEmail);
      } else {
        setError(t.login.signInFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 50%, #0f1e35 0%, #06090f 60%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 28px",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", width: 400, height: 400,
        borderRadius: "50%", top: -100, right: -150,
        background: "radial-gradient(circle, rgba(255,107,107,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300,
        borderRadius: "50%", bottom: -80, left: -100,
        background: "radial-gradient(circle, rgba(78,205,196,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ animation: "fadeUp 0.7s ease both", textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto 16px",
          boxShadow: "0 8px 32px rgba(255,107,107,0.3)",
          animation: "float 4s ease-in-out infinite",
        }}>⚖️</div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 36, fontWeight: 700, lineHeight: 1,
          marginBottom: 8,
        }}>
          <span className="shimmer">FairFamily</span>
        </h1>
        <p style={{ color: "#445566", fontSize: 14, letterSpacing: 0.3 }}>
          {t.login.tagline}
        </p>
      </div>

      <div style={{
        width: "100%", maxWidth: 340,
        animation: "fadeUp 0.7s 0.2s ease both", opacity: 0,
      }}>
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: "100%", padding: "15px 20px",
            borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#e8f0f8", fontSize: 15, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", marginBottom: 12,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s",
            backdropFilter: "blur(10px)",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t.login.google}
        </button>

        <button
          onClick={() => setError("Apple sign-in coming soon.")}
          disabled={loading}
          style={{
            width: "100%", padding: "15px 20px",
            borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#e8f0f8", fontSize: 15, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer", marginBottom: 12,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s",
            backdropFilter: "blur(10px)",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {t.login.apple}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span style={{ color: "#334455", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        {showEmail ? (
          <div>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              type="email"
              style={{
                width: "100%", padding: "14px 16px",
                borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#e8f0f8", fontSize: 15, outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: 10, boxSizing: "border-box",
              }}
            />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmail()}
              placeholder={t.login.passwordPlaceholder}
              type="password"
              style={{
                width: "100%", padding: "14px 16px",
                borderRadius: 14, border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#e8f0f8", fontSize: 15, outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: 10, boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleEmail}
              disabled={loading}
              style={{
                width: "100%", padding: "15px",
                borderRadius: 16, border: "none",
                background: loading
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #FF6B6B, #FFE66D)",
                color: loading ? "#667788" : "#000",
                fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                animation: loading ? "none" : "gentlePulse 2s ease infinite",
              }}>
              {loading ? t.login.signing : t.login.submit}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowEmail(true)}
            style={{
              width: "100%", padding: "15px 20px",
              borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "#667788", fontSize: 15, fontWeight: 400,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#aabbcc"}
            onMouseLeave={e => e.currentTarget.style.color = "#667788"}
          >
            {t.login.email}
          </button>
        )}

        {error && (
          <div style={{
            marginTop: 12, padding: "10px 14px",
            background: "rgba(255,107,107,0.1)",
            border: "1px solid rgba(255,107,107,0.25)",
            borderRadius: 10,
            color: "#FF6B6B", fontSize: 13, textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <p style={{
          textAlign: "center", color: "#2a3a4a",
          fontSize: 11, marginTop: 24, lineHeight: 1.6,
          whiteSpace: "pre-line",
        }}>
          {t.login.terms}
        </p>
      </div>
    </div>
  );
}
