import { createContext, useContext, useState, useEffect } from "react";
import en from "../languages/en";
import ko from "../languages/ko";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("fairfamily_lang") || "en");

  useEffect(() => {
    if (localStorage.getItem("fairfamily_lang")) return; // already set, skip fetch

    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        const detected = data.country_code === "KR" ? "ko" : "en";
        setLang(detected);
        localStorage.setItem("fairfamily_lang", detected);
      })
      .catch(() => {});
  }, []);

  const toggle = () => {
    const next = (lang || "en") === "ko" ? "en" : "ko";
    setLang(next);
    localStorage.setItem("fairfamily_lang", next);
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
