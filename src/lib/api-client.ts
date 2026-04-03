import type { Dish, Order, SessionPayload } from "@/lib/app-types";
import { getStoredApiBase } from "@/lib/client-storage";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${getStoredApiBase()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token
        ? {
            Authorization: `Bearer ${options.token}`,
          }
        : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? "请求失败");
  }

  return data as T;
}

export function fetchHealth() {
  return request<{ ok: boolean }>("/api/health");
}

export function login(username: string, password: string) {
  return request<SessionPayload>("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export function fetchDishes(token: string) {
  return request<{ dishes: Dish[] }>("/api/dishes", { token });
}

export function fetchCustomerOrders(token: string) {
  return request<{ orders: Order[] }>("/api/orders/customer", { token });
}

export function fetchMerchantOrders(token: string) {
  return request<{ orders: Order[] }>("/api/orders/merchant", { token });
}

export function createOrder(
  token: string,
  payload: { items: Array<{ dishId: string; quantity: number }>; note: string },
) {
  return request<{ order: Order }>("/api/orders", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateOrderStatus(
  token: string,
  orderId: string,
  status: Order["status"],
) {
  return request<{ order: Order }>(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}

export function createMerchantEventsSource(token: string) {
  const url = new URL("/api/orders/stream", getStoredApiBase());
  url.searchParams.set("token", token);
  return new EventSource(url);
}
