import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import type { ReactNode } from "react";
import { vi } from "@/i18n/vi";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["vietnamese", "latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["vietnamese", "latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: vi.meta.title, template: `%s · ${vi.brand}` },
  description: vi.meta.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff7f0",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${baloo.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
