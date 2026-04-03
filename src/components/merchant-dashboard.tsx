"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Order } from "@/lib/app-types";
import { AccountPanel } from "@/components/account-panel";
import {
  createDish,
  deleteDish,
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

function createDishDraft(dish?: Dish) {
  return {
    name: dish?.name ?? "",
    price: dish?.price ?? 20,
    image: dish?.image ?? "/menu/tomato-beef-rice.svg",
    category: dish?.category ?? "热销主食",
    description: dish?.description ?? "",
    available: dish?.available ?? true,
  };
}

export function MerchantDashboard() {
  const router = useRouter();
  const { ready, session } = useRoleGuard("merchant");
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [updatingDishId, setUpdatingDishId] = useState("");
  const [creatingDish, setCreatingDish] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [streamStatus, setStreamStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [newDish, setNewDish] = useState(createDishDraft());
  const [dishDrafts, setDishDrafts] = useState<Record<string, ReturnType<typeof createDishDraft>>>(
    {},
  );
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
    setLastSyncedAt(new Date().toISOString());
  }

  async function loadDishes(token: string) {
    const { dishes: nextDishes } = await fetchManageDishes(token);
    setDishes(nextDishes);
    setDishDrafts(
      Object.fromEntries(nextDishes.map((dish) => [dish.id, createDishDraft(dish)])),
    );
  }

  async function handleRefresh() {
    if (!session) {
      return;
    }

    setRefreshing(true);
    setMessage("");

    try {
      await Promise.all([loadOrders(session.token), loadDishes(session.token)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "刷新失败");
    } finally {
      setRefreshing(false);
    }
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
    setStreamStatus("connecting");
    source.addEventListener("merchant-orders", () => {
      setStreamStatus("live");
      loadOrders(session.token).catch(() => {
        return undefined;
      });
    });
    source.addEventListener("ready", () => {
      setStreamStatus("live");
    });

    source.onerror = () => {
      setStreamStatus("offline");
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
    payload: {
      name?: string;
      price?: number;
      image?: string;
      category?: string;
      description?: string;
      available?: boolean;
    },
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

  async function handleCreateDish() {
    if (!session) {
      return;
    }

    setCreatingDish(true);
    setMessage("");

    try {
      await createDish(session.token, newDish);
      setNewDish(createDishDraft());
      await loadDishes(session.token);
      setMessage("新菜品已添加。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "新增菜品失败");
    } finally {
      setCreatingDish(false);
    }
  }

  async function handleDeleteDish(dishId: string) {
    if (!session) {
      return;
    }

    setUpdatingDishId(dishId);
    setMessage("");

    try {
      await deleteDish(session.token, dishId);
      await loadDishes(session.token);
      setMessage("菜品已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除菜品失败");
    } finally {
      setUpdatingDishId("");
    }
  }

  function logout() {
    clearStoredSession();
    router.replace("/");
  }

  const pendingOrders = orders.filter((order) => order.status === "pending");
  const groupedOrders = [
    {
      title: "待接单",
      tone: "text-[#ff6076]",
      empty: "当前没有待接单的新订单。",
      orders: orders.filter((order) => order.status === "pending"),
    },
    {
      title: "制作中",
      tone: "text-[#d97a37]",
      empty: "当前没有制作中的订单。",
      orders: orders.filter((order) => order.status === "accepted"),
    },
    {
      title: "待取餐",
      tone: "text-[#3a7b63]",
      empty: "当前没有待取餐订单。",
      orders: orders.filter((order) => order.status === "ready"),
    },
    {
      title: "已结束",
      tone: "text-[rgba(109,77,63,0.62)]",
      empty: "当前没有历史订单。",
      orders: orders.filter(
        (order) => order.status === "completed" || order.status === "cancelled",
      ),
    },
  ];

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
              <p className="mt-3 text-xs text-[rgba(109,77,63,0.56)]">
                最后同步时间：
                {lastSyncedAt
                  ? new Date(lastSyncedAt).toLocaleString("zh-CN")
                  : "尚未同步"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[rgba(255,140,163,0.16)] px-4 py-2 text-sm font-semibold text-[#ff6076]">
                待接单 {pendingOrders.length}
              </div>
              <div
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  streamStatus === "live"
                    ? "bg-[rgba(151,214,190,0.22)] text-[#3a7b63]"
                    : streamStatus === "connecting"
                      ? "bg-[rgba(109,77,63,0.08)] text-[rgba(109,77,63,0.62)]"
                      : "bg-[rgba(255,126,138,0.16)] text-[#c64d63]"
                }`}
              >
                {streamStatus === "live"
                  ? "实时连接中"
                  : streamStatus === "connecting"
                    ? "连接中"
                    : "连接断开"}
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-full border border-line bg-white/78 px-4 py-2 text-sm font-semibold hover:bg-white"
              >
                {refreshing ? "刷新中..." : "手动刷新"}
              </button>
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
          {groupedOrders.map((group) => (
            <article key={group.title} className="panel rounded-[28px] p-5">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${group.tone}`}>
                  {group.title}
                </p>
                <span className="text-xs text-[rgba(109,77,63,0.56)]">
                  {group.orders.length} 单
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {group.orders.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-line bg-white/70 p-4 text-sm leading-7 text-[rgba(109,77,63,0.68)]">
                    {group.empty}
                  </div>
                ) : (
                  group.orders.map((order) => {
                    const action = nextAction(order.status);

                    return (
                      <div key={order.id} className="rounded-[22px] border border-line bg-white/72 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[#ff6076]">{order.id}</p>
                            <h2 className="mt-2 text-xl font-semibold">{order.customerName}</h2>
                          </div>
                          <div className="text-right">
                            <p className="rounded-full bg-[rgba(255,140,163,0.16)] px-3 py-1 text-sm font-semibold text-[#ff6076]">
                              {statusLabel(order.status)}
                            </p>
                            <p className="mt-3 text-base font-semibold">{formatCurrency(order.total)}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={`${order.id}-${item.dishId}`}
                              className="rounded-[18px] border border-line bg-white/72 p-3"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    className="h-12 w-12 rounded-[14px] border border-white/70 object-cover"
                                    width={48}
                                    height={48}
                                    unoptimized
                                  />
                                  <div>
                                    <p className="text-sm font-semibold">{item.name}</p>
                                    <p className="mt-1 text-xs text-[rgba(109,77,63,0.56)]">
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
                          <p className="mt-3 text-sm leading-7 text-[rgba(109,77,63,0.68)]">
                            备注：{order.note}
                          </p>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-3">
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
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          ))}
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

            <div className="mt-4 rounded-[22px] border border-line bg-white/72 p-4">
              <p className="text-sm font-semibold text-[#ff6076]">新增菜品</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={newDish.name}
                  onChange={(event) =>
                    setNewDish((current) => ({ ...current, name: event.target.value }))
                  }
                  className="rounded-[16px] border border-line bg-white px-3 py-3 text-sm outline-none"
                  placeholder="菜品名称"
                />
                <input
                  value={newDish.category}
                  onChange={(event) =>
                    setNewDish((current) => ({ ...current, category: event.target.value }))
                  }
                  className="rounded-[16px] border border-line bg-white px-3 py-3 text-sm outline-none"
                  placeholder="分类"
                />
                <input
                  type="number"
                  min={1}
                  value={newDish.price}
                  onChange={(event) =>
                    setNewDish((current) => ({
                      ...current,
                      price: Number(event.target.value || 1),
                    }))
                  }
                  className="rounded-[16px] border border-line bg-white px-3 py-3 text-sm outline-none"
                  placeholder="价格"
                />
                <input
                  value={newDish.image}
                  onChange={(event) =>
                    setNewDish((current) => ({ ...current, image: event.target.value }))
                  }
                  className="rounded-[16px] border border-line bg-white px-3 py-3 text-sm outline-none"
                  placeholder="图片链接"
                />
              </div>
              <textarea
                value={newDish.description}
                onChange={(event) =>
                  setNewDish((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
                className="mt-3 w-full rounded-[16px] border border-line bg-white px-3 py-3 text-sm outline-none"
                placeholder="菜品描述"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-[rgba(109,77,63,0.72)]">
                  <input
                    type="checkbox"
                    checked={newDish.available}
                    onChange={(event) =>
                      setNewDish((current) => ({ ...current, available: event.target.checked }))
                    }
                  />
                  默认上架
                </label>
                <button
                  type="button"
                  disabled={creatingDish}
                  onClick={handleCreateDish}
                  className="rounded-full bg-[#ff8ca3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff728d]"
                >
                  {creatingDish ? "新增中..." : "新增菜品"}
                </button>
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
                    <input
                      value={dishDrafts[dish.id]?.name ?? dish.name}
                      onChange={(event) =>
                        setDishDrafts((current) => ({
                          ...current,
                          [dish.id]: {
                            ...(current[dish.id] ?? createDishDraft(dish)),
                            name: event.target.value,
                          },
                        }))
                      }
                      className="rounded-[14px] border border-line bg-white px-3 py-2 text-sm outline-none"
                      placeholder="名称"
                    />
                    <input
                      value={dishDrafts[dish.id]?.category ?? dish.category}
                      onChange={(event) =>
                        setDishDrafts((current) => ({
                          ...current,
                          [dish.id]: {
                            ...(current[dish.id] ?? createDishDraft(dish)),
                            category: event.target.value,
                          },
                        }))
                      }
                      className="rounded-[14px] border border-line bg-white px-3 py-2 text-sm outline-none"
                      placeholder="分类"
                    />
                    <input
                      value={dishDrafts[dish.id]?.image ?? dish.image}
                      onChange={(event) =>
                        setDishDrafts((current) => ({
                          ...current,
                          [dish.id]: {
                            ...(current[dish.id] ?? createDishDraft(dish)),
                            image: event.target.value,
                          },
                        }))
                      }
                      className="min-w-[18rem] rounded-[14px] border border-line bg-white px-3 py-2 text-sm outline-none"
                      placeholder="图片链接"
                    />
                    <textarea
                      value={dishDrafts[dish.id]?.description ?? dish.description}
                      onChange={(event) =>
                        setDishDrafts((current) => ({
                          ...current,
                          [dish.id]: {
                            ...(current[dish.id] ?? createDishDraft(dish)),
                            description: event.target.value,
                          },
                        }))
                      }
                      rows={2}
                      className="w-full rounded-[14px] border border-line bg-white px-3 py-2 text-sm outline-none"
                      placeholder="描述"
                    />
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
                    <button
                      type="button"
                      disabled={updatingDishId === dish.id}
                      onClick={() => handleUpdateDish(dish.id, dishDrafts[dish.id] ?? createDishDraft(dish))}
                      className="rounded-full border border-line bg-white/78 px-4 py-2 text-sm font-semibold hover:bg-white"
                    >
                      保存编辑
                    </button>
                    <button
                      type="button"
                      disabled={updatingDishId === dish.id}
                      onClick={() => handleDeleteDish(dish.id)}
                      className="rounded-full border border-[rgba(255,126,138,0.28)] bg-[rgba(255,126,138,0.12)] px-4 py-2 text-sm font-semibold text-[#c64d63] hover:bg-[rgba(255,126,138,0.18)]"
                    >
                      删除菜品
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
