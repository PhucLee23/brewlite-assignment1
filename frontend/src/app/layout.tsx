import type { Metadata } from "next";
import Header from "@/components/Header";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrewLite – Đặt cà phê không tiền mặt",
  description: "Đặt và thanh toán đồ uống chỉ trong vài chạm.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <head>
        {/* Trình duyệt tự tải font; build không cần mạng, thiếu mạng thì dùng font hệ thống */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
