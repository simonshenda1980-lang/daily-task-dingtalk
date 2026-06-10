# 部署到云端 - 使用手机热点方案

##  为什么需要切换网络？

你的办公室网络限制了以下访问：
-  Telegram 服务器
- ❌ ngrok 服务器  
- ❌ localtunnel 服务器
- ❌ GitHub.com
- ❌ Vercel/Railway/Render 等云平台

**解决方案：** 临时切换到手机热点，完成部署后切回公司网络。

---

## 🚀 完整部署步骤

### 第1步：切换到手机热点（5分钟）

1. **手机开启热点**
   - iPhone：设置 → 个人热点 → 开启
   - Android：设置 → 网络和互联网 → 热点和网络共享 → 开启

2. **电脑连接手机热点**
   - Windows：点击右下角 WiFi 图标 → 选择你的手机热点 → 连接

3. **测试网络连接**
   - 打开浏览器访问 `github.com`
   - 如果能正常打开，说明切换成功 ✅

---

### 第2步：初始化 Git 并推送到 GitHub（5分钟）

#### 2.1 配置 Git（如果还没配置）

```powershell
cd "c:\Users\chenbing\Work Files\Qwork\daily-task-manager"

# 设置用户名和邮箱（替换成你的）
git config --global user.name "你的名字"
git config --global user.email "your-email@example.com"
```

#### 2.2 初始化 Git 仓库

```powershell
# 初始化仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: DingTalk task management system"
```

#### 2.3 创建 GitHub 仓库

1. 访问 [github.com](https://github.com)
2. 点击右上角 **+** → **New repository**
3. 填写信息：
   - Repository name: `daily-task-dingtalk`
   - Description: 钉钉每日任务管理系统
   - 选择 **Public**
4. 点击 **Create repository**

#### 2.4 推送代码到 GitHub

复制 GitHub 提供的命令（类似这样）：

```powershell
# 添加远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/你的用户名/daily-task-dingtalk.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

### 第3步：部署到 Railway（推荐）或 Render（10分钟）

#### 选项A：Railway（推荐，支持定时任务）

1. **注册 Railway**
   - 访问：[railway.app](https://railway.app)
   - 用 GitHub 账号登录

2. **创建新项目**
   - 点击 **New Project**
   - 选择 **Deploy from GitHub repo**
   - 选择 `daily-task-dingtalk` 仓库

3. **配置环境变量**
   
   在 Railway 项目设置中，添加以下环境变量：
   
   ```
   SUPABASE_URL=https://cfrrzcmzzrsvpaeewnkf.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（你的 Supabase Key）
   DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN
   DINGTALK_SECRET=YOUR_SECRET（如果有）
   REMINDER_CRON=30 21
   WEB_PORT=3000
   DINGTALK_PORT=3001
   ```

4. **等待部署完成**
   - Railway 会自动检测 Node.js 项目
   - 安装依赖并启动服务
   - 大约需要 2-5 分钟

5. **获取公网 URL**
   - 部署完成后，Railway 会分配一个域名
   - 例如：`https://daily-task-dingtalk-production.up.railway.app`

#### 选项B：Render（备选）

1. **注册 Render**
   - 访问：[render.com](https://render.com)
   - 用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 **New** → **Web Service**
   - 选择 `daily-task-dingtalk` 仓库
   - 填写：
     - Name: `daily-task-dingtalk`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node src/dingtalk-webhook.js`

3. **配置环境变量**（同 Railway）

4. **等待部署完成**

---

### 第4步：配置钉钉机器人（2分钟）

1. **进入钉钉群设置**
   - 打开钉钉群聊
   - 点击右上角 **...** → **群设置**
   - 找到 **智能群助手**

2. **修改 Webhook 地址**
   - 找到你创建的机器人
   - 将 Webhook 地址改为 Railway/Render 的 URL + `/webhook`
   
   例如：
   ```
   https://daily-task-dingtalk-production.up.railway.app/webhook
   ```

3. **保存配置**

---

### 第5步：测试（2分钟）

1. **在钉钉中发送测试消息**
   ```
   测试
   ```

2. **应该收到回复**
   ```
   ✅ 任务已添加
   
   📝 测试
   
   💡 提示：今晚 9:30 会提醒你未完成的任务
   ```

3. **测试命令**
   - 发送 `/help` 查看帮助
   - 发送 `/list` 查看任务列表

---

### 第6步：切回公司网络（1分钟）

部署完成后：
1. 电脑断开手机热点
2. 重新连接公司 WiFi
3. 一切正常工作！✅

**重要：** 部署到云端后，钉钉和公司电脑都能通过公网 URL 访问服务，不再受公司网络限制。

---

## 🎉 完成！

现在你的系统已经：
- ✅ 运行在云端（24小时稳定）
- ✅ 不受公司网络限制
- ✅ 钉钉可以直接访问
- ✅ Web 看板可以通过公网 URL 访问

---

##  访问地址

### 钉钉 Webhook
```
https://你的域名.railway.app/webhook
```

### Web 看板
```
https://你的域名.railway.app?dingtalk_id=你的ID
```

### 定时提醒
- 每晚 9:30 自动推送
- 通过钉钉发送提醒消息

---

##  常见问题

### Q1: Railway 免费额度够用吗？

**答：** Railway 提供 $5/月的免费额度，对于个人使用完全足够。
- 预计每月消耗：$1-2
- 如果超出，可以绑定信用卡升级

### Q2: 需要保持电脑开机吗？

**答：** 不需要！服务运行在云端，24小时在线。

### Q3: 如何更新代码？

**答：** 
1. 在本地修改代码
2. `git add . && git commit -m "更新说明"`
3. `git push`
4. Railway 会自动重新部署

### Q4: 如果 Railway 不可用怎么办？

**答：** 可以使用以下替代平台：
- **Render** - render.com（免费版有限制）
- **Fly.io** - fly.io（有免费额度）
- **Heroku** - heroku.com（需要信用卡）

---

## 📞 需要帮助？

如果在部署过程中遇到问题：
1. 检查 Railway/Render 的部署日志
2. 确认环境变量配置正确
3. 查看钉钉机器人配置是否正确
4. 测试 Webhook 地址是否可以访问

祝你部署顺利！
