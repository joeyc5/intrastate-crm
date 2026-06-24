import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Brand } from "./components/Brand";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "SVM Intrastate Move Quote",
  description:
    "MAX4-compliant Not-to-Exceed quote calculator — Silicon Valley Moving & Storage.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md print:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
            <div className="flex items-center gap-3.5">
              <Brand />
              <span className="hidden h-5 w-px bg-line sm:block" />
              <span className="hidden text-sm font-medium text-ink-soft sm:block">New quote</span>
            </div>
            <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ink-faint">
              Cal T 188960
            </span>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
