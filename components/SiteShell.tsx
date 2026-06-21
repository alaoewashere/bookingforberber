"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import LangPicker from "@/components/LangPicker";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, showPicker } = useLang();

  return (
    <>
      {showPicker && <LangPicker onSelect={setLang} />}

      <header className="m-header m-shell">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="m-logo-ar">✂ {lang === "ar" ? "حُذيفة" : "Huzayfa"}</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1">
            <Link href="/" className="m-nav-link">{t.nav.home}</Link>
            <Link href="/admin" className="m-nav-link">{t.nav.admin}</Link>
            <button
              type="button"
              onClick={() => setLang(lang === "ar" ? "tr" : lang === "tr" ? "en" : "ar")}
              className="m-nav-link"
              style={{ fontSize: "0.7rem", opacity: 0.65, letterSpacing: "0.05em" }}
            >
              {lang === "ar" ? "TR" : lang === "tr" ? "EN" : "AR"}
            </button>
          </nav>
        </div>
      </header>

      <main className="m-shell mx-auto w-full max-w-4xl px-3 py-6 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="m-shell border-t border-[var(--m-border)] mt-8">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 text-center">
          <p style={{ fontFamily: "var(--font-thmanyah)", fontWeight: 300, fontSize: "0.75rem", color: "var(--m-muted)" }}>
            {t.footer.support}{" "}
            <a href="tel:+905534898399" dir="ltr" style={{ color: "var(--m-brown-light)", whiteSpace: "nowrap" }}>
              +90 553 489 8399
            </a>
          </p>
          <p dir="ltr" style={{ fontFamily: "var(--font-thmanyah)", fontWeight: 300, fontSize: "0.7rem", color: "var(--m-muted)", marginTop: "0.4rem", opacity: 0.7 }}>
            developed by{" "}
            <a href="https://www.instagram.com/_9pd_/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--m-brown-light)" }}>
              @_9pd_
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
