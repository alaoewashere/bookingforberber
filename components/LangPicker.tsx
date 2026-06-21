"use client";

import type { Lang } from "@/lib/lang-context";

const OPTIONS: { lang: Lang; label: string; sub: string; icon: string }[] = [
  { lang: "ar", label: "العربية", sub: "Arabic",  icon: "ع" },
  { lang: "tr", label: "Türkçe",  sub: "Turkish", icon: "T" },
  { lang: "en", label: "English", sub: "English", icon: "E" },
];

export default function LangPicker({ onSelect }: { onSelect: (l: Lang) => void }) {
  const btnBase: React.CSSProperties = {
    fontFamily: "var(--font-thmanyah)",
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "var(--m-cream)",
    background: "var(--m-elevated2)",
    border: "1px solid var(--m-border)",
    borderRadius: "14px",
    padding: "1.2rem 1.6rem",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    minWidth: "100px",
    transition: "border-color 0.15s, background 0.15s",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--m-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2.5rem",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--font-thmanyah)",
          fontWeight: 300,
          fontSize: "0.75rem",
          color: "var(--m-muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "0.75rem",
        }}>
          Barber Booking — ✂ Huzayfa
        </p>
        <h1 style={{
          fontFamily: "var(--font-thmanyah)",
          fontWeight: 700,
          fontSize: "clamp(1.2rem, 5vw, 1.7rem)",
          color: "var(--m-cream)",
          lineHeight: 1.4,
        }}>
          اختر اللغة
          <br />
          <span style={{ fontWeight: 300, fontSize: "0.75em", color: "var(--m-muted)" }}>
            Dil Seçin / Choose Language
          </span>
        </h1>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", padding: "0 1rem" }}>
        {OPTIONS.map(({ lang, label, sub, icon }) => (
          <button
            key={lang}
            type="button"
            onClick={() => onSelect(lang)}
            style={btnBase}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--m-brown-light)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--m-elevated)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--m-border)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--m-elevated2)";
            }}
          >
            <span style={{ fontSize: "1.8rem", lineHeight: 1, fontFamily: "serif" }}>{icon}</span>
            <span>{label}</span>
            <span style={{ fontWeight: 300, fontSize: "0.72rem", color: "var(--m-muted)" }}>{sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
