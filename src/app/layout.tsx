import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { vi } from "@/i18n/vi";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: vi.meta.title, template: `%s · ${vi.brand}` },
  description: vi.meta.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
