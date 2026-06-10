@echo off
echo ========================================
echo   每日任务管理系统 - 快速启动（便携版）
echo ========================================
echo.

REM 设置 Node.js 路径
set NODE_PATH=C:\Users\chenbing\nodejs\node-v20.11.0-win-x64
set PATH=%NODE_PATH%;%PATH%

REM 检查 .env 文件
if not exist .env (
    echo [错误] 未找到 .env 文件
    echo.
    echo 请复制 .env.example 为 .env 并填写配置
    echo.
    pause
    exit /b 1
)

REM 检查依赖
if not exist node_modules (
    echo [安装] 正在安装依赖...
    call npm install
    echo.
)

REM 启动服务
echo [启动] 正在启动服务...
echo.
call npm start

pause
