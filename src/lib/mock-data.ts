export type ServiceMode = "堂食" | "自取";

export type Category = {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
};

export type DishOption = {
  id: string;
  name: string;
  extraPrice: number;
};

export type Dish = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  prepTime: number;
  badge: string;
  highlights: string[];
  options: DishOption[];
};

export type TimelineStep = {
  title: string;
  detail: string;
  time: string;
  state: "done" | "active" | "upcoming";
};

export type OrderSnapshot = {
  id: string;
  customer: string;
  placedAt: string;
  mode: ServiceMode;
  tableCode: string;
  statusLabel: string;
  statusNote: string;
  pickupWindow: string;
  items: Array<{
    dishId: string;
    quantity: number;
    optionLabel: string;
    note?: string;
  }>;
  serviceFee: number;
  packageFee: number;
  timeline: TimelineStep[];
};

export const restaurant = {
  name: "贝贝点菜体验店",
  address: "上海市徐汇区漕溪北路 188 号 1F",
  serviceModes: ["堂食", "自取"] as ServiceMode[],
  averagePrepTime: 14,
  rating: "4.8/5",
  monthlyOrders: "3,420",
  openHours: "11:00 - 21:30",
};

export const landingStats = [
  {
    label: "MVP 周期",
    value: "7 天",
    detail: "先打通扫码点餐、订单状态和后台看板。",
  },
  {
    label: "页面模块",
    value: "4 个",
    detail: "首页、菜单、订单状态、商家后台已建好骨架。",
  },
  {
    label: "后续扩展",
    value: "支付 + 会员",
    detail: "数据库和接口层可以在这套结构上继续补全。",
  },
];

export const serviceHighlights = [
  {
    kicker: "顾客端",
    title: "扫码进入菜单，减少收银口头沟通",
    description:
      "顾客直接浏览分类、规格、备注和预计出餐时间，点单动作在手机端完成。",
  },
  {
    kicker: "订单流转",
    title: "每一单都可追踪，减少反复催单",
    description:
      "从已下单到制作中，再到待取餐，状态一条线可视化展示，前后场都更清楚。",
  },
  {
    kicker: "商家端",
    title: "小店先用静态后台，后续再接真实数据",
    description:
      "先把看板、售罄、出餐节奏做顺，再决定是否接支付、打印和库存联动。",
  },
];

export const categories: Category[] = [
  {
    id: "signature",
    name: "招牌热菜",
    shortLabel: "热菜",
    description: "适合堂食高频复购，强调锅气和快出餐。",
  },
  {
    id: "rice",
    name: "饭食主餐",
    shortLabel: "主餐",
    description: "适合午高峰，单品结构清晰，方便标准化。",
  },
  {
    id: "noodle",
    name: "面档加餐",
    shortLabel: "粉面",
    description: "补足轻食和夜宵场景，提升客单的覆盖范围。",
  },
  {
    id: "drinks",
    name: "饮品甜点",
    shortLabel: "饮品",
    description: "拉高连带率，也方便做套餐和会员券。",
  },
];

export const dishes: Dish[] = [
  {
    id: "beef-wok",
    categoryId: "signature",
    name: "黑椒锅气牛肉",
    description: "现炒牛肉配洋葱和彩椒，口味厚重，适合配饭。",
    price: 42,
    prepTime: 12,
    badge: "店长推荐",
    highlights: ["高复购", "出餐 12 分钟", "锅气足"],
    options: [
      { id: "std", name: "标准份", extraPrice: 0 },
      { id: "double-meat", name: "加牛肉", extraPrice: 10 },
      { id: "mild", name: "少辣版", extraPrice: 0 },
    ],
  },
  {
    id: "cauli-chicken",
    categoryId: "signature",
    name: "干锅花菜鸡丁",
    description: "锅边焦香，搭配蒜片和青椒，适合多人分食。",
    price: 36,
    prepTime: 14,
    badge: "快销款",
    highlights: ["适合拼桌", "午市爆单", "焦香口感"],
    options: [
      { id: "std", name: "标准份", extraPrice: 0 },
      { id: "extra-veggie", name: "加时蔬", extraPrice: 4 },
      { id: "extra-spicy", name: "加辣版", extraPrice: 0 },
    ],
  },
  {
    id: "charcoal-rice",
    categoryId: "rice",
    name: "炙烤鸡腿饭",
    description: "现烤去骨鸡腿，搭配照烧汁和季节配菜。",
    price: 29,
    prepTime: 9,
    badge: "午高峰优选",
    highlights: ["单人主餐", "标准化好", "出餐快"],
    options: [
      { id: "std", name: "常规米饭", extraPrice: 0 },
      { id: "extra-rice", name: "加饭", extraPrice: 3 },
      { id: "onsen-egg", name: "加温泉蛋", extraPrice: 4 },
    ],
  },
  {
    id: "lemon-cutlet",
    categoryId: "rice",
    name: "海盐柠檬鸡排饭",
    description: "鸡排外酥里嫩，带轻微柠檬香，适合下午和晚餐。",
    price: 31,
    prepTime: 10,
    badge: "轻负担",
    highlights: ["清爽口", "适合外带", "女性用户常点"],
    options: [
      { id: "std", name: "标准搭配", extraPrice: 0 },
      { id: "extra-salad", name: "加沙拉", extraPrice: 5 },
      { id: "extra-sauce", name: "加海盐汁", extraPrice: 2 },
    ],
  },
  {
    id: "dandan",
    categoryId: "noodle",
    name: "红油担担面",
    description: "芝麻酱底配红油，香辣明显，适合作为快手单品。",
    price: 22,
    prepTime: 7,
    badge: "夜宵加餐",
    highlights: ["毛利稳", "备料简单", "翻台快"],
    options: [
      { id: "std", name: "常规辣度", extraPrice: 0 },
      { id: "less-spicy", name: "微辣", extraPrice: 0 },
      { id: "extra-noodle", name: "加面", extraPrice: 4 },
    ],
  },
  {
    id: "shrimp-udon",
    categoryId: "noodle",
    name: "鲜虾番茄乌冬",
    description: "偏清爽的番茄汤底，适合儿童和不吃辣的人群。",
    price: 30,
    prepTime: 11,
    badge: "家庭友好",
    highlights: ["低辣", "汤面", "适合多人共享"],
    options: [
      { id: "std", name: "标准份", extraPrice: 0 },
      { id: "extra-shrimp", name: "加虾", extraPrice: 8 },
      { id: "cheese-top", name: "加芝士", extraPrice: 5 },
    ],
  },
  {
    id: "plum-drink",
    categoryId: "drinks",
    name: "冰酿乌梅汤",
    description: "解腻基础款，适合搭配热菜和烧烤类单品。",
    price: 10,
    prepTime: 3,
    badge: "连带王",
    highlights: ["高连带", "低成本", "适配热菜"],
    options: [
      { id: "std", name: "标准冰", extraPrice: 0 },
      { id: "less-ice", name: "少冰", extraPrice: 0 },
      { id: "large", name: "大杯", extraPrice: 3 },
    ],
  },
  {
    id: "cold-brew",
    categoryId: "drinks",
    name: "桂花气泡冷萃",
    description: "带轻微桂花香和气泡感，适合品牌调性展示。",
    price: 16,
    prepTime: 4,
    badge: "视觉款",
    highlights: ["适合拍照", "高客单", "下午茶场景"],
    options: [
      { id: "std", name: "常规糖度", extraPrice: 0 },
      { id: "half-sugar", name: "半糖", extraPrice: 0 },
      { id: "large", name: "大杯", extraPrice: 4 },
    ],
  },
];

