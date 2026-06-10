@echo off
echo ========================================
echo   每日任务管理系统 - 钉钉版启动
echo ========================================
echo.

REM 设置 Node.js 路径
set NODE_PATH=C:\Users\chenbing\nodejs\node-v20.11.0-win-x64
set PATH=%NODE_PATH%;%PATH%

REM 检查 .env 文件
if not exist .env (
    echo [错误] 未找到 .env 文件
    echo.
    pause
    exit /b 1
)

echo [启动] 正在启动钉钉 Webhook 服务器...
start "DingTalk Webhook" cmd /k "%NODE_PATH%\node.exe src/dingtalk-webhook.js"

timeout /t 3 /nobreak >nul

echo [启动] 正在启动 Web 看板服务器...
start "Web Server" cmd /k "%NODE_PATH%\node.exe src/web-server.js"

timeout /t 3 /nobreak >nul

echo [启动] 正在启动定时提醒服务...
start "Scheduler" cmd /k "%NODE_PATH%\node.exe src/scheduler.js"

echo.
echo ========================================
echo   ✅ 系统已启动！
echo ========================================
echo.
echo 📱 钉钉 Webhook: http://localhost:3001/webhook
echo 🌐 Web 看板:    http://localhost:3000
echo ⏰ 定时提醒:    每天 21:30
echo.
echo 请在钉钉机器人中配置 Webhook 地址
echo （如果在外网访问，需要使用内网穿透工具）
echo.
pause
