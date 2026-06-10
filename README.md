# 每日任务管理系统 - 部署指南

## 📱 系统概述

这是一个跨平台的每日任务管理系统，支持：
- **手机端（iPhone）**：通过 Telegram Bot 添加任务（文字/语音）
- **工作电脑（Windows）**：通过 Web 看板查看和管理任务
- **自动提醒**：每晚定时推送未完成任务提醒

---

## 🚀 快速开始（5步完成部署）

### 第1步：注册 Telegram Bot

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示设置 Bot 名称（如：DailyTaskBot）
4. 复制获得的 **Bot Token**（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 第2步：创建 Supabase 数据库

1. 访问 [https://supabase.com](https://supabase.com) 注册账号
2. 点击 "New Project" 创建新项目
3. 等待数据库初始化完成（约2分钟）
4. 进入项目后，点击左侧 "SQL Editor"
5. 复制 `database/schema.sql` 文件内容并执行
6. 获取配置信息：
   - 点击左侧 "Settings" → "API"
   - 复制 **Project URL**（SUPABASE_URL）
   - 复制 **anon public** key（SUPABASE_KEY）

### 第3步：配置环境变量

1. 在项目根目录复制 `.env.example` 为 `.env`
2. 填写配置信息：

```env
TELEGRAM_BOT_TOKEN=你的_bot_token
SUPABASE_URL=你的_supabase_url
SUPABASE_KEY=你的_supabase_key
REMINDER_CRON=0 20
WEB_PORT=3000
```

### 第4步：安装依赖并运行

```bash
# 进入项目目录
cd daily-task-manager

# 安装依赖
npm install

# 启动服务
npm start
```

你会看到：
```
✅ Telegram Bot 已启动
⏰ 定时提醒已设置：每天 20:0 执行
🌐 Web 看板运行在 http://localhost:3000
```

### 第5步：测试使用

#### 手机端（iPhone）：
1. 在 Telegram 中搜索你的 Bot 名称
2. 发送 `/start` 开始使用
3. 直接发送文字消息添加任务
4. 使用 iOS 键盘麦克风图标进行语音输入

#### 工作电脑（Windows）：
1. 打开浏览器访问：`http://localhost:3000?telegram_id=你的TelegramID`
2. 首次访问会提示输入 Telegram ID（数字）
3. 如何获取 Telegram ID：
   - 在 Telegram 中搜索 `@userinfobot`
   - 发送任意消息，它会回复你的 ID

---

## 🌐 部署到云端（推荐）

为了让 Bot 24小时运行，建议部署到云平台。

### 方案A：部署到 Vercel（最简单）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel deploy --prod
```

**注意**：Vercel 适合 Web 看板，但 Bot 需要长连接，建议使用方案B。

### 方案B：部署到 Render（推荐用于 Bot）

1. 访问 [https://render.com](https://render.com) 注册
2. 点击 "New +" → "Web Service"
3. 连接你的 GitHub 仓库
4. 配置：
   - **Name**: daily-task-bot
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: 添加 .env 中的所有变量
5. 点击 "Create Web Service"
6. 等待部署完成，获得公网 URL

### 方案C：部署到 Railway

1. 访问 [https://railway.app](https://railway.app) 注册
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. 添加环境变量
5. 自动部署

---

## 📖 使用指南

### Telegram Bot 命令

| 命令 | 功能 | 示例 |
|------|------|------|
| `/start` | 开始使用 | `/start` |
| `/help` | 显示帮助 | `/help` |
| `/list` | 查看今日所有任务 | `/list` |
| `/pending` | 查看未完成任务 | `/pending` |
| `/add` | 添加任务 | `/add 买牛奶` |

### 快速操作

晚间提醒时会收到任务列表，可以：
- 回复 `1 完成` - 标记第1个任务完成
- 回复 `2 延期` - 将第2个任务延期到明天
- 回复 `全部延期` - 所有任务延期
- 点击按钮 ✅ 或 ⏸️ 快速操作

### Web 看板功能

- 📊 实时统计：总任务、已完成、待完成
- ✅ 一键完成：点击"完成"按钮
- ⏸️ 延期任务：点击"延期"按钮
- 🔄 自动刷新：每30秒自动更新
- 📱 响应式设计：支持手机/平板/电脑

---

## 🔧 高级配置

### 修改提醒时间

编辑 `.env` 文件：

```env
# 格式：分钟 小时
# 每天早上9点提醒
REMINDER_CRON=0 9

# 每天晚上10点提醒
REMINDER_CRON=0 22
```

Cron 表达式参考：
- `0 8` - 早上8点
- `30 18` - 下午6点30分
- `0 20` - 晚上8点（默认）

### 自定义 Web 端口

```env
WEB_PORT=8080
```

---

## ❓ 常见问题

### Q1: Bot 没有响应？
**A:** 检查：
1. TELEGRAM_BOT_TOKEN 是否正确
2. 服务器是否正常运行
3. 网络连接是否正常

### Q2: Web 看板无法加载？
**A:** 检查：
1. 服务器是否在运行（`npm start`）
2. 浏览器访问地址是否正确
3. Telegram ID 是否输入正确

### Q3: 定时提醒没有发送？
**A:** 检查：
1. REMINDER_CRON 配置是否正确
2. 服务器时区设置
3. 查看控制台日志

### Q4: 如何在多个设备同步？
**A:** 所有数据存储在 Supabase 云端，只要使用同一个 Telegram 账号，所有设备自动同步。

### Q5: 公司电脑无法访问 localhost？
**A:** 如果部署到云端，使用云平台的公网 URL 替代 `http://localhost:3000`

---

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **Bot**: node-telegram-bot-api
- **数据库**: Supabase (PostgreSQL)
- **定时任务**: node-cron
- **前端**: 原生 HTML/CSS/JavaScript
- **部署**: Vercel / Render / Railway

---

## 📞 技术支持

遇到问题？检查：
1. 控制台日志是否有错误
2. .env 配置是否正确
3. Supabase 数据库表是否创建成功
4. Telegram Bot Token 是否有效

---

## 🎉 开始使用

现在你已经完成了所有配置，开始享受高效的任务管理吧！

**记住：**
- 📱 手机随时添加任务
- 🌙 晚间自动提醒
- 💻 电脑大屏查看
- ☁️ 数据云端同步

祝你工作效率倍增！🚀
