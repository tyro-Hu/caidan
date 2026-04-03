"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Order } from "@/lib/app-types";
import { AccountPanel } from "@/components/account-panel";
import {
  createMerchantEventsSource,
  fetchManageDishes,
  fetchMerchantOrders,
  updateDish,
  updateOrderStatus,
} from "@/lib/api-client";
import { clearStoredSession } from "@/lib/client-storage";
import { useRoleGuard } from "@/components/role-guard";
import type { Dish } from "@/lib/app-types";

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
      return "待接单";
    case "accepted":
      return "制作中";
    case "ready":
      return "待取餐";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
}

function nextAction(status: Order["status"]) {
  switch (status) {
    case "pending":
      return { label: "接单", value: "accepted" as const };
    case "accepted":
      return { label: "标记待取餐", value: "ready" as const };
    case "ready":
      return { label: "完成订单", value: "completed" as const };
    default:
      return null;
  }
}

async function requestNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.requestPermissions();
  } else if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

async function notifyNewOrder(order: Order) {
  if ("vibrate" in navigator) {
    navigator.vibrate([120, 80, 120]);
  }

  try {
    const audioContext = new window.AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);
  } catch {
    return;
  }

  const body = `${order.customerName} 下单 ${formatCurrency(order.total)}`;

  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() / 1000),
          title: "贝贝点菜有新订单",
          body,
          schedule: {
            at: new Date(Date.now() + 250),
          },
        },
      ],
    });
    return;
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("贝贝点菜有新订单", { body });
  }
}

