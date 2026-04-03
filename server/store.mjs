import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const storePath = path.join(dataDir, "store.json");

const seedDishes = [
  {
    id: "tomato-beef-rice",
    name: "番茄肥牛饭",
    price: 28,
    image: "/menu/tomato-beef-rice.svg",
    category: "热销主食",
    description: "酸甜番茄配肥牛和半熟蛋，适合午晚餐快速点单。",
    available: true,
  },
  {
    id: "crispy-chicken-rice",
    name: "香煎鸡排饭",
    price: 26,
    image: "/menu/crispy-chicken-rice.svg",
    category: "热销主食",
    description: "外酥里嫩的鸡排配玉米和时蔬，属于稳妥热门款。",
    available: true,
  },
  {
    id: "shrimp-wonton-noodle",
    name: "鲜虾云吞面",
    price: 24,
    image: "/menu/shrimp-wonton-noodle.svg",
    category: "汤面加餐",
    description: "清爽汤底搭配鲜虾云吞，晚餐点也不会太腻。",
    available: true,
  },
  {
    id: "strawberry-soda",
    name: "草莓气泡饮",
    price: 12,
    image: "/menu/strawberry-soda.svg",
    category: "饮品甜点",
    description: "粉色气泡饮，适合搭配主食，也适合作为情侣套餐饮品。",
    available: true,
  },
];

function createSeedStore() {
  return {
    users: [
      {
        id: "customer-beibei",
        username: "beibei",
        passwordHash: bcrypt.hashSync("123456", 10),
        role: "customer",
        displayName: "贝贝",
      },
      {
        id: "merchant-laoban",
        username: "laoban",
        passwordHash: bcrypt.hashSync("123456", 10),
        role: "merchant",
        displayName: "老板",
      },
    ],
    dishes: seedDishes,
    orders: [],
  };
}

function createOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

