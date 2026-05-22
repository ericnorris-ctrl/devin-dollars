import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PersonaProvider } from "@/components/layout/persona-context";
import { ToastProvider } from "@/components/layout/toast-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Devin Dollars — ACU Project Tracker",
  description: "Track Devin ACU allocation, consumption, and ROI across your IT portfolio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full noise-overlay font-sans">
        <PersonaProvider>
          <ToastProvider>
            <Sidebar />
            <Topbar />
            <main className="ml-60 mt-[52px] min-h-[calc(100vh-52px)] grid-pattern">
              <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
            </main>
          </ToastProvider>
        </PersonaProvider>
      </body>
    </html>
  );
}
