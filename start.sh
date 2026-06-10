#!/bin/bash

echo "🚀 每日任务管理系统 - 快速启动脚本"
echo "=================================="
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 未找到 .env 文件"
    echo "📝 请复制 .env.example 为 .env 并填写配置"
    echo ""
    echo "运行以下命令："
    echo "  cp .env.example .env"
    echo "  # 然后编辑 .env 文件"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 启动服务
echo "✅ 启动服务..."
echo ""
npm start
