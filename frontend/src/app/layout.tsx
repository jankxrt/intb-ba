import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PasswordGate from "./components/PasswordGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABH Index",
  description: "Ausländerbehörden Index",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <PasswordGate>
          <header className="border-b border-[color:var(--border)] bg-[color:var(--surface)]">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-14">
              <a href="/" className="flex items-center gap-2 text-base font-semibold text-[color:var(--foreground)] hover:opacity-80 transition-opacity">
                ABH Index
              </a>
              <div className="flex items-center gap-1">
                <a href="/" className="nav-link">Übersicht</a>
                <a href="/statistics" className="nav-link">Statistik</a>
                <a href="/outreach" className="nav-link">Outreach</a>
                <a href="/outreach/email" className="nav-link">E-Mail</a>
                <span className="nav-link opacity-40 cursor-not-allowed pointer-events-none select-none" title="Demnächst verfügbar">Karte</span>
              </div>
            </nav>
          </header>
          {children}
        </PasswordGate>
      </body>
    </html>
  );
}
