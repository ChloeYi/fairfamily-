import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { LanguageProvider, useLanguage } from "./hooks/useLanguage";
import { seedMarketingData } from "./seedMarketingData";
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import DashboardScreen from "./screens/DashboardScreen";
import KidsScreen from "./screens/KidsScreen";
import ChildRoomScreen from "./screens/ChildRoomScreen";
import PhotoLogScreen from "./screens/PhotoLogScreen";
import AIAdviceScreen from "./screens/AIAdviceScreen";
import ChatOnboardingScreen from "./screens/ChatOnboardingScreen";
import EmotionalOnboardingScreen from "./screens/EmotionalOnboardingScreen";
import Welcome3Screen from "./screens/Welcome3Screen";
import FAQBot from "./components/FAQBot";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

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
  @keyframes titleShake {
    0%,100% { transform: translateX(0); }
    15%     { transform: translateX(-7px) rotate(-1deg); }
    30%     { transform: translateX(7px) rotate(1deg); }
    45%     { transform: translateX(-5px); }
    60%     { transform: translateX(5px); }
    75%     { transform: translateX(-2px); }
    90%     { transform: translateX(2px); }
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
  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(30px, -20px) scale(1.05); }
    66%       { transform: translate(-20px, 15px) scale(0.97); }
  }
  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40%       { transform: translate(-25px, 20px) scale(1.08); }
    70%       { transform: translate(15px, -10px) scale(0.95); }
  }

  .logo-in    { animation: logoIn 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .logo-burst { animation: logoBurst 0.45s cubic-bezier(0.55,0,1,0.45) forwards; }
  .slide-up   { animation: slideUp 0.65s cubic-bezier(0.76,0,0.24,1) forwards; }
  .slide-down { animation: slideDown 0.65s cubic-bezier(0.76,0,0.24,1) forwards; }

  .shimmer {
    background: linear-gradient(90deg, #7C3AED, #EC4899, #06B6D4, #8B5CF6, #7C3AED);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 5s linear infinite;
  }

  .orb-1 {
    position: fixed; width: 560px; height: 560px; border-radius: 50%;
    top: -200px; right: -160px; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(168,85,247,0.42) 0%, rgba(139,92,246,0.18) 50%, transparent 70%);
    filter: blur(50px);
    animation: orbFloat1 18s ease-in-out infinite;
  }
  .orb-2 {
    position: fixed; width: 500px; height: 500px; border-radius: 50%;
    bottom: -160px; left: -130px; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(236,72,153,0.32) 0%, rgba(219,39,119,0.14) 50%, transparent 70%);
    filter: blur(60px);
    animation: orbFloat2 22s ease-in-out infinite;
  }
  .orb-3 {
    position: fixed; width: 340px; height: 340px; border-radius: 50%;
    top: 42%; left: 52%; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(99,102,241,0.24) 0%, transparent 70%);
    filter: blur(48px);
    animation: orbFloat1 26s ease-in-out infinite reverse;
  }
