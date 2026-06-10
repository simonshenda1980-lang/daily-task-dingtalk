# 钉钉机器人配置指南

## 📱 第1步：创建钉钉机器人

### 方法1：企业内部群机器人（推荐）

1. **打开钉钉** → 进入任意群聊（或创建新群）
2. 点击右上角 **...** → **群设置**
3. 找到 **智能群助手** → **添加机器人**
4. 选择 **自定义机器人**
5. 设置机器人信息：
   - **机器人名称**：每日任务助手
   - **头像**：可选
6. **安全设置**（重要）：
   - 选择 **加签**（推荐）或 **关键词**
   - 如果选择"加签"，复制保存 **Secret**
7. 点击 **完成**
8. 复制 **Webhook 地址**（类似：`https://oapi.dingtalk.com/robot/send?access_token=xxx`）

### 方法2：企业内部应用机器人

1. 访问 [钉钉开放平台](https://open-dev.dingtalk.com)
2. 登录并创建企业内部应用
3. 启用机器人功能
4. 获取 Webhook 和 Secret

---

## ⚙️ 第2步：配置环境变量

编辑项目中的 `.env` 文件：

```env
# 钉钉机器人配置
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=你的TOKEN
DINGTALK_SECRET=你的SECRET（如果选择了加签方式）

# Supabase 配置
SUPABASE_URL=https://cfrrzcmzzrsvpaeewnkf.supabase.co
SUPABASE_KEY=你的SUPABASE_KEY

# 定时提醒配置（每天晚上9:30，格式：分钟 小时）
REMINDER_CRON=30 21

# Web 看板端口
WEB_PORT=3000

# 钉钉 Webhook 端口
DINGTALK_PORT=3001
```

---

## 🔗 第3步：配置内网穿透（重要！）

由于钉钉服务器需要访问你的本地服务，你需要使用**内网穿透工具**。

### 推荐方案：使用 frp 或 ngrok

#### 方案A：ngrok（最简单）

1. 下载 ngrok：https://ngrok.com/download
2. 注册账号并获取 auth token
3. 运行命令：
   ```bash
   ngrok http 3001
   ```
4. 复制生成的公网地址（如：`https://abc123.ngrok.io`）
5. 在钉钉机器人配置中，将 Webhook 地址改为：
   ```
   https://abc123.ngrok.io/webhook
   ```

#### 方案B：frp（免费自建）

1. 需要有公网服务器
2. 配置 frp 客户端转发 3001 端口
3. 在钉钉中使用 `http://你的域名:端口/webhook`

#### 方案C：花生壳/神卓互联（国内服务）

1. 注册花生壳等国内内网穿透服务
2. 配置映射到本地 3001 端口
3. 使用分配的域名配置钉钉 Webhook

---

## 🧪 第4步：测试连接

### 启动服务

双击运行 `start-dingtalk.bat` 或在命令行执行：

```powershell
cd "c:\Users\chenbing\Work Files\Qwork\daily-task-manager"
.\start-dingtalk.bat
```

### 发送测试消息

1. 在钉钉群中找到你创建的机器人
2. 发送消息：`测试`
3. 查看后台日志，应该显示：
   ```
   📨 收到钉钉消息: {...}
   ✅ 新用户注册: 你的名字 (dingtalk_id)
   ✅ 任务已添加: 测试
   📨 消息已发送到 dingtalk_id
   ```

### 测试命令

在钉钉中发送以下命令：

- `/start` - 欢迎消息
- `/help` - 查看帮助
- `/list` - 查看今日任务
- `/pending` - 查看未完成任务

---

## 🎯 第5步：日常使用

### 手机端操作

1. **添加任务**：
   - 打开钉钉群聊
   - 长按麦克风图标（语音输入）
   - 说出任务内容，自动转为文字
   - 发送给机器人

2. **查看任务**：
   - 发送 `/list` 查看今日所有任务
   - 发送 `/pending` 查看未完成任务

3. **标记完成**：
   - 访问 Web 看板（电脑端浏览器）
   - 点击任务旁的"完成"按钮

### 晚间提醒

- 每天晚上 9:30 自动推送未完成的任务列表
- 点击提醒中的链接访问 Web 看板
- 在 Web 看板中标记完成或延期

---

## ❓ 常见问题

### Q1: 钉钉机器人收不到消息？

**检查清单：**
1. ✅ 确认内网穿透工具正在运行
2. ✅ 确认钉钉 Webhook 地址正确（包含 `/webhook` 路径）
3. ✅ 确认本地服务正在运行（3001 端口）
4. ✅ 检查防火墙是否允许访问

### Q2: 如何在外网访问 Web 看板？

同样需要使用内网穿透，将 3000 端口暴露：

```bash
ngrok http 3000
```

然后在手机浏览器访问生成的地址。

### Q3: 定时提醒没有发送？

1. 检查 scheduler.js 是否在运行
2. 检查 DINGTALK_WEBHOOK 配置是否正确
3. 查看后台日志是否有错误信息

### Q4: 可以不用内网穿透吗？

**不可以。** 钉钉服务器必须能够访问到你的 Webhook 地址。

替代方案：
- 部署到云服务器（推荐 Render/Railway/Vercel）
- 使用公司内网有公网 IP 的服务器

---

## 🚀 进阶：部署到云端（推荐）

如果需要 24 小时稳定运行，建议部署到云端：

### 推荐平台

1. **Render**（免费）：https://render.com
2. **Railway**（免费额度）：https://railway.app
3. **Vercel**（适合 Serverless）：https://vercel.com

### 部署步骤

1. 将代码上传到 GitHub
2. 在云平台创建新项目
3. 配置环境变量
4. 部署后获得公网地址
5. 在钉钉中配置新的 Webhook 地址

---

## 📞 技术支持

遇到问题可以：
1. 查看后台日志输出
2. 检查 .env 配置是否正确
3. 确认钉钉机器人配置无误
4. 测试内网穿透是否正常
