import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khanti Koraputia — Discover the Heart of Koraput",
  description: "The digital voice and discovery platform of Koraput. Discover local businesses, unforgettable places, creators and authentic experiences.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
