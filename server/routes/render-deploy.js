import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const router = express.Router();

// Инициализация Telegram бота (используем тот же бот, что и для заявок на подбор психолога)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

/**
 * Webhook endpoint для получения уведомлений о деплое от Render
 * Настройте в Render Dashboard: Settings -> Deploy Webhooks -> Add Webhook
 * URL: https://your-app.onrender.com/api/render-deploy/webhook
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    console.log('📦 [RENDER-DEPLOY] Получен webhook от Render:', JSON.stringify(req.body, null, 2));
    
    // Отвечаем Render сразу, чтобы не было таймаута
    res.status(200).json({ success: true, received: true });
    
    // Обрабатываем данные асинхронно
    handleDeployWebhook(req.body).catch(error => {
      console.error('❌ [RENDER-DEPLOY] Ошибка обработки webhook:', error);
    });
    
  } catch (error) {
    console.error('❌ [RENDER-DEPLOY] Ошибка webhook:', error);
    // Все равно отвечаем 200, чтобы Render не повторял запрос
    res.status(200).json({ success: false, error: error.message });
  }
});

// Обработка webhook от Render
async function handleDeployWebhook(data) {
  try {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!chatId) {
      console.error('❌ [RENDER-DEPLOY] TELEGRAM_CHAT_ID не установлен');
      return;
    }

    // Render отправляет данные в формате:
    // {
    //   "deploy": {
    //     "id": "...",
    //     "status": "live" | "build_failed" | "update_failed" | "canceled",
    //     "commit": { "message": "...", "id": "..." },
    //     "service": { "name": "...", "type": "web_service" },
    //     "finishedAt": "..."
    //   }
    // }

    const deploy = data.deploy || data;
    const status = deploy.status || deploy.state || 'unknown';
    const serviceName = deploy.service?.name || deploy.service?.slug || 'Unknown Service';
    const commitMessage = deploy.commit?.message || deploy.commit?.message || 'No commit message';
    const commitId = deploy.commit?.id || deploy.commit?.sha || 'unknown';
    const finishedAt = deploy.finishedAt || deploy.finished_at || new Date().toISOString();
    const deployId = deploy.id || 'unknown';

    // Определяем статус деплоя
    let statusEmoji = '🔄';
    let statusText = 'Неизвестный статус';
    let isSuccess = false;

    switch (status) {
      case 'live':
      case 'active':
        statusEmoji = '✅';
        statusText = 'Успешно';
        isSuccess = true;
        break;
      case 'build_failed':
        statusEmoji = '❌';
        statusText = 'Ошибка сборки';
        isSuccess = false;
        break;
      case 'update_failed':
        statusEmoji = '⚠️';
        statusText = 'Ошибка обновления';
        isSuccess = false;
        break;
      case 'canceled':
        statusEmoji = '🚫';
        statusText = 'Отменён';
        isSuccess = false;
        break;
      default:
        statusEmoji = '🔄';
        statusText = status;
        isSuccess = false;
    }

    // Форматируем время
    const finishedDate = new Date(finishedAt);
    const formattedTime = finishedDate.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Обрезаем commit message если слишком длинный
    const shortCommitMessage = commitMessage.length > 100 
      ? commitMessage.substring(0, 100) + '...' 
      : commitMessage;

    // Формируем сообщение
    const message = `${statusEmoji} <b>Деплой ${statusText}</b>

📦 Сервис: <code>${serviceName}</code>
🆔 ID деплоя: <code>${deployId}</code>
📝 Коммит: <code>${commitId.substring(0, 7)}</code>
💬 Сообщение: ${shortCommitMessage}
⏰ Время: ${formattedTime}

${isSuccess ? '🎉 Деплой успешно завершён!' : '⚠️ Требуется внимание!'}`;

    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    console.log(`✅ [RENDER-DEPLOY] Уведомление отправлено в Telegram: ${statusText}`);

  } catch (error) {
    console.error('❌ [RENDER-DEPLOY] Ошибка обработки webhook:', error);
    throw error;
  }
}

export default router;

