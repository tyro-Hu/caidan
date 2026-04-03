# 贝贝点菜

一个给夫妻两个人日常使用的轻量点餐系统。

当前版本已经完成：
- 前后端分离
- 登录页
- 顾客账号和商家账号两种角色
- 顾客端看菜品图片、名称、价格并下单
- 商家端轮询刷新订单并用本地通知提醒接单
- 后端已支持 `本地 JSON` 和 `Postgres` 双模式
- Android 调试包
- iOS 模拟器可运行版本

## 默认账号

- 顾客账号：`beibei`
- 商家账号：`laoban`
- 默认密码：`123456`

## 后端

后端是独立的本地 Node 服务，默认端口 `4000`。

启动方式：

```bash
npm run server:start
```

开发时同时启动前端和后端：

```bash
npm run dev:all
```

后端数据当前保存在本地文件：

- `server/data/store.json`

如果设置了 `DATABASE_URL`，后端会自动切到 Postgres 模式。

## 不同网络一起使用

如果你老婆的 iPhone 和你的安卓不在同一个 Wi-Fi，下单和接单要共用一个公网后端地址。

当前仓库已经为这个场景准备好了：

- 后端支持 `DATABASE_URL`
- 已提供 `render.yaml`
- 适合直接部署到 Render
- GitHub 仓库：`https://github.com/tyro-Hu/caidan`
- 目标公网地址：`https://beibei-dian-cai-api.onrender.com`
- 已在蓝图中补好前端静态站点服务：`beibei-dian-cai-web`

推荐部署方式：

1. 把这个仓库推到 GitHub
2. 在 Render 里创建 Blueprint
3. 让 Render 按 `render.yaml` 自动创建：
   - 一个 Node Web Service
   - 一个 Postgres 数据库
4. 部署完成后拿到类似下面的地址：
   - `https://beibei-dian-cai-api.onrender.com`
   - `https://beibei-dian-cai-web.onrender.com`
5. 你老婆在 iPhone 上打开前端地址点菜
6. 你在安卓商家端里把后端地址填成 `https://beibei-dian-cai-api.onrender.com`

部署文件：

- `render.yaml`

Render 部署后，健康检查地址会是：

- `https://你的域名/api/health`

健康检查返回里会看到：

- `storage: "postgres"`

## 手机使用方式

如果老婆用 iPhone 点菜，你用安卓收单，两个手机都要能访问同一个后端地址。

当前这台 Mac 的局域网地址是：

- `http://192.168.31.6:4000`

使用方法：

1. 在这台 Mac 上启动后端：`npm run server:start`
2. 打开手机里的贝贝点菜
3. 登录页里把“后端地址”填成 `http://192.168.31.6:4000`
4. 老婆用顾客账号登录，你用商家账号登录

如果改成 Render 公网部署：

1. 你老婆的 iPhone 打开前端站点地址，例如 `https://beibei-dian-cai-web.onrender.com`
2. 你的安卓商家端把后端地址填成 `https://beibei-dian-cai-api.onrender.com`
3. 即使一个用蜂窝网络，一个用别的 Wi-Fi，也能同步订单

## 原生与前端命令

```bash
npm run lint
npm run build
npm run native:sync
npm run native:apk
npm run native:ipa
npm run native:android
npm run native:ios
```

含义：
- `native:sync`：重新构建前端并同步到 Android / iOS 原生工程
- `native:apk`：直接生成 Android 调试包
- `native:ipa`：尝试归档并导出 iPhone 真机安装产物
- `native:android`：同步后打开 Android Studio
- `native:ios`：同步后打开 Xcode

## 公网部署说明

本地模式：
- 不配置 `DATABASE_URL`
- 使用 `server/data/store.json`

Render / 云端模式：
- 配置 `DATABASE_URL`
- 自动切换到 Postgres
- 更适合你们两个不在同一个网络时一起使用
- 前端默认会优先使用 `https://beibei-dian-cai-api.onrender.com`

环境变量模板：

- `.env.example`

## 当前产物

- Android 调试包：
  `android/app/build/outputs/apk/debug/app-debug.apk`
- iOS 模拟器 App：
  `.xcode-derived/Build/Products/Debug-iphonesimulator/App.app`
- iOS 无签名归档：
  `.xcode-archives/BeibeiDianCai.xcarchive`

## iOS 现状

iOS 工程已经可以：
- 编译模拟器版本
- 在 iPhone 模拟器里启动
- 生成无签名归档

目前还不能直接导出 `.ipa`，因为这台机器还没有可用的 Apple 签名身份：

- `0 valid identities found`

也就是说，代码和构建环境已经基本打通，最后只差 Apple 开发者签名。

一旦你在 Xcode 里登录了 Apple 开发者账号并拿到签名身份，直接执行：

```bash
npm run native:ipa
```
