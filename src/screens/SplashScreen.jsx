import { useState, useEffect } from "react";

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("blank");
  // blank → logoIn → logoBurst → split → done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("logoIn"), 400);
    const t2 = setTimeout(() => setPhase("logoBurst"), 1500);
    const t3 = setTimeout(() => setPhase("split"), 1900);
    const t4 = setTimeout(() => onDone(), 2600);
    return () => [t1,t2,t3,t4].forEach(clearTimeout);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#06090f", zIndex: 50 }}>
      {/* Top half */}
      <div className={phase === "split" ? "slide-up" : ""} style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "50%",
        background: "#06090f",
      }} />
      {/* Bottom half */}
      <div className={phase === "split" ? "slide-down" : ""} style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
        background: "#06090f",
      }} />
      {/* Logo */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10,
      }}>
        {(phase === "logoIn" || phase === "logoBurst") && (
          <div
            className={phase === "logoIn" ? "logo-in" : "logo-burst"}
            style={{
              width: 96, height: 96, borderRadius: 26,
              background: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 48,
              boxShadow: "0 0 80px rgba(255,107,107,0.6), 0 0 160px rgba(255,230,109,0.2)",
            }}
          >⚖️</div>
        )}
      </div>
    </div>
  );
}
