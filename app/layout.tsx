import type { Metadata } from "next";
import { LangProvider } from "@/lib/lang-context";
import SiteShell from "@/components/SiteShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "حجز مواعيد الحلاقة",
  description: "احجز موعدك بسهولة",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <LangProvider>
          <SiteShell>{children}</SiteShell>
        </LangProvider>
      </body>
    </html>
  );
}
