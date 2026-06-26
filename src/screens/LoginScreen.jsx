import { useState } from "react";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { auth, db, googleProvider } from "../firebase";
import { useLanguage } from "../hooks/useLanguage";
import { Scales } from "@phosphor-icons/react";

const BG = "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)";

const saveUserToFirestore = async (user) => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid, email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      onboardingComplete: false,
    });
  }
};

export default function LoginScreen() {
  const { t, titleFont } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      let result;
      if (Capacitor.isNativePlatform()) {
        // Native app (Android/iOS): popups don't work in the WebView, so use the
        // native Google Sign-In, then sign into the Firebase JS SDK with the credential.
        const res = await FirebaseAuthentication.signInWithGoogle();
        const idToken = res.credential?.idToken;
        if (!idToken) throw new Error("no-id-token");
        const credential = GoogleAuthProvider.credential(idToken);
        result = await signInWithCredential(auth, credential);
      } else {
        // Web: popup flow.
        result = await signInWithPopup(auth, googleProvider);
      }
      await saveUserToFirestore(result.user);
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      const canceled = e.code === "auth/popup-closed-by-user" || msg.includes("cancel");
      if (!canceled)
        setError(e.code === "auth/popup-blocked" ? t.login.popupBlocked : t.login.googleFailed);
    } finally { setLoading(false); }
  };

  const handleEmail = async () => {
    if (!email.trim() || !password) return;
    setError(""); setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(result.user);
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          await saveUserToFirestore(result.user);
        } catch (ce) {
          setError(ce.code === "auth/weak-password" ? t.login.weakPassword : t.login.createFailed);
        }
      } else if (e.code === "auth/wrong-password") setError(t.login.wrongPassword);
      else if (e.code === "auth/invalid-email") setError(t.login.invalidEmail);
      else setError(t.login.signInFailed);
    } finally { setLoading(false); }
  };

  const glassBtn = {
    width: "100%", padding: "17px 20px",
    borderRadius: 18, border: "1px solid rgba(255,255,255,0.95)",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px)",
    color: "#1e0f3c", fontSize: 16, fontWeight: 500,
    cursor: "pointer", marginBottom: 12,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
    boxShadow: "0 4px 20px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,1)",
  };

  const inputStyle = {
    width: "100%", padding: "16px 18px",
    borderRadius: 16, border: "1px solid rgba(255,255,255,0.95)",
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(16px)",
    color: "#1e0f3c", fontSize: 16, outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 12, boxSizing: "border-box",
    transition: "border-color 0.2s",
    boxShadow: "0 2px 10px rgba(139,92,246,0.06)",
  };

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 28px",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative", overflow: "hidden", zIndex: 1,
    }}>
      <style>{`
        @keyframes vibrate {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-2px); }
          75%       { transform: translateX(2px); }
        }
        .tagline-vibrate {
          animation: vibrate 0.08s linear 50;
          display: inline-block;
        }
      `}</style>
      {/* Logo */}
      <div style={{ animation: "fadeUp 0.7s ease both", textAlign: "center", marginBottom: 52 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 28,
          background: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 16px 48px rgba(139,92,246,0.18), 0 4px 16px rgba(139,92,246,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          animation: "float 4s ease-in-out infinite",
        }}>
          <Scales size={44} weight="duotone" color="#7C3AED" />
        </div>

        <h1 style={{
          fontFamily: titleFont,
          fontSize: 42, fontWeight: 400, lineHeight: 1, letterSpacing: 0,
          marginBottom: 40, color: "#1e0f3c",
          textShadow: "0 4px 18px rgba(30,15,60,0.18), 0 2px 6px rgba(0,0,0,0.10)",
          animation: "titleShake 0.45s ease 2",
          display: "block",
        }}>FairFamily</h1>
        <p className="tagline-vibrate" style={{ color: "#6b5a9e", fontWeight: 700, fontSize: 17, letterSpacing: 0.2, lineHeight: 1.5 }}>
          {t.login.tagline}
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 360, animation: "fadeUp 0.7s 0.2s ease both", opacity: 0 }}>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} style={{ ...glassBtn, opacity: loading ? 0.6 : 1 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.95)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.75)"; }}>
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t.login.google}
        </button>

        {/* Apple */}
        <button onClick={() => setError("Apple sign-in coming soon.")} disabled={loading} style={{ ...glassBtn, opacity: loading ? 0.6 : 1 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.95)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.75)"; }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#1e0f3c">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {t.login.apple}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(139,92,246,0.12)" }} />
          <span style={{ color: "#6b5a9e", fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(139,92,246,0.12)" }} />
        </div>

        {showEmail ? (
          <div style={{ animation: "fadeUp 0.3s ease both" }}>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder} type="email" style={inputStyle} />
            <input value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmail()}
              placeholder={t.login.passwordPlaceholder} type="password" style={inputStyle} />
            <button onClick={handleEmail} disabled={loading} style={{
              width: "100%", padding: "17px", borderRadius: 18, border: "none",
              background: loading ? "rgba(139,92,246,0.08)" : "linear-gradient(135deg, #7C3AED, #EC4899)",
              color: loading ? "#c4b8e0" : "#fff",
              fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: loading ? "none" : "0 6px 24px rgba(124,58,237,0.35)",
            }}>
              {loading ? t.login.signing : t.login.submit}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowEmail(true)} style={{
            width: "100%", padding: "17px 20px",
            borderRadius: 18, border: "1px solid rgba(139,92,246,0.15)",
            background: "rgba(255,255,255,0.5)",
            color: "#6b5a9e", fontSize: 16, fontWeight: 400,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "#6b5b9e"}
            onMouseLeave={e => e.currentTarget.style.color = "#6b5a9e"}>
            {t.login.email}
          </button>
        )}

        {error && (
          <div style={{
            marginTop: 14, padding: "12px 16px",
            background: "rgba(236,72,153,0.08)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(236,72,153,0.22)",
            borderRadius: 14, color: "#9d174d", fontSize: 14, textAlign: "center",
          }}>
            {error}
          </div>
        )}

        <p style={{
          textAlign: "center", color: "#6b5a9e",
          fontSize: 13, marginTop: 28, lineHeight: 1.7, whiteSpace: "pre-line",
        }}>
          {t.login.terms}
        </p>
      </div>
    </div>
  );
}
