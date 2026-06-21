"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { arT, trT, enT, type CustomerT } from "@/lib/i18n/translations";

export type Lang = "ar" | "tr" | "en";

const TRANSLATIONS: Record<Lang, CustomerT> = { ar: arT, tr: trT, en: enT };

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: CustomerT;
  showPicker: boolean;
}

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "ar" || saved === "tr" || saved === "en") {
      setLangState(saved);
    } else {
      setShowPicker(true);
    }
  }, []);

  useEffect(() => {
    const { dir } = TRANSLATIONS[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  function setLang(l: Lang) {
    localStorage.setItem("lang", l);
    setLangState(l);
    setShowPicker(false);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang], showPicker }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be inside LangProvider");
  return ctx;
}
