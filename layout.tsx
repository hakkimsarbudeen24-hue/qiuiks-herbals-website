import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QIUIKS HERBALS | Nature-inspired Herbal Care",
  description: "Explore QIUIKS HERBALS natural herbal care products."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
