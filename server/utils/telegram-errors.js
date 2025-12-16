import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

/**
 * Отправляет ошибку сервера в Telegram (бот для заявок на подбор психолога)
 * @param {Error} error - Объект ошибки
 * @param {Object} context - Дополнительный контекст (route, sessionId, etc.)
 */
export async function sendErrorToTelegram(error, context = {}) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!chatId) {
      console.warn('⚠️ TELEGRAM_CHAT_ID не установлен, ошибка не отправлена в Telegram');
      return;
    }

    // Форматируем контекст
    const contextLines = Object.entries(context)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `  • ${key}: ${strValue.length > 100 ? strValue.substring(0, 100) + '...' : strValue}`;
      })
      .join('\n');

    // Форматируем stack trace (ограничиваем длину)
    const stackTrace = error.stack || 'Нет stack trace';
    const truncatedStack = stackTrace.length > 1500 
      ? stackTrace.substring(0, 1500) + '\n... (обрезано)'
      : stackTrace;

    // Форматируем сообщение об ошибке
    const errorMessage = `🚨 ОШИБКА СЕРВЕРА

📋 Тип: ${error.name || 'Unknown Error'}
💬 Сообщение: ${error.message || 'Нет сообщения'}

📍 Контекст:
${contextLines || '  • Нет дополнительного контекста'}

🔍 Stack trace:
\`\`\`
${truncatedStack}
\`\`\`

⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

    // Отправляем сообщение (разбиваем на части, если слишком длинное)
    const maxLength = 4096; // Лимит Telegram
    if (errorMessage.length > maxLength) {
      // Отправляем первую часть без markdown для надежности
      const firstPart = errorMessage.substring(0, maxLength);
      await bot.sendMessage(chatId, firstPart);
      
      // Отправляем остаток
      const remainingPart = errorMessage.substring(maxLength);
      if (remainingPart.length > maxLength) {
        await bot.sendMessage(chatId, remainingPart.substring(0, maxLength));
      } else {
        await bot.sendMessage(chatId, remainingPart);
      }
    } else {
      try {
        await bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
      } catch (markdownError) {
        // Если markdown не прошёл, отправляем без форматирования
        await bot.sendMessage(chatId, errorMessage.replace(/`/g, ''));
      }
    }
    
    console.log('✅ [TELEGRAM-ERROR] Ошибка отправлена в Telegram');
  } catch (telegramError) {
    console.error('❌ [TELEGRAM-ERROR] Не удалось отправить ошибку в Telegram:', telegramError);
  }
}