export const adminMetrics = [
  {
    label: "进行中订单",
    value: "18",
    detail: "当前高峰，后厨平均等待 12 分钟。",
  },
  {
    label: "今日营业额",
    value: "¥ 4,860",
    detail: "客单价 32 元，较昨日提升 7.4%。",
  },
  {
    label: "售罄提醒",
    value: "3 项",
    detail: "牛肉、乌冬、冷萃原液需要补货。",
  },
  {
    label: "差评风险",
    value: "2 单",
    detail: "超时 10 分钟以上的订单需要优先处理。",
  },
];

export const kitchenStations = [
  { name: "热菜档", utilization: 82, note: "牛肉和干锅两道为高峰瓶颈。" },
  { name: "主食档", utilization: 68, note: "鸡腿饭出餐顺畅，可继续承接高峰。" },
  { name: "饮品档", utilization: 36, note: "可承担联动套餐，不是当前瓶颈。" },
];

export const stockAlerts = [
  { item: "黑椒牛肉", level: "低库存", note: "预计剩余 23 份" },
  { item: "乌冬面", level: "补货中", note: "供应商 18:20 到店" },
  { item: "桂花冷萃基底", level: "即将售罄", note: "还可制作 9 杯" },
];

export const orderQueue = [
  {
    id: "D20260330",
    customer: "A08 桌",
    stage: "new",
    total: 96,
    eta: "11 分钟",
    items: "黑椒锅气牛肉 x1 / 炙烤鸡腿饭 x2 / 乌梅汤 x1",
  },
  {
    id: "D20260331",
    customer: "自取 102",
    stage: "cooking",
    total: 54,
    eta: "6 分钟",
    items: "鲜虾番茄乌冬 x1 / 桂花气泡冷萃 x1 / 南瓜球 x1",
  },
  {
    id: "D20260332",
    customer: "B03 桌",
    stage: "cooking",
    total: 73,
    eta: "4 分钟",
    items: "干锅花菜鸡丁 x1 / 海盐柠檬鸡排饭 x1 / 乌梅汤 x1",
  },
  {
    id: "D20260333",
    customer: "自取 103",
    stage: "ready",
    total: 32,
    eta: "待领取",
    items: "红油担担面 x1 / 桂花气泡冷萃 x1",
  },
];

export const orderSnapshots: Record<string, OrderSnapshot> = {
  D20260330: {
    id: "D20260330",
    customer: "陈小姐",
    placedAt: "2026-03-30 18:12",
    mode: "堂食",
    tableCode: "A08",
    statusLabel: "后厨制作中",
    statusNote: "热菜档已接单，预计 8 分钟后上桌。",
    pickupWindow: "预计 18:24 - 18:27 完成",
    items: [
      {
        dishId: "beef-wok",
        quantity: 1,
        optionLabel: "加牛肉",
        note: "少盐，先上饮品",
      },
      {
        dishId: "charcoal-rice",
        quantity: 2,
        optionLabel: "加温泉蛋",
      },
      {
        dishId: "plum-drink",
        quantity: 1,
        optionLabel: "少冰",
      },
    ],
    serviceFee: 4,
    packageFee: 0,
    timeline: [
      {
        title: "顾客已下单",
        detail: "订单进入商家后台并完成桌号绑定。",
        time: "18:12",
        state: "done",
      },
      {
        title: "后厨正在制作",
        detail: "热菜档开始起锅，主食档同步装配。",
        time: "18:16",
        state: "active",
      },
      {
        title: "准备上桌",
        detail: "服务员会先上饮品，再补齐主餐。",
        time: "预计 18:24",
        state: "upcoming",
      },
    ],
  },
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDishById(id: string) {
  return dishes.find((dish) => dish.id === id);
}
