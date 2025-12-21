import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const router = express.Router();

// Инициализация Telegram бота (используем тот же бот, что и для заявок на подбор психолога)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

/**
 * POST /api/budget-alerts/pubsub
 * Webhook endpoint для получения уведомлений о превышении бюджета от Google Cloud Pub/Sub
 * 
 * Формат сообщения от Pub/Sub:
 * {
 *   "message": {
 *     "data": "base64-encoded-json",
 *     "messageId": "...",
 *     "publishTime": "..."
 *   },
 *   "subscription": "..."
 * }
 */
router.post('/pubsub', express.json(), async (req, res) => {
  try {
    console.log('💰 [BUDGET-ALERT] Получено уведомление от Pub/Sub:', JSON.stringify(req.body, null, 2));
    
    // Отвечаем Pub/Sub сразу, чтобы не было таймаута
    res.status(200).json({ success: true });
    
    // Обрабатываем данные асинхронно
    handleBudgetAlert(req.body).catch(error => {
      console.error('❌ [BUDGET-ALERT] Ошибка обработки уведомления:', error);
    });
    
  } catch (error) {
    console.error('❌ [BUDGET-ALERT] Ошибка webhook:', error);
    // Все равно отвечаем 200, чтобы Pub/Sub не повторял запрос
    res.status(200).json({ success: false, error: error.message });
  }
});

/**
 * Обработка уведомления о превышении бюджета
 */
async function handleBudgetAlert(pubsubMessage) {
  try {
    console.log('🔄 [BUDGET-ALERT] Начало обработки уведомления о бюджете');
    
    // Pub/Sub отправляет сообщения в формате:
    // { message: { data: "base64-encoded-json", messageId: "...", publishTime: "..." } }
    let budgetData;
    
    if (pubsubMessage.message && pubsubMessage.message.data) {
      // Декодируем base64 данные
      const decodedData = Buffer.from(pubsubMessage.message.data, 'base64').toString('utf-8');
      budgetData = JSON.parse(decodedData);
      console.log('📋 [BUDGET-ALERT] Декодированные данные:', budgetData);
    } else if (pubsubMessage.budgetDisplayName || pubsubMessage.alertThresholdExceeded) {
      // Прямой формат (если Pub/Sub настроен на прямой JSON)
      budgetData = pubsubMessage;
    } else {
      console.error('❌ [BUDGET-ALERT] Неожиданный формат сообщения от Pub/Sub');
      return;
    }
    
    // Извлекаем информацию о бюджете
    const budgetId = process.env.Budget_ID || budgetData.budgetId || 'не указан';
    const budgetName = budgetData.budgetDisplayName || budgetData.budgetName || 'Бюджет Google Cloud';
    const costAmount = budgetData.costAmount || budgetData.amount || 'не указана';
    const budgetAmount = budgetData.budgetAmount || budgetData.amount || 'не указана';
    const currency = budgetData.currencyCode || budgetData.currency || 'RUB';
    const threshold = budgetData.alertThresholdExceeded || budgetData.threshold || 'не указан';
    const timestamp = budgetData.timestamp || new Date().toISOString();
    
    console.log('📊 [BUDGET-ALERT] Информация о бюджете:', {
      budgetId,
      budgetName,
      costAmount,
      budgetAmount,
      currency,
      threshold
    });
    
    // Отправляем уведомление в Telegram
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!chatId) {
      console.error('❌ [BUDGET-ALERT] TELEGRAM_CHAT_ID не установлен');
      return;
    }
    
    // Форматируем сообщение
    const message = `🚨 ПРЕВЫШЕНИЕ БЮДЖЕТА GOOGLE CLOUD!

💰 Бюджет: ${budgetName}
🆔 ID бюджета: ${budgetId}
💵 Текущие расходы: ${costAmount} ${currency}
📊 Лимит бюджета: ${budgetAmount} ${currency}
⚠️ Порог превышения: ${threshold}
⏰ Время: ${new Date(timestamp).toLocaleString('ru-RU')}

⚠️ Требуется немедленное внимание!`;

    await bot.sendMessage(chatId, message);
    console.log('✅ [BUDGET-ALERT] Сообщение о превышении бюджета отправлено в Telegram');
    
  } catch (error) {
    console.error('❌ [BUDGET-ALERT] Ошибка обработки уведомления о бюджете:', error);
    throw error;
  }
}

export default router;

