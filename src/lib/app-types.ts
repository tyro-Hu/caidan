export type UserRole = "customer" | "merchant";

export type SessionUser = {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
};

export type SessionPayload = {
  token: string;
  user: SessionUser;
};

export type Dish = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  available: boolean;
};

export type OrderItem = {
  dishId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type OrderStatus =
  | "pending"
  | "accepted"
  | "ready"
  | "completed"
  | "cancelled";

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  note: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};