export function MerchantDashboard() {
  const router = useRouter();
  const { ready, session } = useRoleGuard("merchant");
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [updatingDishId, setUpdatingDishId] = useState("");
  const seenOrdersRef = useRef<Set<string>>(new Set());

  async function loadOrders(token: string) {
    const { orders: nextOrders } = await fetchMerchantOrders(token);
    const previousOrderIds = seenOrdersRef.current;

    for (const order of nextOrders) {
      if (order.status === "pending" && !previousOrderIds.has(order.id)) {
        previousOrderIds.add(order.id);
        await notifyNewOrder(order);
      }
    }

    setOrders(nextOrders);
  }

  async function loadDishes(token: string) {
    const { dishes: nextDishes } = await fetchManageDishes(token);
    setDishes(nextDishes);
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    requestNotificationPermission().catch(() => {
      return undefined;
    });

    loadOrders(session.token).catch((error) => {
      setMessage(error instanceof Error ? error.message : "加载订单失败");
    });
    loadDishes(session.token).catch(() => {
      return undefined;
    });

    const timer = window.setInterval(() => {
      loadOrders(session.token).catch(() => {
        return undefined;
      });
      loadDishes(session.token).catch(() => {
        return undefined;
      });
    }, 4000);

    const source = createMerchantEventsSource(session.token);
    source.addEventListener("merchant-orders", () => {
      loadOrders(session.token).catch(() => {
        return undefined;
      });
    });

    source.onerror = () => {
      return undefined;
    };

    return () => {
      window.clearInterval(timer);
      source.close();
    };
  }, [session]);

  async function handleUpdateStatus(orderId: string, status: Order["status"]) {
    if (!session) {
      return;
    }

    setUpdatingId(orderId);
    setMessage("");

    try {
      await updateOrderStatus(session.token, orderId, status);
      await loadOrders(session.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新订单失败");
    } finally {
      setUpdatingId("");
    }
  }

  async function handleUpdateDish(
    dishId: string,
    payload: { price?: number; available?: boolean },
  ) {
    if (!session) {
      return;
    }

    setUpdatingDishId(dishId);
    setMessage("");

    try {
      await updateDish(session.token, dishId, payload);
      await loadDishes(session.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新菜品失败");
    } finally {
      setUpdatingDishId("");
    }
  }

  function logout() {
    clearStoredSession();
    router.replace("/");
  }

  const pendingOrders = orders.filter((order) => order.status === "pending");

  if (!ready || !session) {
    return <main className="flex-1 px-4 py-10">正在进入商家后台...</main>;
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="panel rounded-[32px] px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="kicker">商家界面</p>
              <h1 className="mt-4 text-4xl font-semibold">老板，今天一共有 {orders.length} 单</h1>
              <p className="mt-3 text-sm leading-7 text-[rgba(109,77,63,0.7)]">
                新订单会自动提醒。你把安卓手机放在身边，贝贝在 iPhone
                点单后，这里几秒内就会刷新出来。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[rgba(255,140,163,0.16)] px-4 py-2 text-sm font-semibold text-[#ff6076]">
                待接单 {pendingOrders.length}
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-line bg-white/78 px-4 py-2 text-sm font-semibold hover:bg-white"
              >
                退出登录
              </button>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-[22px] border border-line bg-white/72 px-4 py-3 text-sm text-[rgba(109,77,63,0.72)]">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "待接单", status: "pending" as const },
            { title: "制作中", status: "accepted" as const },
            { title: "待取餐", status: "ready" as const },
          ].map((column) => (
            <article key={column.status} className="panel rounded-[28px] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff6076]">
                    {column.title}
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {orders.filter((order) => order.status === column.status).length}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => {
            const action = nextAction(order.status);

            return (
              <article key={order.id} className="panel rounded-[28px] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#ff6076]">{order.id}</p>
                    <h2 className="mt-2 text-2xl font-semibold">{order.customerName}</h2>
                  </div>
                  <div className="text-right">
                    <p className="rounded-full bg-[rgba(255,140,163,0.16)] px-3 py-1 text-sm font-semibold text-[#ff6076]">
                      {statusLabel(order.status)}
                    </p>
                    <p className="mt-3 text-lg font-semibold">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={`${order.id}-${item.dishId}`}
                      className="rounded-[20px] border border-line bg-white/72 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={item.image}
                            alt={item.name}
                            className="h-14 w-14 rounded-[16px] border border-white/70 object-cover"
                            width={56}
                            height={56}
                            unoptimized
                          />
                          <div>
                            <p className="text-base font-semibold">{item.name}</p>
                            <p className="mt-1 text-sm text-[rgba(109,77,63,0.56)]">
                              x{item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">{formatCurrency(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {order.note ? (
                  <p className="mt-4 text-sm leading-7 text-[rgba(109,77,63,0.68)]">
                    备注：{order.note}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  {action ? (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, action.value)}
                      className="rounded-full bg-[#ff8ca3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff728d]"
                    >
                      {updatingId === order.id ? "处理中..." : action.label}
                    </button>
                  ) : null}

                  {order.status !== "cancelled" && order.status !== "completed" ? (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, "cancelled")}
                      className="rounded-full border border-line bg-white/78 px-4 py-2 text-sm font-semibold hover:bg-white"
                    >
                      无法接单
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="panel rounded-[28px] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ff6076]">
                  菜单管理
                </p>
                <p className="mt-2 text-sm leading-7 text-[rgba(109,77,63,0.68)]">
                  日常就改两件事：价格、是否上架。
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {dishes.map((dish) => (
                <div key={dish.id} className="rounded-[20px] border border-line bg-white/72 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={dish.image}
                        alt={dish.name}
                        className="h-14 w-14 rounded-[16px] border border-white/70 object-cover"
                        width={56}
                        height={56}
                        unoptimized
                      />
                      <div>
                        <p className="text-base font-semibold">{dish.name}</p>
                        <p className="mt-1 text-sm text-[rgba(109,77,63,0.56)]">
                          {dish.category}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        dish.available
                          ? "bg-[rgba(151,214,190,0.22)] text-[#3a7b63]"
                          : "bg-[rgba(109,77,63,0.08)] text-[rgba(109,77,63,0.62)]"
                      }`}
                    >
                      {dish.available ? "已上架" : "已下架"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={updatingDishId === dish.id}
                      onClick={() =>
                        handleUpdateDish(dish.id, {
                          price: dish.price + 1,
                        })
                      }
                      className="rounded-full border border-line bg-white/78 px-4 py-2 text-sm font-semibold hover:bg-white"
                    >
                      加价 1 元
                    </button>
                    <button
                      type="button"
                      disabled={updatingDishId === dish.id || dish.price <= 1}
                      onClick={() =>
                        handleUpdateDish(dish.id, {
                          price: Math.max(1, dish.price - 1),
                        })
                      }
                      className="rounded-full border border-line bg-white/78 px-4 py-2 text-sm font-semibold hover:bg-white"
                    >
                      降价 1 元
                    </button>
                    <button
                      type="button"
                      disabled={updatingDishId === dish.id}
                      onClick={() =>
                        handleUpdateDish(dish.id, {
                          available: !dish.available,
                        })
                      }
                      className="rounded-full bg-[#ff8ca3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff728d]"
                    >
                      {dish.available ? "下架" : "重新上架"}
                    </button>
                    <span className="text-sm font-semibold text-[rgba(109,77,63,0.72)]">
                      当前价格：{formatCurrency(dish.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[28px] p-5 text-sm leading-7 text-[rgba(109,77,63,0.7)]">
            建议把商家端安卓手机一直保持登录，并把通知权限打开。
            <br />
            这样贝贝一旦在 iPhone 端下单，你这边会更快收到提醒。
          </div>
        </section>

        <AccountPanel session={session} />
      </div>
    </main>
  );
}
