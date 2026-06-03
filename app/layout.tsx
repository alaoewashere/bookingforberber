import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Link from "next/link";
import { ar } from "@/lib/i18n/ar";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: ar.meta.title,
  description: ar.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <header className="sticky top-0 z-40 border-b border-barber-border bg-barber-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-barber-gold"
            >
              ✂ حُذيفة
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/"
                className="text-gray-300 transition hover:text-barber-gold"
              >
                {ar.nav.home}
              </Link>
              <Link
                href="/admin"
                className="text-gray-300 transition hover:text-barber-gold"
              >
                {ar.nav.admin}
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
