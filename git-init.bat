@echo off
echo ========================================
echo   钉钉任务系统 - Git 初始化脚本
echo ========================================
echo.

REM 检查是否已经初始化
if exist .git (
    echo [提示] Git 仓库已存在
    echo.
    goto :check_remote
)

echo [1/3] 初始化 Git 仓库...
git init
if errorlevel 1 (
    echo [错误] Git 初始化失败，请确认已安装 Git
    pause
    exit /b 1
)
echo ✅ Git 仓库初始化成功
echo.

echo [2/3] 添加文件...
git add .
echo ✅ 文件已添加到暂存区
echo.

echo [3/3] 提交代码...
set /p commit_msg="请输入提交信息（直接回车使用默认信息）: "
if "%commit_msg%"=="" set commit_msg=Initial commit: DingTalk task management system

git commit -m "%commit_msg%"
if errorlevel 1 (
    echo [错误] 提交失败
    pause
    exit /b 1
)
echo ✅ 代码已提交
echo.

:check_remote
REM 检查是否配置了远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ========================================
    echo   下一步：创建 GitHub 仓库并推送
    echo ========================================
    echo.
    echo 1. 访问 https://github.com/new 创建新仓库
    echo 2. 仓库名称建议：daily-task-dingtalk
    echo 3. 选择 Public（公开）
    echo 4. 点击 Create repository
    echo.
    echo 创建完成后，运行以下命令推送代码：
    echo.
    echo git remote add origin https://github.com/你的用户名/daily-task-dingtalk.git
    echo git branch -M main
    echo git push -u origin main
    echo.
    pause
) else (
    echo ========================================
    echo   Git 仓库已配置远程地址
    echo ========================================
    echo.
    echo 远程仓库地址：
    git remote get-url origin
    echo.
    echo 如需推送代码，运行：
    echo git push
    echo.
    pause
)
