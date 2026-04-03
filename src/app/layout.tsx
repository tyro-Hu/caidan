import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://caipu.local"),
  applicationName: "贝贝点菜",
  title: "贝贝点菜",
  description: "前后端分离的家庭点餐小系统，支持登录、角色分流、点菜下单和商家接单提醒。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "贝贝点菜",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    apple: [
      {
        url: "/pwa/apple-touch-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    icon: [
      {
        url: "/pwa/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/pwa/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff8ca3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
