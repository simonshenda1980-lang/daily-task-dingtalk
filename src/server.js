import express from 'express';
import cron from 'node-cron';
import crypto from 'crypto';
import axios from 'axios';
import { userDB, taskDB } from './database.js';
import { supabase } from './database.js';

const app = express();
app.use(express.json());

// ==================== 配置 ====================
const DINGTALK_PORT = process.env.DINGTALK_PORT || 3001;
const WEB_PORT = process.env.WEB_PORT || 3000;
const REMINDER_CRON = process.env.REMINDER_CRON || '30 21';

// ==================== 钉钉签名验证 ====================
function verifyDingTalkSignature(timestamp, sign) {
  const secret = process.env.DINGTALK_SECRET;
  if (!secret) return true;
  
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret);
  const result = hmac.update(stringToSign).digest('base64');
  return result === sign;
}

// ==================== 发送钉钉消息 ====================
async function sendDingTalkMessage(dingTalkId, message) {
  const webhook = process.env.DINGTALK_WEBHOOK;
  if (!webhook) {
    console.error(' DINGTALK_WEBHOOK 未配置');
    return;
  }

  const payload = {
    msgtype: 'text',
    text: { content: message },
    at: { atUserIds: [dingTalkId], isAtAll: false }
  };

  try {
    let url = webhook;
    if (process.env.DINGTALK_SECRET) {
      const timestamp = Date.now();
      const sign = generateSign(timestamp, process.env.DINGTALK_SECRET);
      url = `${webhook}&timestamp=${timestamp}&sign=${sign}`;
    }
    
    await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ 钉钉消息已发送给 ${dingTalkId}`);
  } catch (error) {
    console.error('❌ 发送钉钉消息失败:', error.message);
  }
}

function generateSign(timestamp, secret) {
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(stringToSign).digest('base64');
}

// ==================== 处理命令 ====================
async function handleCommand(content, user, dingtalkId) {
  const cmd = content.split(' ')[0].toLowerCase();
  
  if (cmd === '/help') {
    await sendDingTalkMessage(dingtalkId, getHelpMessage());
  } else if (cmd === '/today') {
    await showTodayTasks(user, dingtalkId);
  } else if (cmd === '/list') {
    await listAllTasks(user, dingtalkId);
  } else {
    await sendDingTalkMessage(dingtalkId, `❌ 未知命令: ${content}\n\n输入 /help 查看帮助`);
  }
}

function getHelpMessage() {
  return `📋 *任务管理助手*

可用命令：
• /today - 查看今日任务
• /list - 查看所有任务
• /help - 显示此帮助

直接发送文本即可添加新任务！`;
}

async function showTodayTasks(user, dingtalkId) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('task_date', today)
    .order('created_at', { ascending: true });

  if (error) {
    await sendDingTalkMessage(dingtalkId, `❌ 查询失败: ${error.message}`);
    return;
  }

  if (!tasks || tasks.length === 0) {
    await sendDingTalkMessage(dingtalkId, '📝 今日暂无任务\n\n直接发送文本添加任务！');
    return;
  }

  let message = ` *今日任务 (${today})*\n\n`;
  tasks.forEach((task, index) => {
    const statusIcon = task.status === 'completed' ? '✅' : '⏳';
    message += `${index + 1}. ${statusIcon} ${task.content}\n`;
  });

  message += `\n💡 访问 Web 看板管理任务：\n`;
  message += `http://localhost:${WEB_PORT}?user_id=${dingtalkId}`;

  await sendDingTalkMessage(dingtalkId, message);
}

async function listAllTasks(user, dingtalkId) {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('task_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    await sendDingTalkMessage(dingtalkId, ` 查询失败: ${error.message}`);
    return;
  }

  if (!tasks || tasks.length === 0) {
    await sendDingTalkMessage(dingtalkId, '📝 暂无任何任务');
    return;
  }

  let message = `📋 *所有任务*\n\n`;
  let currentDate = '';
  
  tasks.forEach((task) => {
    if (task.task_date !== currentDate) {
      currentDate = task.task_date;
      message += `\n📅 ${currentDate}\n`;
    }
    const statusIcon = task.status === 'completed' ? '✅' : '⏳';
    message += `• ${statusIcon} ${task.content}\n`;
  });

  await sendDingTalkMessage(dingtalkId, message);
}

// ==================== 处理添加任务 ====================
async function handleAddTask(content, user, dingtalkId) {
  if (!content.trim()) {
    await sendDingTalkMessage(dingtalkId, '️ 任务内容不能为空');
    return;
  }

  // 解析任务日期和内容
  let taskDate = new Date().toISOString().split('T')[0]; // 默认今天
  let taskContent = content;

  // 检查是否包含日期信息（如 "明天开会"、"后天体检"）
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  if (content.includes('明天')) {
    taskDate = tomorrow.toISOString().split('T')[0];
    taskContent = content.replace('明天', '').trim();
  } else if (content.includes('后天')) {
    taskDate = dayAfterTomorrow.toISOString().split('T')[0];
    taskContent = content.replace('后天', '').trim();
  }

  // 创建任务
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      user_id: user.id,
      content: taskContent,
      task_date: taskDate,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    await sendDingTalkMessage(dingtalkId, `❌ 添加失败: ${error.message}`);
    return;
  }

  const dateText = taskDate === new Date().toISOString().split('T')[0] ? '今天' : 
                   taskDate === tomorrow.toISOString().split('T')[0] ? '明天' : taskDate;

  await sendDingTalkMessage(dingtalkId, `✅ 任务已添加！\n\n📅 ${dateText}\n📝 ${taskContent}\n\n💡 发送 /today 查看今日任务`);
}

