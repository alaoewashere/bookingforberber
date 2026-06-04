import type { Metadata } from "next";
import { Audiowide, Cairo } from "next/font/google";
import Link from "next/link";
import { ar } from "@/lib/i18n/ar";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
});

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-y2k-display",
});

export const metadata: Metadata = {
  title: ar.meta.title,
  description: ar.meta.description,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} ${audiowide.variable}`}>
        <header className="y2k-header y2k-shell">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4">
            <Link href="/" className="y2k-logo">
              <span className="y2k-logo-latin">BARBER BOOKING</span>
              <span className="y2k-logo-ar">✂ حُذيفة</span>
            </Link>
            <nav className="flex shrink-0 gap-1 sm:gap-2">
              <Link href="/" className="y2k-nav-link">
                {ar.nav.home}
              </Link>
              <Link href="/admin" className="y2k-nav-link">
                {ar.nav.admin}
              </Link>
            </nav>
          </div>
        </header>
        <main className="y2k-shell mx-auto w-full max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