`;

function NavIcon({ tab, active }) {
  const color = active ? tab.activeColor : "#8b7fc0";
  const size = 26;

  if (tab.id === "dashboard") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="2.5" fill={color}/>
      <rect x="13" y="3" width="8" height="8" rx="2.5" fill={color} opacity="0.6"/>
      <rect x="3" y="13" width="8" height="8" rx="2.5" fill={color} opacity="0.6"/>
      <rect x="13" y="13" width="8" height="8" rx="2.5" fill={color}/>
    </svg>
  );

  if (tab.id === "kids") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="8.5" cy="7" r="3" fill={color}/>
      <path d="M2 20v-1a6.5 6.5 0 0113 0v1" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="9" r="2.2" fill={color} opacity="0.65"/>
      <path d="M21.5 20v-1a4 4 0 00-3.5-3.97" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
    </svg>
  );

  if (tab.id === "log") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="3" stroke={color} strokeWidth="2"/>
      <circle cx="12" cy="14" r="3.5" fill={color}/>
      <path d="M8.5 7l1.3-3h4.4l1.3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18.5" cy="10" r="1" fill={color}/>
    </svg>
  );

  if (tab.id === "ai") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.2 6.6L21 10l-6.8 2-2.2 6.6L9.8 12 3 10l6.8-2L12 2z" fill={color}/>
      <path d="M19.5 15.5l1 3 2 .5-2 1-1 2.5-1-2-2-1 2-.5 1-3.5z" fill={color} opacity="0.55"/>
    </svg>
  );

  return null;
}

function LangToggle() {
  const { t, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      style={{
        position: "fixed", top: 18, right: 18, zIndex: 200,
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(255,255,255,0.95)",
        borderRadius: 12, padding: "7px 12px",
        color: "#5b4899", fontSize: 13, cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 16px rgba(139,92,246,0.15)",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.9)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.72)"}
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
    { id: "dashboard", path: "/dashboard", label: t.nav.dashboard, activeColor: "#7C3AED" },
    { id: "kids",      path: "/kids",      label: t.nav.kids,      activeColor: "#EC4899" },
    { id: "log",       path: "/photo-log", label: t.nav.log,       activeColor: "#EA580C" },
    { id: "ai",        path: "/ai-advice", label: t.nav.aiTips,    activeColor: "#8B5CF6" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(28px)",
      WebkitBackdropFilter: "blur(28px)",
      borderTop: "1px solid rgba(255,255,255,0.95)",
      boxShadow: "0 -4px 28px rgba(139,92,246,0.1)",
      display: "flex", padding: "10px 0 18px",
      zIndex: 50,
    }}>
      {tabs.map(tab => {
        const active = pathname === tab.path;
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            flex: 1, padding: "6px 4px 8px",
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            transition: "all 0.25s",
          }}>
            <NavIcon tab={tab} active={active} />
            <span style={{
              fontSize: 11, fontWeight: active ? 700 : 600, letterSpacing: 0.2,
              color: active ? tab.activeColor : "#6b5f9e",
              fontFamily: "'DM Sans', sans-serif",
              transition: "color 0.25s",
            }}>{tab.label}</span>
            {active && (
              <div style={{
                width: 20, height: 2.5, borderRadius: 2,
                background: `linear-gradient(90deg, ${tab.activeColor}88, ${tab.activeColor})`,
                marginTop: -2,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("marketingDataSeeded")) {
      seedMarketingData().then(() => localStorage.setItem("marketingDataSeeded", "true"));
    }
  }, []);
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

  // Show splash screen first on every fresh load
  if (!splashDone) {
    return (
      <LanguageProvider>
        <style>{css}</style>
        <SplashScreen onDone={() => setSplashDone(true)} />
      </LanguageProvider>
    );
  }

  // Show spinner while Firebase resolves auth
  if (authLoading) {
    return (
      <LanguageProvider>
        <style>{css}</style>
        <div style={{
          position: "fixed", inset: 0,
          background: "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "2px solid rgba(139,92,246,0.15)",
            borderTopColor: "#7C3AED",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <style>{css}</style>
        <div className="orb-1" />
        <div className="orb-2" />
        <div className="orb-3" />
        <LangToggle />
        <FAQBot />
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />} />

          <Route path="/welcome" element={
            user && onboardingDone ? <Navigate to="/dashboard" replace />
            : user && !onboardingDone ? <Navigate to="/onboarding" replace />
            : <ChatOnboardingScreen />
          } />

          <Route path="/welcome2" element={
            user && onboardingDone ? <Navigate to="/dashboard" replace />
            : <EmotionalOnboardingScreen />
          } />

          <Route path="/welcome3" element={
            user && onboardingDone ? <Navigate to="/dashboard" replace />
            : <Welcome3Screen />
          } />

          <Route path="/login" element={
            user && onboardingDone ? <Navigate to="/dashboard" replace />
            : user && !onboardingDone ? <Navigate to="/onboarding" replace />
            : <LoginScreen />
          } />
          <Route path="/onboarding" element={
            !user ? <Navigate to="/login" replace />
            : onboardingDone ? <Navigate to="/dashboard" replace />
            : <OnboardingScreen onDone={handleOnboardingDone} />
          } />

          <Route path="/dashboard" element={
            !user ? <Navigate to="/login" replace />
            : !onboardingDone ? <Navigate to="/onboarding" replace />
            : <><DashboardScreen /><BottomNav /></>
          } />
          <Route path="/kids" element={
            !user ? <Navigate to="/login" replace />
            : <><KidsScreen /><BottomNav /></>
          } />
          <Route path="/child/:id" element={
            !user ? <Navigate to="/login" replace />
            : <ChildRoomScreen />
          } />
          <Route path="/photo-log" element={
            !user ? <Navigate to="/login" replace />
            : <><PhotoLogScreen /><BottomNav /></>
          } />
          <Route path="/ai-advice" element={
            !user ? <Navigate to="/login" replace />
            : <><AIAdviceScreen /><BottomNav /></>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
