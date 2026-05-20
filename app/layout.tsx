import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "JLPT Master — Japanese Vocabulary Learning Platform",
  description:
    "Master JLPT vocabulary with flashcards, spaced repetition, and intelligent scoring. Study N5 through N1 levels at your own pace.",
  keywords: ["JLPT", "Japanese", "vocabulary", "flashcards", "study", "N5", "N4", "spaced repetition"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
