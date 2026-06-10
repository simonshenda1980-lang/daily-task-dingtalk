# 钉钉版每日任务管理系统 - 快速开始

## 🎯 系统架构

```
手机端（钉钉）→ 钉钉机器人 → 后端服务 → Supabase 数据库
                                    ↓
电脑端（浏览器）← Web 看板 ←──────┘
```

---

## 📋 使用前准备

### 1. 创建钉钉机器人（5分钟）

1. 打开钉钉，进入任意群聊
2. 点击右上角 **...** → **群设置**
3. 找到 **智能群助手** → **添加机器人**
4. 选择 **自定义机器人**
5. 设置名称：**每日任务助手**
6. **安全设置**：选择"加签"，复制 Secret
7. 复制 **Webhook 地址**

### 2. 配置内网穿透（必须！）

由于钉钉服务器需要访问你的本地服务，必须使用内网穿透。

**推荐方案：ngrok**

```bash
# 下载 ngrok: https://ngrok.com/download
# 运行命令
ngrok http 3001
```

会生成类似这样的地址：`https://abc123.ngrok.io`

### 3. 填写配置文件

编辑 `.env` 文件：

```env
# 钉钉机器人配置
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=你的TOKEN
DINGTALK_SECRET=你的SECRET

# Supabase 配置（已配置好，无需修改）
SUPABASE_URL=https://cfrrzcmzzrsvpaeewnkf.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 定时提醒（每天晚上9:30）
REMINDER_CRON=30 21

# 端口配置
WEB_PORT=3000
DINGTALK_PORT=3001
```

**重要：** 在钉钉机器人配置中，将 Webhook 地址改为 ngrok 生成的地址 + `/webhook`

例如：`https://abc123.ngrok.io/webhook`

---

## 🚀 启动系统

### 方法1：一键启动（推荐）

双击运行 `start-dingtalk.bat`

会自动启动三个服务：
- 钉钉 Webhook 服务器（3001 端口）
- Web 看板服务器（3000 端口）
- 定时提醒服务（后台运行）

### 方法2：手动启动

```powershell
cd "c:\Users\chenbing\Work Files\Qwork\daily-task-manager"

# 启动钉钉 Webhook 服务器
C:\Users\chenbing\nodejs\node-v20.11.0-win-x64\node.exe src/dingtalk-webhook.js

# 启动 Web 看板（新开一个窗口）
C:\Users\chenbing\nodejs\node-v20.11.0-win-x64\node.exe src/web-server.js

# 启动定时提醒（新开一个窗口）
C:\Users\chenbing\nodejs\node-v20.11.0-win-x64\node.exe src/scheduler.js
```

---

## 📱 日常使用流程

### 早上：添加任务

**方式1：语音输入（最方便）**
1. 打开钉钉群聊
2. 长按麦克风图标
3. 说出任务："今天要和客户开会"
4. 发送给机器人
5. 收到回复：✅ 任务已添加

**方式2：文字输入**
直接在钉钉中输入任务内容并发送

### 中午：查看进度

在钉钉中发送命令：
- `/list` - 查看今日所有任务
- `/pending` - 查看未完成任务

### 晚上：处理提醒

**时间：** 每天晚上 9:30 自动推送

**提醒内容：**
```
🌙 晚间任务提醒

今天还有 3 个任务未完成：

1. 和客户开会
2. 完成项目报告
3. 回复邮件

━━━━━━━━━━━━━━━━
💡 如何操作：
• 访问 Web 看板标记完成或延期
• Web 地址：http://localhost:3000?user_id=你的ID
```

**操作方式：**
1. 点击链接打开 Web 看板
2. 勾选已完成的任务
3. 将未完成的任务延期到明天

---

## 🌐 Web 看板功能

访问地址：`http://localhost:3000?telegram_id=你的钉钉ID`

### 功能说明

1. **查看今日任务**
   - 显示所有任务列表
   - 标注完成状态

2. **标记完成**
   - 点击"完成"按钮
   - 任务变为绿色

3. **延期任务**
   - 点击"延期"按钮
   - 任务自动移到明天

4. **统计数据**
   - 今日任务总数
   - 已完成数量
   - 完成率

---

## 💡 常用命令

在钉钉中发送以下命令：

| 命令 | 功能 |
|------|------|
| `/start` | 欢迎消息 |
| `/help` | 查看帮助 |
| `/list` | 今日所有任务 |
| `/pending` | 未完成任务 |

---

## ❓ 常见问题

### Q1: 钉钉机器人没有反应？

**检查步骤：**
1. ✅ ngrok 是否在运行？
2. ✅ 钉钉 Webhook 地址是否正确？（必须是 ngrok 地址 + `/webhook`）
3. ✅ 本地服务是否启动？（3001 端口）
4. ✅ 查看后台日志是否有错误

### Q2: 如何在外网访问 Web 看板？

同样使用 ngrok 暴露 3000 端口：

```bash
ngrok http 3000
```

然后在手机浏览器访问生成的地址。

### Q3: 可以不用内网穿透吗？

**不可以。** 钉钉服务器必须能访问到你的服务。

替代方案：
- 部署到云服务器（Render/Railway）
- 使用公司有公网 IP 的服务器

### Q4: 定时提醒没收到？

1. 检查 scheduler.js 是否在运行
2. 确认 DINGTALK_WEBHOOK 配置正确
3. 查看后台日志

---

## 🎉 开始使用

1. ✅ 创建钉钉机器人
2. ✅ 配置内网穿透（ngrok）
3. ✅ 填写 .env 配置
4. ✅ 运行 start-dingtalk.bat
5. ✅ 在钉钉中测试发送消息

祝你使用愉快！如有问题请查看详细文档 `DINGTALK_SETUP.md`
