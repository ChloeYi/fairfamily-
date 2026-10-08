import { useState } from "react";

// Illustrated avatar per child, keyed by the child's existing `emoji` slot
// (so every existing child gets one without a data migration).
// Falls back to the old Flaticon glyph if the image is missing.
export const AVATAR_KEYS = ["🌸", "⚡", "🌻", "🦋", "🌈", "⭐", "🎯", "🔥"];

const FILES = {
  "🌸": "avatar-1", "⚡": "avatar-2", "🌻": "avatar-3", "🦋": "avatar-4",
  "🌈": "avatar-5", "⭐": "avatar-6", "🎯": "avatar-7", "🔥": "avatar-8",
};

const GLYPHS = {
  "🌸": "fi-sr-child-head", "⚡": "fi-sr-child", "🌻": "fi-sr-baby", "🦋": "fi-sr-user-crown",
  "🌈": "fi-sr-face-smile-hearts", "⭐": "fi-sr-face-awesome", "🎯": "fi-sr-face-glasses", "🔥": "fi-sr-face-smile-halo",
};

export const avatarSrc = (emoji) =>
  `${process.env.PUBLIC_URL || ""}/img/avatars/${FILES[emoji] || "avatar-1"}.webp`;

export default function KidAvatar({ emoji, size = 48, color = "#7C3AED", ring = true, style }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <i className={`fi ${GLYPHS[emoji] || "fi-sr-child-head"}`} style={{ fontSize: size * 0.5, color, ...style }} />;
  }
  return (
    <img
      src={avatarSrc(emoji)}
      alt=""
      width={size}
      height={size}
      onError={() => setBroken(true)}
      style={{
        width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block",
        boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${color}55` : undefined,
        ...style,
      }}
    />
  );
}