function mapOrderFromRow(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    note: row.note,
    status: row.status,
    total: row.total,
    items: Array.isArray(row.items_json) ? row.items_json : JSON.parse(row.items_json),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function createFileStore() {
  await mkdir(dataDir, { recursive: true });

  let store;

  if (!existsSync(storePath)) {
    store = createSeedStore();
    await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
  } else {
    const raw = await readFile(storePath, "utf8");
    store = JSON.parse(raw);
  }

  async function persist() {
    await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
  }

  return {
    mode: "file",
    async getHealthStats() {
      return {
        dishes: store.dishes.length,
        orders: store.orders.length,
      };
    },
    async findUserByUsername(username) {
      return store.users.find((user) => user.username === username) ?? null;
    },
    async findUserById(userId) {
      return store.users.find((user) => user.id === userId) ?? null;
    },
    async updateUserPassword(userId, passwordHash) {
      const user = store.users.find((item) => item.id === userId) ?? null;
      if (!user) {
        return null;
      }

      user.passwordHash = passwordHash;
      await persist();
      return user;
    },
    async listAvailableDishes() {
      return store.dishes.filter((dish) => dish.available);
    },
    async listCustomerOrders(userId) {
      return store.orders
        .filter((order) => order.customerId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async listMerchantOrders() {
      return [...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async createOrder({ customerId, customerName, note, items }) {
      const timestamp = new Date().toISOString();
      const order = {
        id: createOrderId(),
        customerId,
        customerName,
        note,
        status: "pending",
        total: items.reduce((sum, item) => sum + item.subtotal, 0),
        items,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      store.orders.unshift(order);
      await persist();
      return order;
    },
    async updateOrderStatus(orderId, status) {
      const order = store.orders.find((item) => item.id === orderId) ?? null;
      if (!order) {
        return null;
      }

      order.status = status;
      order.updatedAt = new Date().toISOString();
      await persist();
      return order;
    },
    async resolveOrderItems(rawItems) {
      const items = rawItems.map((item) => {
        const dish = store.dishes.find((current) => current.id === item.dishId && current.available);
        if (!dish) {
          return null;
        }
        return {
          dishId: dish.id,
          name: dish.name,
          image: dish.image,
          price: dish.price,
          quantity: item.quantity,
          subtotal: dish.price * item.quantity,
        };
      });

      if (items.some((item) => item === null)) {
        return null;
      }

      return items;
    },
  };
}

async function createPostgresStore(databaseUrl) {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  });

  await pool.query(`
    create table if not exists users (
      id text primary key,
      username text not null unique,
      password_hash text not null,
      role text not null,
      display_name text not null
    );

    create table if not exists dishes (
      id text primary key,
      name text not null,
      price integer not null,
      image text not null,
      category text not null,
      description text not null,
      available boolean not null default true
    );

    create table if not exists orders (
      id text primary key,
      customer_id text not null references users(id),
      customer_name text not null,
      note text not null default '',
      status text not null,
      total integer not null,
      items_json jsonb not null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    );
  `);

  const seeded = createSeedStore();
  const userCount = await pool.query("select count(*)::int as count from users");

  if (userCount.rows[0].count === 0) {
    for (const user of seeded.users) {
      await pool.query(
        `
          insert into users (id, username, password_hash, role, display_name)
          values ($1, $2, $3, $4, $5)
        `,
        [user.id, user.username, user.passwordHash, user.role, user.displayName],
      );
    }
  }

  const dishCount = await pool.query("select count(*)::int as count from dishes");

  if (dishCount.rows[0].count === 0) {
    for (const dish of seedDishes) {
      await pool.query(
        `
          insert into dishes (id, name, price, image, category, description, available)
          values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          dish.id,
          dish.name,
          dish.price,
          dish.image,
          dish.category,
          dish.description,
          dish.available,
        ],
      );
    }
  }

  return {
    mode: "postgres",
    async getHealthStats() {
      const [dishCountResult, orderCountResult] = await Promise.all([
        pool.query("select count(*)::int as count from dishes"),
        pool.query("select count(*)::int as count from orders"),
      ]);

      return {
        dishes: dishCountResult.rows[0].count,
        orders: orderCountResult.rows[0].count,
      };
    },
    async findUserByUsername(username) {
      const result = await pool.query(
        `
          select id, username, password_hash as "passwordHash", role, display_name as "displayName"
          from users
          where username = $1
          limit 1
        `,
        [username],
      );

      return result.rows[0] ?? null;
    },
    async findUserById(userId) {
      const result = await pool.query(
        `
          select id, username, password_hash as "passwordHash", role, display_name as "displayName"
          from users
          where id = $1
          limit 1
        `,
        [userId],
      );

      return result.rows[0] ?? null;
    },
    async updateUserPassword(userId, passwordHash) {
      const result = await pool.query(
        `
          update users
          set password_hash = $2
          where id = $1
          returning id, username, password_hash as "passwordHash", role, display_name as "displayName"
        `,
        [userId, passwordHash],
      );

      return result.rows[0] ?? null;
    },
    async listAvailableDishes() {
      const result = await pool.query(
        `
          select id, name, price, image, category, description, available
          from dishes
          where available = true
          order by category asc, price asc
        `,
      );

      return result.rows;
    },
    async listCustomerOrders(userId) {
      const result = await pool.query(
        `
          select *
          from orders
          where customer_id = $1
          order by created_at desc
        `,
        [userId],
      );

      return result.rows.map(mapOrderFromRow);
    },
    async listMerchantOrders() {
      const result = await pool.query(
        `
          select *
          from orders
          order by created_at desc
        `,
      );

      return result.rows.map(mapOrderFromRow);
    },
    async createOrder({ customerId, customerName, note, items }) {
      const timestamp = new Date();
      const order = {
        id: createOrderId(),
        customerId,
        customerName,
        note,
        status: "pending",
        total: items.reduce((sum, item) => sum + item.subtotal, 0),
        items,
        createdAt: timestamp.toISOString(),
        updatedAt: timestamp.toISOString(),
      };

      await pool.query(
        `
          insert into orders (
            id, customer_id, customer_name, note, status, total, items_json, created_at, updated_at
          ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
        `,
        [
          order.id,
          order.customerId,
          order.customerName,
          order.note,
          order.status,
          order.total,
          JSON.stringify(order.items),
          timestamp,
          timestamp,
        ],
      );

      return order;
    },
    async updateOrderStatus(orderId, status) {
      const result = await pool.query(
        `
          update orders
          set status = $2, updated_at = now()
          where id = $1
          returning *
        `,
        [orderId, status],
      );

      return result.rows[0] ? mapOrderFromRow(result.rows[0]) : null;
    },
    async resolveOrderItems(rawItems) {
      const dishIds = rawItems.map((item) => item.dishId);
      const result = await pool.query(
        `
          select id, name, price, image, available
          from dishes
          where id = any($1::text[])
        `,
        [dishIds],
      );

      const dishMap = new Map(result.rows.map((dish) => [dish.id, dish]));
      const items = rawItems.map((item) => {
        const dish = dishMap.get(item.dishId);
        if (!dish || !dish.available) {
          return null;
        }

        return {
          dishId: dish.id,
          name: dish.name,
          image: dish.image,
          price: dish.price,
          quantity: item.quantity,
          subtotal: dish.price * item.quantity,
        };
      });

      if (items.some((item) => item === null)) {
        return null;
      }

      return items;
    },
  };
}

export async function createStore() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return createPostgresStore(databaseUrl);
  }

  return createFileStore();
}
