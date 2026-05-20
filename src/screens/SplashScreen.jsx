import { useState, useEffect } from "react";
import { Scales } from "@phosphor-icons/react";

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(false);
  const [zooming, setZooming] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 50);
    const t1 = setTimeout(() => setZooming(true), 850);
    const t2 = setTimeout(() => onDone(), 1700);
    return () => [t0, t1, t2].forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(160deg, #f8f0ff 0%, #eef2ff 50%, #fdf4ff 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
      opacity: zooming ? 0 : 1,
      transition: zooming ? "opacity 0.45s ease 0.3s" : "none",
    }}>
      {/* depth orbs behind the icon */}
      <div style={{
        position: "absolute",
        width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)",
        filter: "blur(40px)",
        transform: "translate(-40px, -40px)",
      }} />
      <div style={{
        position: "absolute",
        width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)",
        filter: "blur(36px)",
        transform: "translate(50px, 50px)",
      }} />

      {/* glass icon */}
      <div style={{
        width: 120, height: 120, borderRadius: 34,
        background: "rgba(255,255,255,0.22)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: [
          "0 24px 64px rgba(139,92,246,0.18)",
          "0 8px 24px rgba(139,92,246,0.12)",
          "inset 0 1px 0 rgba(255,255,255,0.9)",
          "inset 0 -1px 0 rgba(139,92,246,0.08)",
        ].join(", "),
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: visible ? 1 : 0,
        transform: zooming ? "scale(60)" : visible ? "scale(1)" : "scale(0.7)",
        transition: zooming
          ? "transform 0.75s cubic-bezier(0.4, 0, 1, 1)"
          : "opacity 0.4s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        willChange: "transform",
        position: "relative",
      }}>
        <Scales size={60} weight="duotone" color="#7C3AED" />
      </div>
    </div>
  );
}
