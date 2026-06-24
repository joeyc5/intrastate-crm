import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Brand } from "./components/Brand";

export const metadata: Metadata = {
  title: "SVM Intrastate Move Quote",
  description:
    "MAX4-compliant Not-to-Exceed quote calculator — Silicon Valley Moving & Storage.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Brand />
            <span className="text-xs font-medium tracking-wide text-black/45">Cal T 188960</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-black/10 bg-white">
          <div className="mx-auto max-w-3xl px-6 py-4 text-xs leading-relaxed text-black/45">
            Silicon Valley Moving &amp; Storage Inc · 186 Barnard Ave, San Jose CA 95125 · 408-941-0600 ·
            www.SiliconValleyMoving.com
          </div>
        </footer>
      </body>
    </html>
  );
}
