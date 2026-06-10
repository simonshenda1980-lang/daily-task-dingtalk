import cron from 'node-cron';
import { supabase } from './database.js';
import axios from 'axios';
import crypto from 'crypto';

// 定时提醒任务
export function startReminderScheduler() {
  const cronExpression = process.env.REMINDER_CRON || '30 21'; // 默认晚上9:30
  
  console.log(`⏰ 定时提醒已设置：每天 ${cronExpression.split(' ')[1]}:${cronExpression.split(' ')[0]} 执行`);

  // 每天定时执行
  cron.schedule(`${cronExpression} * * *`, async () => {
    console.log('🔔 开始发送晚间提醒...');
    await sendEveningReminder();
  });
}

// 发送晚间提醒
async function sendEveningReminder() {
  try {
    // 获取所有用户
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;

    console.log(`找到 ${users.length} 个用户`);

    // 为每个用户发送提醒
    for (const user of users) {
      await sendReminderToUser(user);
    }

    console.log('✅ 晚间提醒发送完成');
  } catch (error) {
    console.error('❌ 发送晚间提醒失败:', error);
  }
}

// 向单个用户发送提醒
async function sendReminderToUser(user) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 获取今日未完成任务
    const { data: pendingTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', today)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!pendingTasks || pendingTasks.length === 0) {
      // 没有未完成任务，发送鼓励消息
      await sendDingTalkMessage(
        user.dingtalk_id,
        '🎉 太棒了！今日所有任务已完成！\n\n好好休息，明天继续加油！💪'
      );
      return;
    }

    // 构建提醒消息
    let message = `🌙 *晚间任务提醒*\n\n`;
    message += `今天还有 ${pendingTasks.length} 个任务未完成：\n\n`;

    pendingTasks.forEach((task, index) => {
      message += `${index + 1}. ${task.content}\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━\n`;
    message += `💡 *如何操作：*\n`;
    message += `• 访问 Web 看板标记完成或延期\n`;
    message += `• Web 地址：http://localhost:3000?user_id=${user.dingtalk_id}\n`;

    // 发送消息
    await sendDingTalkMessage(user.dingtalk_id, message);

    console.log(`✓ 已向用户 ${user.dingtalk_id} 发送提醒`);
  } catch (error) {
    console.error(`向用户 ${user.dingtalk_id} 发送提醒失败:`, error);
  }
}

// 发送钉钉消息
async function sendDingTalkMessage(dingTalkId, message) {
  try {
    const webhook = process.env.DINGTALK_WEBHOOK;
    if (!webhook) {
      console.warn('⚠️ 未配置 DINGTALK_WEBHOOK');
      return;
    }

    const payload = {
      msgtype: 'text',
      text: {
        content: message
      },
      at: {
        atUserIds: [dingTalkId],
        isAtAll: false
      }
    };

    // 如果有 secret，需要添加签名
    if (process.env.DINGTALK_SECRET) {
      const timestamp = Date.now();
      const sign = generateSign(timestamp, process.env.DINGTALK_SECRET);
      
      await axios.post(`${webhook}&timestamp=${timestamp}&sign=${sign}`, payload);
    } else {
      await axios.post(webhook, payload);
    }
  } catch (error) {
    console.error('发送钉钉消息错误:', error);
  }
}

// 生成钉钉签名
function generateSign(timestamp, secret) {
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret);
  return encodeURIComponent(hmac.update(stringToSign).digest('base64'));
}


