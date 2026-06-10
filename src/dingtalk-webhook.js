import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import { userDB, taskDB } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.DINGTALK_PORT || 3001;

// 中间件
app.use(express.json());

// 验证钉钉签名
function verifyDingTalkSignature(timestamp, sign) {
  const secret = process.env.DINGTALK_SECRET;
  if (!secret) return false;

  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret);
  const result = hmac.update(stringToSign).digest('base64');
  
  return result === sign;
}

// 钉钉 Webhook 接收端点
app.post('/webhook', async (req, res) => {
  try {
    const { msgtype, text, senderNick, senderId } = req.body;

    // 验证签名（如果配置了 secret）
    const timestamp = req.query.timestamp;
    const sign = req.query.sign;
    
    if (process.env.DINGTALK_SECRET && timestamp && sign) {
      if (!verifyDingTalkSignature(timestamp, sign)) {
        console.log('❌ 签名验证失败');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    console.log('📨 收到钉钉消息:', JSON.stringify(req.body, null, 2));

    // 处理文本消息
    if (msgtype === 'text' && text && text.content) {
      const content = text.content.trim();
      const dingtalkId = senderId || 'unknown';
      const username = senderNick || '用户';

      // 注册或获取用户
      let user = await userDB.findByDingTalkId(dingtalkId);
      if (!user) {
        user = await userDB.create(null, username, username, dingtalkId);
        console.log(`✅ 新用户注册: ${username} (${dingtalkId})`);
      }

      // 处理命令
      if (content.startsWith('/')) {
        await handleCommand(content, user, dingtalkId);
      } else {
        // 普通消息作为任务添加
        await handleAddTask(content, user, dingtalkId);
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('❌ 处理钉钉消息错误:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 处理命令
async function handleCommand(command, user, dingtalkId) {
  switch (command) {
    case '/start':
      await sendDingTalkMessage(
        dingtalkId,
        `🎉 欢迎使用每日任务管理系统！\n\n` +
        `💡 使用方法：\n` +
        `• 直接发送文字/语音添加任务\n` +
        `• /list - 查看今日任务\n` +
        `• /pending - 查看未完成任务\n` +
        `• /help - 查看帮助`
      );
      break;

    case '/help':
      await sendDingTalkMessage(
        dingtalkId,
        `📖 使用帮助\n\n` +
        `添加任务：直接发送文字或语音\n` +
        `/list - 查看今日所有任务\n` +
        `/pending - 查看未完成任务\n` +
        `/complete <序号> - 标记任务完成\n` +
        `/postpone <序号> - 延期到明天\n\n` +
        `每晚 9:30 会自动提醒未完成任务`
      );
      break;

    case '/list':
      const todayTasks = await taskDB.getByDate(user.id, new Date().toISOString().split('T')[0]);
      if (todayTasks.length === 0) {
        await sendDingTalkMessage(dingtalkId, '📋 今日暂无任务');
      } else {
        let message = `📋 今日任务 (${todayTasks.length}个)\n\n`;
        todayTasks.forEach((task, index) => {
          const status = task.status === 'completed' ? '✅' : '⏳';
          message += `${index + 1}. ${status} ${task.content}\n`;
        });
        await sendDingTalkMessage(dingtalkId, message);
      }
      break;

    case '/pending':
      const pendingTasks = await taskDB.getPendingByDate(user.id, new Date().toISOString().split('T')[0]);
      if (pendingTasks.length === 0) {
        await sendDingTalkMessage(dingtalkId, '✨ 太棒了！没有待办任务');
      } else {
        let message = `⏳ 待办任务 (${pendingTasks.length}个)\n\n`;
        pendingTasks.forEach((task, index) => {
          message += `${index + 1}. ${task.content}\n`;
        });
        await sendDingTalkMessage(dingtalkId, message);
      }
      break;

    default:
      await sendDingTalkMessage(dingtalkId, '❓ 未知命令，输入 /help 查看帮助');
  }
}

// 处理添加任务
async function handleAddTask(content, user, dingtalkId) {
  try {
    const task = await taskDB.create(user.id, content);
    console.log(`✅ 任务已添加: ${content}`);
    
    await sendDingTalkMessage(
      dingtalkId,
      `✅ 任务已添加\n\n` +
      `📝 ${content}\n\n` +
      `💡 提示：今晚 9:30 会提醒你未完成的任务`
    );
  } catch (error) {
    console.error('❌ 添加任务失败:', error);
    await sendDingTalkMessage(dingtalkId, '❌ 添加任务失败，请重试');
  }
}

// 发送钉钉消息
async function sendDingTalkMessage(dingtalkId, message) {
  try {
    const webhookUrl = process.env.DINGTALK_WEBHOOK;
    if (!webhookUrl) {
      console.warn('⚠️ 未配置 DINGTALK_WEBHOOK，无法发送消息');
      return;
    }

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: '任务提醒',
        text: message
      },
      at: {
        atUserIds: [dingtalkId],
        isAtAll: false
      }
    };

    await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📨 消息已发送到 ${dingtalkId}`);
  } catch (error) {
    console.error('❌ 发送钉钉消息失败:', error.message);
  }
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🔗 钉钉 Webhook 服务器运行在 http://localhost:${PORT}/webhook`);
  console.log(`📱 请在钉钉机器人中配置此地址`);
});
