"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function isRunningStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
}

function subscribeToStandalone(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(display-mode: standalone)");

  mediaQuery.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);

  return () => {
    mediaQuery.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function subscribeNoop() {
  return () => undefined;
}

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppCard() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [statusText, setStatusText] = useState("打开后可直接安装到手机桌面。");

  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    isRunningStandalone,
    () => false,
  );
  const isIos = useSyncExternalStore(subscribeNoop, isIosDevice, () => false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setStatusText("检测到可安装环境，安卓可直接点击按钮安装。");
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setStatusText("应用已经安装到桌面，可以像原生 app 一样打开。");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const helperText = useMemo(() => {
    if (isStandalone) {
      return "当前已经是桌面 app 形态，后续可以继续补登录、支付和消息提醒。";
    }

    if (installPrompt) {
      return "安卓 Chrome 下会弹出系统安装框；安装后会以独立窗口运行。";
    }

    if (isIos) {
      return "iPhone 上请用 Safari 打开，然后点“分享”再选“添加到主屏幕”。";
    }

    return "如果浏览器还没给出安装按钮，先通过 HTTPS 打开并访问一次菜单页。";
  }, [installPrompt, isIos, isStandalone]);

  async function handleInstall() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setStatusText("用户已确认安装，等待系统完成桌面创建。");
    } else {
      setStatusText("安装提示已关闭，可以稍后再次尝试。");
    }
  }

  return (
    <section className="panel animate-rise rounded-[32px] p-6 [animation-delay:220ms] sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
        <div>
          <p className="kicker">手机安装版</p>
          <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
            这版不是普通网页，而是可安装到手机桌面的 PWA
          </h2>
          <p className="mt-4 text-base leading-8 text-[rgba(31,35,25,0.68)]">
            已补 `manifest`、独立窗口模式、桌面图标和离线缓存。用户装到手机后，打开体验会更接近 app，而不是浏览器标签页。
          </p>
          <p className="mt-4 text-sm leading-7 text-[rgba(31,35,25,0.56)]">
            {statusText}
            <br />
            {helperText}
          </p>
        </div>

        <div className="rounded-[28px] border border-line bg-[#1f2319] p-5 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-white/54">Install</p>
          <p className="mt-4 text-3xl font-semibold">
            {isStandalone ? "已安装" : "可装到桌面"}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleInstall}
              disabled={!installPrompt || isStandalone}
              className={`rounded-full px-5 py-3 text-sm font-semibold ${
                installPrompt && !isStandalone
                  ? "bg-accent text-white hover:bg-accent-deep"
                  : "bg-white/12 text-white/42"
              }`}
            >
              {isStandalone ? "当前已安装" : "安装到手机"}
            </button>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white hover:bg-white/6"
            >
              进入点餐
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
