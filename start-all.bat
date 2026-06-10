@echo off
echo ========================================
echo   每日任务管理系统 - 完整启动
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

echo [启动] 正在启动 Telegram Bot...
start "Telegram Bot" cmd /k "%NODE_PATH%\node.exe src/bot.js"

timeout /t 3 /nobreak >nul

echo [启动] 正在启动 Web 看板服务器...
start "Web Server" cmd /k "%NODE_PATH%\node.exe src/web-server.js"

echo.
echo ========================================
echo   ✅ 系统已启动！
echo ========================================
echo.
echo 📱 Telegram Bot - 后台运行中
echo  Web 看板 - http://localhost:3000
echo.
echo 提示：
echo 1. 在 Telegram 中搜索你的 Bot 并开始使用
echo 2. 浏览器访问 http://localhost:3000?telegram_id=你的ID
echo 3. 关闭这两个窗口即可停止服务
echo.
pause
