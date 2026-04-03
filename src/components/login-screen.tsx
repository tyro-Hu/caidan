"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchHealth, login } from "@/lib/api-client";
import {
  getStoredApiBase,
  getStoredSession,
  normalizeApiBase,
  setStoredApiBase,
  setStoredSession,
} from "@/lib/client-storage";

export function LoginScreen() {
  const router = useRouter();
  const [apiBase, setApiBase] = useState(getStoredApiBase());
  const [username, setUsername] = useState("beibei");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [healthStatus, setHealthStatus] = useState<"idle" | "ok" | "error">("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentSession = getStoredSession();

    if (!currentSession) {
      return;
    }

    router.replace(currentSession.user.role === "merchant" ? "/admin" : "/menu");
  }, [router]);

  async function handleCheckConnection() {
    setStoredApiBase(apiBase);

    try {
      await fetchHealth();
      setHealthStatus("ok");
      setError("");
    } catch (currentError) {
      setHealthStatus("error");
      setError(
        currentError instanceof Error
          ? currentError.message
          : "服务器连接失败，请检查地址和端口。",
      );
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedApiBase = normalizeApiBase(apiBase);
      setStoredApiBase(normalizedApiBase);
      const session = await login(username, password);
      setStoredSession(session);
      router.replace(session.user.role === "merchant" ? "/admin" : "/menu");
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : "登录失败，请稍后重试。",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="panel hero-grid rounded-[36px] px-6 py-8 sm:px-8 sm:py-10">
            <div className="kicker">贝贝点菜 · 双端版</div>
            <div className="mt-6 flex flex-col gap-6">
              <Image
                src="/pwa/icon-512"
                alt="贝贝点菜图标"
                className="h-24 w-24 rounded-[28px] border border-white/70 bg-white/70 object-cover shadow-[0_18px_48px_rgba(255,140,163,0.22)]"
                width={96}
                height={96}
                unoptimized
              />
              <div>
                <h1 className="display-title text-5xl leading-none sm:text-6xl">
                  你负责点菜
                  <br />
                  我负责接单
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[rgba(109,77,63,0.72)] sm:text-lg">
                  前后端分离的双角色点餐小系统。老婆在 iPhone 上点单，老公在 Android
                  上用商家账号就能实时看到新订单并处理状态。
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-[26px] border border-line bg-white/72 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff6076]">
                    顾客端
                  </p>
                  <p className="mt-3 text-lg font-semibold">浏览菜单、加入购物车、提交订单</p>
                </article>
                <article className="rounded-[26px] border border-line bg-white/72 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff6076]">
                    商家端
                  </p>
                  <p className="mt-3 text-lg font-semibold">轮询提醒、接单、备餐、完成出餐</p>
                </article>
              </div>
            </div>
          </section>

          <section className="panel rounded-[36px] px-6 py-8 sm:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(109,77,63,0.46)]">
                  Login
                </p>
                <h2 className="mt-2 text-3xl font-semibold">登录贝贝点菜</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  healthStatus === "ok"
                    ? "bg-[rgba(151,214,190,0.22)] text-[#3a7b63]"
                    : healthStatus === "error"
                      ? "bg-[rgba(255,126,138,0.16)] text-[#c64d63]"
                      : "bg-[rgba(109,77,63,0.08)] text-[rgba(109,77,63,0.66)]"
                }`}
              >
                {healthStatus === "ok"
                  ? "服务器已连接"
                  : healthStatus === "error"
                    ? "连接失败"
                    : "待检测"}
              </span>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label className="block rounded-[24px] border border-line bg-white/74 px-4 py-4">
                <span className="text-sm font-medium text-[rgba(109,77,63,0.62)]">
                  后端地址
                </span>
                <input
                  value={apiBase}
                  onChange={(event) => setApiBase(event.target.value)}
                  className="mt-3 w-full border-none bg-transparent p-0 text-base outline-none"
                  placeholder="例如 http://192.168.1.20:4000"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block rounded-[24px] border border-line bg-white/74 px-4 py-4">
                  <span className="text-sm font-medium text-[rgba(109,77,63,0.62)]">
                    用户名
                  </span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="mt-3 w-full border-none bg-transparent p-0 text-base outline-none"
                  />
                </label>
                <label className="block rounded-[24px] border border-line bg-white/74 px-4 py-4">
                  <span className="text-sm font-medium text-[rgba(109,77,63,0.62)]">
                    密码
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-3 w-full border-none bg-transparent p-0 text-base outline-none"
                  />
                </label>
              </div>

              {error ? (
                <div className="rounded-[22px] border border-[rgba(255,126,138,0.32)] bg-[rgba(255,126,138,0.12)] px-4 py-3 text-sm text-[#b24b5d]">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#ff8ca3] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ff728d]"
                >
                  {loading ? "登录中..." : "登录并进入"}
                </button>
                <button
                  type="button"
                  onClick={handleCheckConnection}
                  className="inline-flex items-center justify-center rounded-full border border-line bg-white/78 px-5 py-3 text-sm font-semibold hover:bg-white"
                >
                  检测服务器
                </button>
              </div>
            </form>

            <div className="mt-6 rounded-[24px] border border-line bg-[#fffaf6] p-5 text-sm leading-7 text-[rgba(109,77,63,0.72)]">
              默认账号：
              <br />
              顾客：`beibei / 123456`
              <br />
              商家：`laoban / 123456`
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
