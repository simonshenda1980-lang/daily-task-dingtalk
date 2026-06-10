import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('缺少 Supabase 配置，请检查 .env 文件');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws
  }
});

// 用户相关操作
export const userDB = {
  async findByTelegramId(telegramId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findByDingTalkId(dingTalkId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('dingtalk_id', dingTalkId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(telegramId, username, firstName, dingTalkId = null) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        telegram_id: telegramId,
        username,
        first_name: firstName,
        dingtalk_id: dingTalkId
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getOrCreate(telegramId, username, firstName, dingTalkId = null) {
    let user;
    if (dingTalkId) {
      user = await this.findByDingTalkId(dingTalkId);
    } else {
      user = await this.findByTelegramId(telegramId);
    }
    
    if (!user) {
      user = await this.create(telegramId, username, firstName, dingTalkId);
    }
    return user;
  }
};

// 任务相关操作
export const taskDB = {
  async create(userId, content, taskDate = new Date().toISOString().split('T')[0]) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ user_id: userId, content, task_date: taskDate }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByDate(userId, date) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', date)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getPendingByDate(userId, date) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('task_date', date)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async markCompleted(taskId) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async markPostponed(taskId, newDate) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'postponed', task_date: newDate })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
  },

  // 获取今日未完成的任务
  async getTodayPending(userId) {
    const today = new Date().toISOString().split('T')[0];
    return this.getPendingByDate(userId, today);
  },

  // 批量延期任务到明天
  async postponeToTomorrow(userId, taskIds) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const updates = taskIds.map(taskId => 
      this.markPostponed(taskId, tomorrowStr)
    );
    
    return Promise.all(updates);
  }
};
