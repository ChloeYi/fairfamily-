import { createContext, useContext, useState, useEffect } from "react";
import en from "../languages/en";
import ko from "../languages/ko";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("fairfamily_lang") || null);

  useEffect(() => {
    if (lang) return; // already set from localStorage

    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        const detected = data.country_code === "KR" ? "ko" : "en";
        setLang(detected);
        localStorage.setItem("fairfamily_lang", detected);
      })
      .catch(() => setLang("en"));
  }, [lang]);

  const toggle = () => {
    const next = (lang || "en") === "ko" ? "en" : "ko";
    setLang(next);
    localStorage.setItem("fairfamily_lang", next);
  };

  const resolved = lang || "en";
  const t = resolved === "ko" ? ko : en;

  return (
    <LanguageContext.Provider value={{ t, lang: resolved, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
