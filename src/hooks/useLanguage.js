import { createContext, useContext, useState, useEffect } from "react";
import en from "../languages/en";
import ko from "../languages/ko";

const LanguageContext = createContext(null);

// The marketing site (same origin, at /) keeps its choice in "ff_lang" as "kr"/"en".
function savedLang() {
  const app = localStorage.getItem("fairfamily_lang");
  if (app === "ko" || app === "en") return app;
  const site = localStorage.getItem("ff_lang");
  if (site === "kr") return "ko";
  if (site === "en") return "en";
  return null;
}

function saveLang(l) {
  localStorage.setItem("fairfamily_lang", l);
  localStorage.setItem("ff_lang", l === "ko" ? "kr" : "en");
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => savedLang() || "en");

  useEffect(() => {
    if (savedLang()) return; // already chosen here or on the website, skip fetch

    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        const detected = data.country_code === "KR" ? "ko" : "en";
        setLang(detected);
        saveLang(detected);
      })
      .catch(() => {});
  }, []);

  const toggle = () => {
    const next = (lang || "en") === "ko" ? "en" : "ko";
    setLang(next);
    saveLang(next);
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
