"use client";

import Link from "next/link";
import { useState } from "react";
import {
  categories,
  dishes,
  formatCurrency,
  restaurant,
  type ServiceMode,
} from "@/lib/mock-data";

const defaultSelections = dishes.reduce<Record<string, string>>((result, dish) => {
  result[dish.id] = dish.options[0]?.id ?? "";
  return result;
}, {});

export function MenuExperience() {
  const [mode, setMode] = useState<ServiceMode>("堂食");
  const [tableCode, setTableCode] = useState("A08");
  const [note, setNote] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(defaultSelections);

  const cartItems = dishes
    .map((dish) => {
      const quantity = quantities[dish.id] ?? 0;

      if (quantity < 1) {
        return null;
      }

      const selectedOption =
        dish.options.find((option) => option.id === selectedOptions[dish.id]) ??
        dish.options[0];

      const unitPrice = dish.price + selectedOption.extraPrice;

      return {
        dish,
        quantity,
        selectedOption,
        unitPrice,
        subtotal: unitPrice * quantity,
      };
    })
    .filter((item) => item !== null);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const dishesTotal = cartItems.reduce((total, item) => total + item.subtotal, 0);
  const serviceFee = itemCount > 0 ? 4 : 0;
  const packageFee = itemCount > 0 && mode === "自取" ? 2 : 0;
  const finalTotal = dishesTotal + serviceFee + packageFee;
  const estimatedReadyMinutes =
    itemCount > 0
      ? Math.max(...cartItems.map((item) => item.dish.prepTime)) +
        (mode === "堂食" ? 4 : 2)
      : restaurant.averagePrepTime;

  function updateQuantity(dishId: string, delta: number) {
    setQuantities((current) => {
      const nextValue = Math.max(0, (current[dishId] ?? 0) + delta);

      if (nextValue === 0) {
        const nextState = { ...current };
        delete nextState[dishId];
        return nextState;
      }

      return {
        ...current,
        [dishId]: nextValue,
      };
    });
  }

  function updateOption(dishId: string, optionId: string) {
    setSelectedOptions((current) => ({
      ...current,
      [dishId]: optionId,
    }));
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="panel hero-grid animate-rise relative overflow-hidden rounded-[36px] px-6 py-8 sm:px-8">
        <div className="absolute -right-8 top-8 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(222,93,47,0.28),transparent_68%)]" />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="kicker">扫码点餐页</p>
            <h1 className="display-title mt-5 text-5xl leading-none sm:text-6xl">
              热菜先下单
              <br />
              订单状态可追踪
            </h1>
            <p className="mt-5 text-base leading-8 text-[rgba(31,35,25,0.7)] sm:text-lg">
              这一页优先解决顾客浏览菜单、选择规格、确认桌号和快速下单的问题。
              当前数据为本地演示版，点击下单会进入模拟订单状态页。
            </p>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3 lg:w-[28rem]">
            <div className="rounded-[24px] border border-line bg-white/72 p-4">
              <p className="text-[rgba(31,35,25,0.56)]">预计制作</p>
              <p className="mt-2 text-2xl font-semibold">{estimatedReadyMinutes} 分钟</p>
            </div>
            <div className="rounded-[24px] border border-line bg-white/72 p-4">
              <p className="text-[rgba(31,35,25,0.56)]">门店评分</p>
              <p className="mt-2 text-2xl font-semibold">{restaurant.rating}</p>
            </div>
            <div className="rounded-[24px] border border-line bg-white/72 p-4">
              <p className="text-[rgba(31,35,25,0.56)]">本月订单</p>
              <p className="mt-2 text-2xl font-semibold">{restaurant.monthlyOrders}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <section className="panel animate-rise rounded-[30px] p-5 [animation-delay:120ms] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(31,35,25,0.46)]">
                  Dining Setup
                </p>
                <h2 className="mt-2 text-2xl font-semibold">点单前先确认用餐方式</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {restaurant.serviceModes.map((serviceMode) => {
                  const active = serviceMode === mode;

                  return (
                    <button
                      key={serviceMode}
                      type="button"
                      onClick={() => setMode(serviceMode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        active
                          ? "bg-accent text-white"
                          : "border border-line bg-white/78 hover:bg-white"
                      }`}
                    >
                      {serviceMode}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
              <label className="rounded-[24px] border border-line bg-white/72 p-4">
                <span className="block text-sm font-medium text-[rgba(31,35,25,0.64)]">
                  {mode === "堂食" ? "桌号" : "取餐码"}
                </span>
                <input
                  value={tableCode}
                  onChange={(event) => setTableCode(event.target.value.toUpperCase())}
                  className="mt-3 w-full border-none bg-transparent p-0 text-2xl font-semibold outline-none"
                  placeholder={mode === "堂食" ? "例如 A08" : "例如 102"}
                />
              </label>

              <label className="rounded-[24px] border border-line bg-white/72 p-4">
                <span className="block text-sm font-medium text-[rgba(31,35,25,0.64)]">
                  备注
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className="mt-3 w-full resize-none border-none bg-transparent p-0 text-sm leading-7 outline-none"
                  placeholder="例如 少盐、不放香菜、先上饮品"
                />
              </label>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="animate-rise rounded-full border border-line bg-white/76 px-4 py-2 text-sm font-semibold hover:-translate-y-0.5"
                style={{ animationDelay: `${180 + index * 40}ms` }}
              >
                {category.shortLabel}
              </a>
            ))}
          </div>

          {categories.map((category, categoryIndex) => (
            <section
              key={category.id}
              id={category.id}
              className="animate-rise space-y-4"
              style={{ animationDelay: `${240 + categoryIndex * 70}ms` }}
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-deep">
                    {category.shortLabel}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">{category.name}</h2>
                </div>
                <p className="hidden max-w-sm text-right text-sm leading-7 text-[rgba(31,35,25,0.6)] sm:block">
                  {category.description}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {dishes
                  .filter((dish) => dish.categoryId === category.id)
                  .map((dish) => {
                    const currentQuantity = quantities[dish.id] ?? 0;
                    const selectedOptionId = selectedOptions[dish.id] ?? dish.options[0].id;

                    return (
                      <article key={dish.id} className="panel rounded-[28px] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-accent-deep">
                              {dish.badge}
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold">{dish.name}</h3>
                          </div>
                          <div className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-deep">
                            {formatCurrency(dish.price)}
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-[rgba(31,35,25,0.66)]">
                          {dish.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {dish.highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className="rounded-full border border-line bg-white/72 px-3 py-1 text-xs font-semibold text-[rgba(31,35,25,0.64)]"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>

                        <div className="mt-5 rounded-[22px] border border-line bg-white/66 p-4">
                          <label className="block text-sm font-medium text-[rgba(31,35,25,0.64)]">
                            规格 / 加料
                          </label>
                          <select
                            value={selectedOptionId}
                            onChange={(event) =>
                              updateOption(dish.id, event.target.value)
                            }
                            className="mt-3 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
                          >
                            {dish.options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                                {option.extraPrice > 0
                                  ? ` +${formatCurrency(option.extraPrice)}`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-[rgba(31,35,25,0.56)]">
                              预计出餐
                            </p>
                            <p className="mt-1 text-lg font-semibold">{dish.prepTime} 分钟</p>
                          </div>

                          <div className="flex items-center gap-3 rounded-full border border-line bg-white/78 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(dish.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(31,35,25,0.06)] text-lg font-semibold"
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-lg font-semibold">
                              {currentQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(dish.id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          ))}
        </main>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <section className="panel animate-rise rounded-[32px] p-5 [animation-delay:180ms] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgba(31,35,25,0.46)]">
                  Cart
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  已选 {itemCount} 件
                </h2>
              </div>
              <p className="rounded-full bg-[rgba(80,115,73,0.12)] px-3 py-1 text-sm font-semibold text-basil">
                {mode}
              </p>
            </div>

            {itemCount === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white/54 p-5">
                <p className="text-lg font-semibold">购物车还是空的</p>
                <p className="mt-3 text-sm leading-7 text-[rgba(31,35,25,0.64)]">
                  先从菜单里选几道菜。建议用这版先验证桌号输入、规格选择和结算信息是否符合你的业务习惯。
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.dish.id}
                    className="rounded-[24px] border border-line bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold">{item.dish.name}</p>
                        <p className="mt-1 text-sm text-[rgba(31,35,25,0.6)]">
                          {item.selectedOption.name}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-accent-deep">
                        x{item.quantity}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-[rgba(31,35,25,0.56)]">
                        {formatCurrency(item.unitPrice)} / 份
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-[26px] border border-line bg-[#1f2319] p-5 text-white">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">菜品小计</span>
                  <span>{formatCurrency(dishesTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">服务费</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">打包费</span>
                  <span>{formatCurrency(packageFee)}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                      Total
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      {formatCurrency(finalTotal)}
                    </p>
                  </div>
                  <p className="max-w-32 text-right text-sm leading-6 text-white/70">
                    {mode === "堂食" ? `桌号 ${tableCode || "未填写"}` : `取餐码 ${tableCode || "未填写"}`}
                  </p>
                </div>

                <Link
                  href="/orders/D20260330"
                  className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold ${
                    itemCount > 0
                      ? "bg-accent text-white hover:bg-accent-deep"
                      : "pointer-events-none bg-white/12 text-white/40"
                  }`}
                >
                  提交演示订单
                </Link>
                <p className="mt-3 text-xs leading-6 text-white/56">
                  {note
                    ? `已附加备注：${note}`
                    : "当前为演示环境，下单后会跳转到预设订单状态页。"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-line bg-white/72 p-4 text-sm leading-7 text-[rgba(31,35,25,0.66)]">
              营业时间 {restaurant.openHours}
              <br />
              堂食建议峰值前 10 分钟预点单，自取建议预留 2 分钟缓冲。
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
