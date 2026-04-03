import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createStore } from "./store.mjs";

const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? "beibei-dev-secret";
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

const orderStatuses = ["pending", "accepted", "ready", "completed", "cancelled"];
const merchantClients = new Set();

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        dishId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  note: z.string().trim().max(120).optional().default(""),
});

const updateOrderSchema = z.object({
  status: z.enum(orderStatuses),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  nextPassword: z.string().min(6).max(64),
});

const store = await createStore();
const app = express();

app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin,
  }),
);
app.use(express.json());

function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      username: user.username,
      displayName: user.displayName,
    },
    jwtSecret,
    { expiresIn: "30d" },
  );
}

function auth(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      res.status(401).json({ message: "缺少登录令牌" });
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = payload;

      if (requiredRole && payload.role !== requiredRole) {
        res.status(403).json({ message: "当前账号没有权限访问" });
        return;
      }

      next();
    } catch {
      res.status(401).json({ message: "登录状态已失效，请重新登录" });
    }
  };
}

function resolveTokenFromRequest(req) {
  const authHeader = req.headers.authorization ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  const token = req.query.token;
  return typeof token === "string" ? token : "";
}

function broadcastMerchantOrders(event, payload) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const client of merchantClients) {
    client.write(data);
  }
}

app.get("/api/health", async (_req, res) => {
  const stats = await store.getHealthStats();
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    storage: store.mode,
    dishes: stats.dishes,
    orders: stats.orders,
  });
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "用户名或密码格式不正确" });
    return;
  }

  const username = parsed.data.username.toLowerCase();
  const user = await store.findUserByUsername(username);

  if (!user) {
    res.status(401).json({ message: "账号不存在" });
    return;
  }

  const matched = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!matched) {
    res.status(401).json({ message: "密码错误" });
    return;
  }

  res.json({
    token: createToken(user),
    user: sanitizeUser(user),
  });
});

app.get("/api/orders/stream", async (req, res) => {
  const token = resolveTokenFromRequest(req);

  if (!token) {
    res.status(401).json({ message: "缺少登录令牌" });
    return;
  }

  let payload;

  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    res.status(401).json({ message: "登录状态已失效，请重新登录" });
    return;
  }

  if (payload.role !== "merchant") {
    res.status(403).json({ message: "当前账号没有权限访问" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  merchantClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(": ping\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    merchantClients.delete(res);
  });
});

app.get("/api/me", auth(), async (req, res) => {
  const user = await store.findUserById(req.user.sub);

  if (!user) {
    res.status(404).json({ message: "账号不存在" });
    return;
  }

  res.json({ user: sanitizeUser(user) });
});

app.post("/api/me/password", auth(), async (req, res) => {
  const parsed = updatePasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "新密码至少需要 6 位" });
    return;
  }

  const user = await store.findUserById(req.user.sub);

  if (!user) {
    res.status(404).json({ message: "账号不存在" });
    return;
  }

  const matched = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);

  if (!matched) {
    res.status(400).json({ message: "当前密码不正确" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.nextPassword, 10);
  await store.updateUserPassword(user.id, passwordHash);

  res.json({ ok: true });
});

app.get("/api/dishes", auth(), async (_req, res) => {
  res.json({
    dishes: await store.listAvailableDishes(),
  });
});

app.get("/api/orders/customer", auth("customer"), async (req, res) => {
  const orders = await store.listCustomerOrders(req.user.sub);
  res.json({ orders });
});

app.get("/api/orders/merchant", auth("merchant"), async (_req, res) => {
  const orders = await store.listMerchantOrders();
  res.json({ orders });
});

app.post("/api/orders", auth("customer"), async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "订单数据不正确" });
    return;
  }

  const items = await store.resolveOrderItems(parsed.data.items);

  if (!items) {
    res.status(400).json({ message: "订单里包含无效菜品" });
    return;
  }

  const customer = await store.findUserById(req.user.sub);
  const order = await store.createOrder({
    customerId: req.user.sub,
    customerName: customer?.displayName ?? req.user.displayName ?? "顾客",
    note: parsed.data.note,
    items,
  });

  broadcastMerchantOrders("merchant-orders", {
    type: "order-created",
    orderId: order.id,
  });

  res.status(201).json({ order });
});

app.patch("/api/orders/:orderId/status", auth("merchant"), async (req, res) => {
  const parsed = updateOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "订单状态无效" });
    return;
  }

  const order = await store.updateOrderStatus(req.params.orderId, parsed.data.status);

  if (!order) {
    res.status(404).json({ message: "订单不存在" });
    return;
  }

  broadcastMerchantOrders("merchant-orders", {
    type: "order-updated",
    orderId: order.id,
    status: order.status,
  });

  res.json({ order });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Beibei backend ready on http://0.0.0.0:${port} using ${store.mode}`);
});
