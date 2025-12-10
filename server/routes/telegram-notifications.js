import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '../index.js';

const router = express.Router();

// Инициализация Telegram бота для уведомлений
// Используем TG_BOT_TOKEN из переменных окружения
const notificationsBot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: false });

// Приветственное сообщение
const WELCOME_MESSAGE = `Привет! Здесь будут приходить уведомления о новых функциях idenself. Подписывайся на дневник создания проекта @idenself_channel и пиши обратную связь об использовании сервиса нам в личку @idenself`;

// Webhook endpoint для получения обновлений от Telegram
// Telegram будет отправлять POST запросы на этот endpoint
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const update = req.body;
    
    // Отвечаем Telegram сразу, чтобы не было таймаута
    res.status(200).send('OK');
    
    // Обрабатываем обновление асинхронно
    handleTelegramUpdate(update).catch(error => {
      console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка обработки обновления:', error);
    });
    
  } catch (error) {
    console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка webhook:', error);
    res.status(500).send('Error');
  }
});

// Обработка обновлений от Telegram
async function handleTelegramUpdate(update) {
  // Обрабатываем только сообщения (не callback_query и другие типы)
  if (!update.message) {
    return;
  }
  
  const message = update.message;
  const chatId = message.chat.id;
  const userId = message.from.id;
  const username = message.from.username || null;
  const firstName = message.from.first_name || null;
  const lastName = message.from.last_name || null;
  const text = message.text;
  
  console.log('📨 [TELEGRAM-NOTIFICATIONS] Получено сообщение:', {
    chatId,
    userId,
    username,
    text: text?.substring(0, 50)
  });
  
  // Обработка команды /start
  if (text && text.startsWith('/start')) {
    await handleStartCommand(chatId, userId, username, firstName, lastName);
  }
}

// Обработка команды /start
async function handleStartCommand(chatId, userId, username, firstName, lastName) {
  try {
    console.log('🚀 [TELEGRAM-NOTIFICATIONS] Обработка команды /start:', { chatId, userId, username });
    
    // Проверяем, есть ли уже подписчик с таким user_id и chat_id
    const { data: existingSubscriber, error: fetchError } = await supabase
      .from('telegram_subscribers')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found, это нормально
      console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка проверки подписчика:', fetchError);
    }
    
    // Если подписчик уже есть, обновляем информацию
    if (existingSubscriber) {
      console.log('🔄 [TELEGRAM-NOTIFICATIONS] Обновление существующего подписчика');
      
      const { error: updateError } = await supabase
        .from('telegram_subscribers')
        .update({
          username,
          first_name: firstName,
          last_name: lastName,
          is_active: true,
          last_message_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('chat_id', chatId);
      
      if (updateError) {
        console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка обновления подписчика:', updateError);
      } else {
        console.log('✅ [TELEGRAM-NOTIFICATIONS] Подписчик обновлен');
      }
    } else {
      // Создаем нового подписчика
      console.log('➕ [TELEGRAM-NOTIFICATIONS] Создание нового подписчика');
      
      const { error: insertError } = await supabase
        .from('telegram_subscribers')
        .insert({
          user_id: userId,
          chat_id: chatId,
          username,
          first_name: firstName,
          last_name: lastName,
          is_active: true,
          subscribed_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка создания подписчика:', insertError);
      } else {
        console.log('✅ [TELEGRAM-NOTIFICATIONS] Новый подписчик создан');
      }
    }
    
    // Отправляем приветственное сообщение
    await notificationsBot.sendMessage(chatId, WELCOME_MESSAGE);
    console.log('✅ [TELEGRAM-NOTIFICATIONS] Приветственное сообщение отправлено');
    
  } catch (error) {
    console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка обработки /start:', error);
    
    // Пытаемся отправить сообщение об ошибке пользователю
    try {
      await notificationsBot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
    } catch (sendError) {
      console.error('❌ [TELEGRAM-NOTIFICATIONS] Не удалось отправить сообщение об ошибке:', sendError);
    }
  }
}

// Endpoint для получения списка подписчиков (для будущих рассылок)
router.get('/subscribers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('telegram_subscribers')
      .select('*')
      .eq('is_active', true)
      .order('subscribed_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ success: true, count: data?.length || 0, subscribers: data });
  } catch (error) {
    console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка получения подписчиков:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint для отправки рассылки (для будущего использования)
router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    // Получаем всех активных подписчиков
    const { data: subscribers, error: fetchError } = await supabase
      .from('telegram_subscribers')
      .select('chat_id')
      .eq('is_active', true);
    
    if (fetchError) throw fetchError;
    
    if (!subscribers || subscribers.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No active subscribers' });
    }
    
    // Отправляем сообщение всем подписчикам
    let sent = 0;
    let failed = 0;
    
    for (const subscriber of subscribers) {
      try {
        await notificationsBot.sendMessage(subscriber.chat_id, message);
        sent++;
      } catch (sendError) {
        console.error(`❌ [TELEGRAM-NOTIFICATIONS] Ошибка отправки подписчику ${subscriber.chat_id}:`, sendError);
        failed++;
        
        // Если пользователь заблокировал бота, помечаем как неактивного
        if (sendError.response?.statusCode === 403) {
          await supabase
            .from('telegram_subscribers')
            .update({ is_active: false })
            .eq('chat_id', subscriber.chat_id);
        }
      }
    }
    
    res.json({ success: true, sent, failed, total: subscribers.length });
  } catch (error) {
    console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка рассылки:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint для настройки webhook (вызывается вручную или при деплое)
router.post('/set-webhook', async (req, res) => {
  try {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || req.body.webhookUrl;
    
    if (!webhookUrl) {
      return res.status(400).json({ success: false, error: 'Webhook URL is required' });
    }
    
    const result = await notificationsBot.setWebHook(webhookUrl);
    
    console.log('✅ [TELEGRAM-NOTIFICATIONS] Webhook установлен:', webhookUrl);
    res.json({ success: true, result, webhookUrl });
  } catch (error) {
    console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка установки webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint для получения информации о webhook
router.get('/webhook-info', async (req, res) => {
  try {
    const info = await notificationsBot.getWebHookInfo();
    res.json({ success: true, info });
  } catch (error) {
    console.error('❌ [TELEGRAM-NOTIFICATIONS] Ошибка получения информации о webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

