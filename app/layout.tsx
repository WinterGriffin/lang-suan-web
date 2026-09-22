import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "หลังสวน (Lang Suan)",
  description: "บันทึกการขายผลผลิตจากสวน",
};

export const viewport: Viewport = { themeColor: "#1D513B" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
