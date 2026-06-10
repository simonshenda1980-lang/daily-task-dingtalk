import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEB_PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API: 获取今日任务
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

    if (tasksError) throw tasksError;

    // 统计
    const total = tasks?.length || 0;
    const completed = tasks?.filter(t => t.status === 'completed').length || 0;
    const pending = tasks?.filter(t => t.status === 'pending').length || 0;

    res.json({
      success: true,
      data: {
        tasks: tasks || [],
        stats: { total, completed, pending }
      }
    });
  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// API: 标记任务完成
app.post('/api/complete', async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: '缺少 taskId' });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('标记完成失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// API: 延期任务
app.post('/api/postpone', async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: '缺少 taskId' });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'postponed', task_date: tomorrowStr })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('延期任务失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🌐 Web 看板运行在 http://localhost:${PORT}`);
});
