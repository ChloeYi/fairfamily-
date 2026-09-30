import { createContext, useContext, useState } from "react";
import en from "../languages/en";
import ko from "../languages/ko";

const LanguageContext = createContext(null);

// An explicit tap on the language toggle is remembered in "lang_choice" (shared
// with the website at /, same origin). Otherwise follow the device language.
const CHOICE_KEY = "lang_choice";

function savedChoice() {
  try {
    const c = localStorage.getItem(CHOICE_KEY);
    return c === "ko" || c === "en" ? c : null;
  } catch { return null; }
}

function deviceLang() {
  const l = ((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
  return l.startsWith("ko") ? "ko" : "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => savedChoice() || deviceLang());

  const toggle = () => {
    const next = (lang || "en") === "ko" ? "en" : "ko";
    setLang(next);
    try { localStorage.setItem(CHOICE_KEY, next); } catch {}
  };

  const t = lang === "ko" ? ko : en;

  // Korean titles use Bagel Fat One; English keeps the original display font.
  const titleFont = lang === "ko"
    ? "'Bagel Fat One', sans-serif"
    : "'Climate Crisis', sans-serif";

  return (
    <LanguageContext.Provider value={{ t, lang, toggle, titleFont }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
