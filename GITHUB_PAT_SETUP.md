# GitHub 个人访问令牌（PAT）配置指南

## 🎯 为什么需要 PAT？

GitHub 不再支持使用密码进行 Git 操作，需要使用个人访问令牌（Personal Access Token）。

---

## 🔑 生成 Personal Access Token

### 步骤1：访问 GitHub 设置

1. 登录 GitHub
2. 点击右上角头像 → **Settings**
3. 左侧菜单找到 **Developer settings**
4. 点击 **Personal access tokens** → **Tokens (classic)**

或者直接访问：
```
https://github.com/settings/tokens
```

### 步骤2：生成新令牌

1. 点击 **Generate new token** → **Generate new token (classic)**
2. 填写信息：
   - **Note:** `daily-task-dingtalk`（备注名称）
   - **Expiration:** 选择 `No expiration`（永久）或 `90 days`
3. **选择权限（Scopes）：**
   - ✅ **repo** - 完整仓库访问权限
   - ✅ **workflow** - 工作流权限（可选）
4. 点击页面底部的 **Generate token**

### 步骤3：复制令牌

⚠️ **重要：** 令牌只会显示一次！请立即复制并保存。

令牌格式类似：
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 💻 配置 Git 使用令牌

### 方法1：命令行配置（推荐）

在 PowerShell 中运行：

```powershell
cd "c:\Users\chenbing\Work Files\Qwork\daily-task-manager"

# 设置 Git 使用凭证存储
git config --global credential.helper store

# 推送代码（会提示输入用户名和令牌）
git push -u origin main
```

当提示输入时：
- **Username:** 你的 GitHub 用户名（simonshenda1980-lang）
- **Password:** 粘贴刚才复制的 Personal Access Token

### 方法2：直接在 URL 中包含令牌

```powershell
# 将 YOUR_TOKEN 替换为你的实际令牌
git remote set-url origin https://YOUR_TOKEN@github.com/simonshenda1980-lang/daily-task-dingtalk.git

# 推送
git push -u origin main
```

例如：
```powershell
git remote set-url origin https://ghp_abc123xyz@github.com/simonshenda1980-lang/daily-task-dingtalk.git
git push -u origin main
```

---

## ✅ 验证推送成功

推送完成后，访问：
```
https://github.com/simonshenda1980-lang/daily-task-dingtalk
```

应该能看到所有文件！

---

## 🔒 安全提示

1. **不要分享令牌** - 令牌等同于密码
2. **定期轮换** - 建议每 90 天更换一次
3. **最小权限** - 只授予必要的权限
4. **撤销令牌** - 如果怀疑泄露，立即在 GitHub 设置中撤销

---

##  常见问题

### Q1: 令牌丢失了怎么办？

**答：** 重新生成一个新的令牌，然后更新 Git 配置：
```bash
git remote set-url origin https://新令牌@github.com/用户名/仓库名.git
```

### Q2: 如何查看已生成的令牌？

**答：** GitHub 不显示完整令牌，只能看到最后几位字符。如果丢失，需要重新生成。

### Q3: 令牌过期了怎么办？

**答：** 重新生成新令牌，然后更新 Git 配置。

---

## 🚀 下一步

配置好令牌后，告诉我，我会帮你完成推送！
