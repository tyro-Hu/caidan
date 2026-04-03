import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <section className="panel hero-grid w-full max-w-xl rounded-[36px] px-6 py-8 text-center sm:px-8 sm:py-10">
        <p className="kicker">离线模式</p>
        <h1 className="display-title mt-6 text-5xl leading-none sm:text-6xl">
          当前网络不可用
        </h1>
        <p className="mt-5 text-base leading-8 text-[rgba(31,35,25,0.7)] sm:text-lg">
          已安装到手机后，菜单壳和基础页面会优先从本地缓存打开。需要实时下单时，请在网络恢复后重试。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-deep"
          >
            返回菜单
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-line bg-white/80 px-6 py-3 text-sm font-semibold hover:bg-white"
          >
            回到首页
          </Link>
        </div>
      </section>
    </main>
  );
}
