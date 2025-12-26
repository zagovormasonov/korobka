import TelegramBot from 'node-telegram-bot-api';

// Инициализация Telegram бота (используем тот же бот, что и для заявок на подбор психолога)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

/**
 * Отправляет уведомление в Telegram (бот для заявок на подбор психолога)
 * @param {string} message - Текст сообщения
 */
export async function sendTelegramNotification(message) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!chatId) {
      console.warn('⚠️ TELEGRAM_CHAT_ID не установлен, уведомление не отправлено');
      return;
    }
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен, уведомление не отправлено');
      return;
    }
    
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    console.log('✅ [TELEGRAM-NOTIFICATION] Уведомление отправлено в Telegram');
  } catch (error) {
    console.error('❌ [TELEGRAM-NOTIFICATION] Не удалось отправить уведомление в Telegram:', error);
  }
}

