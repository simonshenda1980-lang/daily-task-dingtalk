# 钉钉版每日任务管理系统 - 改造完成

## ✅ 改造内容

### 1. 核心架构变更

**从 Telegram Bot 改为钉钉机器人**

- ✅ 创建 `src/dingtalk-webhook.js` - 钉钉 Webhook 接收服务
- ✅ 更新 `src/database.js` - 支持钉钉用户 ID
- ✅ 更新 `src/scheduler.js` - 使用钉钉发送定时提醒
- ✅ 更新 `src/web-server.js` - API 支持钉钉用户查询
- ✅ 更新 `public/index.html` - Web 看板支持钉钉 ID

### 2. 数据库 Schema 更新

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telegram_id BIGINT UNIQUE,      -- 保留兼容
  dingtalk_id TEXT UNIQUE,        -- 新增钉钉 ID
  username TEXT,
  first_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. 配置文件更新

**.env 文件：**
```env
# 钉钉机器人配置
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN
DINGTALK_SECRET=YOUR_SECRET

# Supabase 配置（不变）
SUPABASE_URL=https://cfrrzcmzzrsvpaeewnkf.supabase.co
SUPABASE_KEY=...

# 定时提醒（晚上9:30）
REMINDER_CRON=30 21

# 端口配置
WEB_PORT=3000
DINGTALK_PORT=3001
```

### 4. 新增依赖

```bash
npm install axios  # 用于发送钉钉消息
```

### 5. 启动脚本

**start-dingtalk.bat** - 一键启动三个服务：
- 钉钉 Webhook 服务器（3001 端口）
- Web 看板服务器（3000 端口）
- 定时提醒服务

---

## 🎯 系统功能

### 手机端（钉钉）

1. **语音添加任务**
   - 长按麦克风图标说话
   - 自动转为文字发送给机器人
   - 收到确认回复

2. **查看任务**
   - `/list` - 今日所有任务
   - `/pending` - 未完成任务

3. **晚间提醒**
   - 每晚 9:30 自动推送
   - 显示未完成的任务列表
   - 提供 Web 看板链接

### 电脑端（Web 看板）

访问地址：`http://localhost:3000?dingtalk_id=你的ID`

功能：
- ✅ 查看今日任务列表
- ✅ 标记任务完成
- ✅ 延期任务到明天
- ✅ 实时统计完成率
- ✅ 每 30 秒自动刷新

---

## 📋 使用前准备清单

### 必须完成的步骤

- [ ] 1. 在钉钉中创建自定义机器人
- [ ] 2. 获取 Webhook 地址和 Secret
- [ ] 3. 安装内网穿透工具（ngrok）
- [ ] 4. 运行 ngrok 暴露 3001 端口
- [ ] 5. 在钉钉机器人配置 Webhook 地址
- [ ] 6. 填写 .env 配置文件
- [ ] 7. 运行 start-dingtalk.bat 启动服务
- [ ] 8. 在钉钉中发送测试消息

### 可选步骤

- [ ] 部署到云端服务器（推荐 Render/Railway）
- [ ] 配置开机自启动
- [ ] 自定义提醒时间

---

## 🔧 技术细节

### 钉钉消息格式

**接收消息：**
```json
{
  "msgtype": "text",
  "text": {
    "content": "今天要和客户开会"
  },
  "senderNick": "张三",
  "senderId": "user123"
}
```

**发送消息：**
```json
{
  "msgtype": "markdown",
  "markdown": {
    "title": "任务提醒",
    "text": "🌙 *晚间任务提醒*\n\n..."
  },
  "at": {
    "atUserIds": ["user123"],
    "isAtAll": false
  }
}
```

### 签名验证

如果钉钉机器人启用了"加签"安全设置：

```javascript
const timestamp = Date.now();
const stringToSign = `${timestamp}\n${secret}`;
const hmac = crypto.createHmac('sha256', secret);
const sign = hmac.update(stringToSign).digest('base64');
```

### 用户注册流程

1. 用户在钉钉中发送第一条消息
2. 后端根据 `senderId` 查找用户
3. 如果不存在，自动创建新用户
4. 将消息内容作为任务添加到数据库

---

## 🚀 快速开始

### 第1步：启动服务

```powershell
cd "c:\Users\chenbing\Work Files\Qwork\daily-task-manager"
.\start-dingtalk.bat
```

### 第2步：配置内网穿透

```bash
# 新开一个终端
ngrok http 3001
```

复制生成的地址，如：`https://abc123.ngrok.io`

### 第3步：配置钉钉机器人

1. 进入钉钉群设置 → 智能群助手
2. 找到你创建的机器人
3. 修改 Webhook 地址为：`https://abc123.ngrok.io/webhook`
4. 保存

### 第4步：测试

在钉钉中发送：`测试`

应该收到回复：
```
✅ 任务已添加

📝 测试

💡 提示：今晚 9:30 会提醒你未完成的任务
```

### 第5步：访问 Web 看板

浏览器打开：`http://localhost:3000?dingtalk_id=你的ID`

（你的 ID 可以在后台日志中看到）

---

## ❓ 常见问题

### Q1: 钉钉机器人收不到消息？

**检查：**
1. ngrok 是否在运行？
2. 钉钉 Webhook 地址是否正确？（必须是 ngrok 地址 + `/webhook`）
3. 本地服务是否启动？（3001 端口）
4. 防火墙是否阻止访问？

### Q2: 如何获取我的钉钉 ID？

查看后台日志，当你第一次发送消息时，会显示：
```
✅ 新用户注册: 你的名字 (dingtalk_id)
```

这个 `dingtalk_id` 就是你的用户 ID。

### Q3: Web 看板显示"用户不存在"？

确保 URL 中包含正确的参数：
```
http://localhost:3000?dingtalk_id=你的ID
或
http://localhost:3000?user_id=你的ID
```

### Q4: 可以不用内网穿透吗？

**不可以。** 钉钉服务器必须能访问到你的 Webhook 地址。

替代方案：
- 部署到云服务器（Render/Railway/Vercel）
- 使用公司有公网 IP 的服务器

### Q5: 定时提醒没有发送？

1. 检查 scheduler.js 是否在运行
2. 确认 DINGTALK_WEBHOOK 配置正确
3. 查看后台日志是否有错误

---

## 📊 系统架构图

```
┌─────────────┐
│  钉钉 App   │ ← 语音/文字输入
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  钉钉机器人      │ ← Webhook
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 钉钉 Webhook     │ ← 3001 端口
│ 服务器           │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Supabase        │ ← 云端数据库
│  数据库          │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Web 看板        │ ← 3000 端口
│  服务器          │
└──────┬───────────┘
       │
       ▼
┌─────────────┐
│  浏览器     │ ← 查看和管理任务
└─────────────┘

       ┌──────────────────┐
       │  定时提醒服务    │ ← 每天 21:30
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │  钉钉机器人      │ ← 推送提醒
       └──────────────────┘
```

---

## 🎉 完成！

系统已经完全改造为钉钉版本，所有功能都已就绪。

**下一步：**
1. 按照 `DINGTALK_QUICKSTART.md` 进行配置
2. 测试基本功能
3. 开始日常使用

如有问题，请查看详细文档或检查后台日志。
