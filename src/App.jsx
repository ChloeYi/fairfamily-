import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { LanguageProvider, useLanguage } from "./hooks/useLanguage";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import DashboardScreen from "./screens/DashboardScreen";
import KidsScreen from "./screens/KidsScreen";
import ChildRoomScreen from "./screens/ChildRoomScreen";
import PhotoLogScreen from "./screens/PhotoLogScreen";
import AIAdviceScreen from "./screens/AIAdviceScreen";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  @keyframes logoIn {
    0%   { transform: scale(0.2); opacity: 0; }
    60%  { transform: scale(1.15); opacity: 1; }
    80%  { transform: scale(0.92); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes logoBurst {
    0%   { transform: scale(1); opacity: 1; }
    100% { transform: scale(20); opacity: 0; }
  }
  @keyframes slideUp {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-100%); }
  }
  @keyframes slideDown {
    0%   { transform: translateY(0); }
    100% { transform: translateY(100%); }
  }
  @keyframes fadeUp {
    0%   { opacity: 0; transform: translateY(24px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes gentlePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,107,0.3); }
    50%       { box-shadow: 0 0 0 12px rgba(255,107,107,0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes grain {
    0%, 100% { transform: translate(0, 0); }
    10%       { transform: translate(-2%, -3%); }
    30%       { transform: translate(3%, 2%); }
    50%       { transform: translate(-1%, 4%); }
    70%       { transform: translate(4%, -1%); }
    90%       { transform: translate(-3%, 1%); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .logo-in    { animation: logoIn 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .logo-burst { animation: logoBurst 0.45s cubic-bezier(0.55,0,1,0.45) forwards; }
  .slide-up   { animation: slideUp 0.65s cubic-bezier(0.76,0,0.24,1) forwards; }
  .slide-down { animation: slideDown 0.65s cubic-bezier(0.76,0,0.24,1) forwards; }

  .shimmer {
    background: linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #FF6B6B);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  .grain-overlay {
    position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    animation: grain 0.5s steps(1) infinite;
  }
`;

function LangToggle() {
  const { t, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      style={{
        position: "fixed", top: 16, right: 16, zIndex: 200,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: "6px 10px",
        color: "#aabbcc", fontSize: 13, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        backdropFilter: "blur(10px)",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
    >
      {t.lang.flag} {t.lang.code}
    </button>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();

  const tabs = [
    { path: "/dashboard", icon: "📊", label: t.nav.dashboard },
    { path: "/kids",      icon: "👶", label: t.nav.kids },
    { path: "/photo-log", icon: "📸", label: t.nav.log },
    { path: "/ai-advice", icon: "🤖", label: t.nav.aiTips },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(6,9,15,0.96)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      display: "flex", padding: "8px 0 16px",
      zIndex: 50,
    }}>
      {tabs.map(tab => (
        <button key={tab.path} onClick={() => navigate(tab.path)} style={{
          flex: 1, padding: "8px 4px 10px",
          background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          transition: "all 0.2s",
        }}>
          <span style={{ fontSize: 22 }}>{tab.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: 500,
            color: pathname === tab.path ? "#4ECDC4" : "#334455",
            transition: "color 0.2s",
          }}>{tab.label}</span>
          {pathname === tab.path && (
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ECDC4", marginTop: 2 }} />
          )}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setOnboardingDone(snap.exists() && snap.data().onboardingComplete === true);
        setUser(firebaseUser);
      } else {
        setUser(null);
        setOnboardingDone(false);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleOnboardingDone = async () => {
    if (user) {
      await updateDoc(doc(db, "users", user.uid), { onboardingComplete: true });
    }
    setOnboardingDone(true);
  };

  const renderContent = () => {
    if (!splashDone) return null;
    if (authLoading) return (
      <div style={{
        position: "fixed", inset: 0, background: "#06090f",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.1)",
          borderTopColor: "#4ECDC4",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
    if (!user) return <LoginScreen />;
    if (!onboardingDone) return <OnboardingScreen onDone={handleOnboardingDone} />;
    return (
      <>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/kids" element={<KidsScreen />} />
          <Route path="/child/:id" element={<ChildRoomScreen />} />
          <Route path="/photo-log" element={<PhotoLogScreen />} />
          <Route path="/ai-advice" element={<AIAdviceScreen />} />
        </Routes>
        <BottomNav />
      </>
    );
  };

  return (
    <LanguageProvider>
      <BrowserRouter>
        <style>{css}</style>
        <div className="grain-overlay" />
        <LangToggle />
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        {renderContent()}
      </BrowserRouter>
    </LanguageProvider>
  );
}