// ==================== 晚间提醒 ====================
async function sendEveningReminder() {
  console.log('🔔 开始发送晚间提醒...');

  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('❌ 获取用户列表失败:', error);
    return;
  }

  for (const user of users) {
    if (!user.dingtalk_id) continue;
    await sendReminderToUser(user);
  }

  console.log('✅ 晚间提醒发送完成');
}

async function sendReminderToUser(user) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: pendingTasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('task_date', today)
    .eq('status', 'pending');

  if (error) {
    console.error(`❌ 获取用户 ${user.id} 的任务失败:`, error);
    return;
  }

  if (!pendingTasks || pendingTasks.length === 0) {
    await sendDingTalkMessage(
      user.dingtalk_id,
      '🎉 太棒了！今日所有任务已完成！\n\n好好休息，明天继续加油！💪'
    );
    return;
  }

  let message = ` *晚间任务提醒*\n\n`;
  message += `今天还有 ${pendingTasks.length} 个任务未完成：\n\n`;

  pendingTasks.forEach((task, index) => {
    message += `${index + 1}. ${task.content}\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━\n`;
  message += ` *如何操作：*\n`;
  message += `• 访问 Web 看板标记完成或延期\n`;
  message += `• Web 地址：http://localhost:${WEB_PORT}?user_id=${user.dingtalk_id}\n`;

  await sendDingTalkMessage(user.dingtalk_id, message);
}

// ==================== 钉钉 Webhook 端点 ====================
app.post('/webhook', async (req, res) => {
  try {
    const { msgtype, text, senderNick, senderId } = req.body;

    // 验证签名
    const timestamp = req.query.timestamp;
    const sign = req.query.sign;
    
    if (process.env.DINGTALK_SECRET && timestamp && sign) {
      if (!verifyDingTalkSignature(timestamp, sign)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // 处理文本消息
    if (msgtype === 'text' && text && text.content) {
      const content = text.content.trim();
      const dingtalkId = senderId || 'unknown';
      const username = senderNick || '用户';

      // 注册或获取用户
      let user = await userDB.findByDingTalkId(dingtalkId);
      if (!user) {
        user = await userDB.create(null, username, username, dingtalkId);
      }

      // 处理命令或添加任务
      if (content.startsWith('/')) {
        await handleCommand(content, user, dingtalkId);
      } else {
        await handleAddTask(content, user, dingtalkId);
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('❌ 处理钉钉消息错误:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== Web API 端点 ====================
app.get('/api/today', async (req, res) => {
  try {
    const telegramId = req.query.telegram_id;
    const dingtalkId = req.query.dingtalk_id || req.query.user_id;
    
    if (!telegramId && !dingtalkId) {
      return res.status(400).json({ error: '缺少 telegram_id 或 dingtalk_id 参数' });
    }

    // 查找用户（优先使用钉钉 ID）
    let user = null;
    if (dingtalkId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('dingtalk_id', dingtalkId)
        .single();
      if (!error && data) user = data;
    }
    
    if (!user && telegramId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
      if (!error && data) user = data;
    }

    if (!user) {
      return res.status(404).json({ error: '用户不存在，请先在钉钉中发送消息注册' });
    }

    const today = new Date().toISOString().split('T')[0];

    // 获取今日所有任务
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', today)
      .order('created_at', { ascending: true });

    if (tasksError) {
      throw tasksError;
    }

    // 统计
    const stats = {
      total: tasks?.length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0,
      pending: tasks?.filter(t => t.status === 'pending').length || 0
    };

    res.json({ success: true, data: { tasks: tasks || [], stats } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { telegram_id, dingtalk_id, user_id } = req.body;

    // 查找用户
    let userId = null;
    if (dingtalk_id || user_id) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('dingtalk_id', dingtalk_id || user_id)
        .single();
      if (data) userId = data.id;
    }
    
    if (!userId && telegram_id) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegram_id)
        .single();
      if (data) userId = data.id;
    }

    if (!userId) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 更新任务状态
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:id/postpone', async (req, res) => {
  try {
    const { id } = req.params;
    const { telegram_id, dingtalk_id, user_id, days } = req.body;

    // 查找用户
    let userId = null;
    if (dingtalk_id || user_id) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('dingtalk_id', dingtalk_id || user_id)
        .single();
      if (data) userId = data.id;
    }
    
    if (!userId && telegram_id) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegram_id)
        .single();
      if (data) userId = data.id;
    }

    if (!userId) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 计算新日期
    const postponeDays = parseInt(days) || 1;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + postponeDays);
    const newDateString = newDate.toISOString().split('T')[0];

    // 更新任务日期
    const { error } = await supabase
      .from('tasks')
      .update({ task_date: newDateString })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, new_date: newDateString });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 静态文件服务 ====================
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../public')));

// ==================== 启动服务 ====================
// 启动定时任务
cron.schedule(`${REMINDER_CRON} * * *`, async () => {
  console.log('⏰ 触发晚间提醒定时任务');
  await sendEveningReminder();
}, {
  scheduled: true,
  timezone: 'Asia/Shanghai'
});

console.log(' 定时提醒已设置：每天', REMINDER_CRON);

// 启动 HTTP 服务器（同时提供 Webhook 和 Web API）
const PORT = process.env.PORT || DINGTALK_PORT;

app.listen(PORT, () => {
  console.log(`🚀 钉钉任务系统已启动！`);
  console.log(`📱 钉钉 Webhook: http://localhost:${PORT}/webhook`);
  console.log(`🌐 Web 看板:   http://localhost:${PORT}`);
  console.log(` 定时提醒:   每天 ${REMINDER_CRON}`);
  console.log(`\n💡 Railway 会自动分配公网 URL，请将以下地址配置到钉钉机器人：`);
  console.log(`https://your-app.railway.app/webhook`);
});
