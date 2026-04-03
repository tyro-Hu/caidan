import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "贝贝点菜",
    short_name: "贝贝点菜",
    description: "前后端分离的家庭点餐小系统，支持登录、角色分流、点菜下单和商家接单提醒。",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff7ef",
    theme_color: "#ff8ca3",
    lang: "zh-CN",
    categories: ["food", "business", "shopping"],
    icons: [
      {
        src: "/pwa/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
