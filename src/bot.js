import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { userDB, taskDB } from './database.js';
import { startReminderScheduler, handleQuickReply } from './scheduler.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('缺少 Telegram Bot Token，请检查 .env 文件');
}

// 创建 Bot 实例
const bot = new TelegramBot(token, { polling: true });

console.log('✅ Telegram Bot 已启动');

// 启动定时提醒任务
startReminderScheduler();

// 用户会话管理（存储用户当前交互状态）
const userSessions = new Map();

// /start 命令
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  const firstName = msg.from.first_name;

  // 创建或获取用户
  const user = await userDB.getOrCreate(chatId, username, firstName);

  const welcomeMessage = `
🎉 欢迎使用每日任务管理系统！

📱 *功能介绍：*
• 直接发送文字或语音消息添加任务
• 查看今日任务清单
• 晚间自动提醒未完成的任务

💡 *常用命令：*
/start - 显示此欢迎信息
/list - 查看今日任务
/add <内容> - 添加新任务
/help - 显示帮助信息

现在试着添加你的第一个任务吧！
  `;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// /help 命令
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
📖 *使用帮助*

*添加任务：*
• 直接发送文字消息
• 发送语音消息（会自动转文字）
• 使用命令：/add 任务内容

*查看任务：*
• /list - 查看今日所有任务
• /pending - 查看今日未完成任务

*管理任务：*
• 回复任务编号 + "完成" 标记完成
• 回复任务编号 + "延期" 延期到明天
• /clear - 清空今日已完成任务

*其他：*
• 每晚 8 点自动推送提醒
• 所有数据云端同步，多设备可用
  `;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// /list 命令 - 查看今日任务
bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await userDB.findByTelegramId(chatId);

  if (!user) {
    bot.sendMessage(chatId, '请先使用 /start 命令注册');
    return;
  }

  const tasks = await taskDB.getByDate(user.id, new Date().toISOString().split('T')[0]);

  if (tasks.length === 0) {
    bot.sendMessage(chatId, '📭 今日暂无任务');
    return;
  }

  let message = '📋 *今日任务清单*\n\n';
  tasks.forEach((task, index) => {
    const statusIcon = task.status === 'completed' ? '✅' : 
                      task.status === 'postponed' ? '⏸️' : '⏳';
    message += `${index + 1}. ${statusIcon} ${task.content}\n`;
  });

  message += '\n💡 回复编号 + "完成" 或 "延期" 来管理任务';

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// /pending 命令 - 查看今日未完成任务
bot.onText(/\/pending/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await userDB.findByTelegramId(chatId);

  if (!user) {
    bot.sendMessage(chatId, '请先使用 /start 命令注册');
    return;
  }

  const tasks = await taskDB.getTodayPending(user.id);

  if (tasks.length === 0) {
    bot.sendMessage(chatId, '🎉 今日所有任务已完成！');
    return;
  }

  let message = '⏳ *今日未完成任务*\n\n';
  tasks.forEach((task, index) => {
    message += `${index + 1}. ${task.content}\n`;
  });

  message += '\n回复编号 + "完成" 或 "延期" 来管理任务';

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// /add 命令 - 添加任务
bot.onText(/\/add (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const content = match[1].trim();
  
  await handleAddTask(chatId, content);
});

// 处理普通文本消息（添加任务或快速回复）
bot.on('message', async (msg) => {
  // 忽略命令消息
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;

  // 先尝试处理快速回复（晚间提醒的响应）
  if (msg.text) {
    const isQuickReply = handleQuickReply(msg);
    if (isQuickReply) return;
  }

  // 处理文本消息（添加任务）
  if (msg.text) {
    await handleAddTask(chatId, msg.text);
  }
});

// 处理语音消息
bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  
  // Telegram 语音消息需要语音识别服务
  // 这里先提示用户使用文字输入
  bot.sendMessage(chatId, '🎤 收到语音消息\n\n目前暂不支持语音转文字，请直接发送文字消息添加任务。\n\n💡 提示：可以使用 iOS 自带听写功能（键盘麦克风图标）实现语音输入。');
});

// 处理回调查询（按钮点击）
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  
  // 解析回调数据
  const [action, taskId] = data.split('_');
  
  const user = await userDB.findByTelegramId(chatId);
  if (!user) return;

  try {
    if (action === 'complete') {
      await taskDB.markCompleted(taskId);
      bot.answerCallbackQuery(callbackQuery.id, { text: '✅ 已标记为完成' });
      
      // 更新原消息
      const tasks = await taskDB.getTodayPending(user.id);
      if (tasks.length === 0) {
        bot.editMessageText('🎉 所有任务已完成！', {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id
        });
      }
    } else if (action === 'postpone') {
      await taskDB.markPostponed(taskId, getTomorrowDate());
      bot.answerCallbackQuery(callbackQuery.id, { text: '⏸️ 已延期到明天' });
    }
  } catch (error) {
    console.error('处理回调错误:', error);
    bot.answerCallbackQuery(callbackQuery.id, { text: '操作失败，请重试' });
  }
});

// 辅助函数：添加任务
async function handleAddTask(chatId, content) {
  try {
    const user = await userDB.getOrCreate(
      chatId,
      null,
      null
    );

    const task = await taskDB.create(user.id, content);

    bot.sendMessage(chatId, `✅ 任务已添加：\n\n"${content}"`);
  } catch (error) {
    console.error('添加任务错误:', error);
    bot.sendMessage(chatId, '❌ 添加任务失败，请重试');
  }
}

// 辅助函数：获取明天的日期
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// 导出 bot 实例供其他模块使用
export { bot };
