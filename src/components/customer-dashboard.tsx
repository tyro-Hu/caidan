"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dish, Order } from "@/lib/app-types";
import { createOrder, fetchCustomerOrders, fetchDishes } from "@/lib/api-client";
import { clearStoredSession } from "@/lib/client-storage";
import { AccountPanel } from "@/components/account-panel";
import { useRoleGuard } from "@/components/role-guard";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function statusLabel(status: Order["status"]) {
  switch (status) {
    case "pending":
      return "待商家接单";
    case "accepted":
      return "制作中";
    case "ready":
      return "可取餐";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
}

export function CustomerDashboard() {
  const router = useRouter();
  const { ready, session } = useRoleGuard("customer");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [note, setNote] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData(token: string) {
    const [dishResponse, orderResponse] = await Promise.all([
      fetchDishes(token),
      fetchCustomerOrders(token),
    ]);

    setDishes(dishResponse.dishes);
    setOrders(orderResponse.orders);
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    loadData(session.token).catch((error) => {
      setMessage(error instanceof Error ? error.message : "加载失败");
    });

    const timer = window.setInterval(() => {
      loadData(session.token).catch(() => {
        return undefined;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [session]);

  const cartItems = useMemo(() => {
    return dishes
      .map((dish) => {
        const quantity = cart[dish.id] ?? 0;

        if (quantity < 1) {
          return null;
        }

        return {
          dish,
          quantity,
          subtotal: dish.price * quantity,
        };
      })
      .filter((item): item is { dish: Dish; quantity: number; subtotal: number } => item !== null);
  }, [cart, dishes]);

  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const activeOrders = orders.filter(
    (order) => order.status === "pending" || order.status === "accepted" || order.status === "ready",
  );
  const historyOrders = orders.filter(
    (order) => order.status === "completed" || order.status === "cancelled",
  );

  function changeQuantity(dishId: string, delta: number) {
    setCart((current) => {
      const next = { ...current };
      const value = Math.max(0, (current[dishId] ?? 0) + delta);

      if (value === 0) {
        delete next[dishId];
        return next;
      }

      next[dishId] = value;
      return next;
    });
  }

  async function handleSubmitOrder() {
    if (!session || cartItems.length === 0) {
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await createOrder(session.token, {
        items: cartItems.map((item) => ({
          dishId: item.dish.id,
          quantity: item.quantity,
        })),
        note,
      });

      setCart({});
      setNote("");
      setMessage("下单成功，商家端已经可以看到这笔订单。");
      await loadData(session.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "下单失败");
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    clearStoredSession();
    router.replace("/");
  }

  if (!ready || !session) {
    return <main className="flex-1 px-4 py-10">正在进入顾客点餐页...</main>;
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="panel rounded-[32px] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="kicker">顾客界面</p>
              <h1 className="mt-4 text-4xl font-semibold">你好，{session.user.displayName}</h1>
              <p className="mt-3 text-sm leading-7 text-[rgba(109,77,63,0.7)]">
                今天想吃点什么？选好后直接下单，商家端会在几秒内收到提醒。
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-line bg-white/78 px-4 py-2 text-sm font-semibold hover:bg-white"
            >
              退出登录
            </button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {dishes.map((dish) => (
              <article
                key={dish.id}
                className="panel rounded-[28px] p-5 sm:grid sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-5"
              >
                <Image
                  src={dish.image}
                  alt={dish.name}
                  className="h-36 w-full rounded-[24px] border border-white/70 bg-white/70 object-cover sm:h-full"
                  width={560}
                  height={360}
                  unoptimized
                />
                <div className="mt-4 sm:mt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ff6076]">
                        {dish.category}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">{dish.name}</h2>
                    </div>
                    <div className="rounded-full bg-[rgba(255,140,163,0.16)] px-3 py-1 text-sm font-semibold text-[#ff6076]">
                      {formatCurrency(dish.price)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[rgba(109,77,63,0.68)]">
                    {dish.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 rounded-full border border-line bg-white/80 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => changeQuantity(dish.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(109,77,63,0.08)] text-lg font-semibold"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-lg font-semibold">
                        {cart[dish.id] ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(dish.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff8ca3] text-lg font-semibold text-white"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-[rgba(109,77,63,0.56)]">家常够用，不做复杂规格</p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <section className="panel rounded-[28px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(109,77,63,0.46)]">
                购物车
              </p>
              <div className="mt-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-line bg-white/70 p-4 text-sm leading-7 text-[rgba(109,77,63,0.68)]">
                    还没选菜。先点几样常吃的，商家端会实时看到。
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.dish.id} className="rounded-[20px] border border-line bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">{item.dish.name}</p>
                          <p className="mt-1 text-sm text-[rgba(109,77,63,0.56)]">
                            x{item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <label className="mt-4 block rounded-[22px] border border-line bg-white/70 p-4">
                <span className="text-sm font-medium text-[rgba(109,77,63,0.62)]">
                  备注
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className="mt-3 w-full resize-none border-none bg-transparent p-0 text-sm leading-7 outline-none"
                  placeholder="例如 少辣、不要香菜"
                />
              </label>

              <div className="mt-4 rounded-[24px] bg-[#6d4d3f] p-5 text-white">
                <p className="text-sm text-white/68">合计</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(total)}</p>
                <button
                  type="button"
                  disabled={cartItems.length === 0 || submitting}
                  onClick={handleSubmitOrder}
                  className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold ${
                    cartItems.length > 0 && !submitting
                      ? "bg-[#ff8ca3] text-white hover:bg-[#ff728d]"
                      : "bg-white/12 text-white/40"
                  }`}
                >
                  {submitting ? "提交中..." : "提交订单"}
                </button>
              </div>

              {message ? (
                <div className="mt-4 rounded-[20px] border border-line bg-white/72 p-4 text-sm leading-7 text-[rgba(109,77,63,0.72)]">
                  {message}
                </div>
              ) : null}
            </section>

            <section className="panel mt-6 rounded-[28px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(109,77,63,0.46)]">
                我的订单
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#ff6076]">进行中</p>
                    <span className="text-xs text-[rgba(109,77,63,0.56)]">
                      {activeOrders.length} 单
                    </span>
                  </div>
                  <div className="space-y-3">
                    {activeOrders.length === 0 ? (
                      <div className="rounded-[20px] border border-dashed border-line bg-white/70 p-4 text-sm leading-7 text-[rgba(109,77,63,0.68)]">
                        当前没有进行中的订单。
                      </div>
                    ) : (
                      activeOrders.map((order) => (
                        <div key={order.id} className="rounded-[20px] border border-line bg-white/70 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-[#ff6076]">{order.id}</p>
                              <p className="mt-2 text-base font-semibold">{statusLabel(order.status)}</p>
                            </div>
                            <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[rgba(109,77,63,0.62)]">
                            {order.items.map((item) => `${item.name} x${item.quantity}`).join(" / ")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[rgba(109,77,63,0.62)]">历史订单</p>
                    <span className="text-xs text-[rgba(109,77,63,0.56)]">
                      {historyOrders.length} 单
                    </span>
                  </div>
                  <div className="space-y-3">
                    {historyOrders.length === 0 ? (
                      <div className="rounded-[20px] border border-dashed border-line bg-white/70 p-4 text-sm leading-7 text-[rgba(109,77,63,0.68)]">
                        还没有历史订单。
                      </div>
                    ) : (
                      historyOrders.map((order) => (
                        <div key={order.id} className="rounded-[20px] border border-line bg-white/70 p-4 opacity-85">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-[rgba(109,77,63,0.56)]">
                                {order.id}
                              </p>
                              <p className="mt-2 text-base font-semibold">{statusLabel(order.status)}</p>
                            </div>
                            <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[rgba(109,77,63,0.62)]">
                            {order.items.map((item) => `${item.name} x${item.quantity}`).join(" / ")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-6">
              <AccountPanel session={session} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
