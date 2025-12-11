import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const router = express.Router();

// Инициализация Telegram бота (используем тот же бот, что и для заявок на подбор психолога)
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Webhook endpoint для приема данных от Яндекс.Форм
router.post('/webhook', express.json(), async (req, res) => {
  try {
    console.log('📨 [YANDEX-FORMS] Получены данные от Яндекс.Форм:', JSON.stringify(req.body, null, 2));
    
    // Отвечаем Яндекс.Формам сразу, чтобы не было таймаута
    res.status(200).json({ success: true });
    
    // Обрабатываем данные асинхронно
    handleYandexFormSubmission(req.body).catch(error => {
      console.error('❌ [YANDEX-FORMS] Ошибка обработки данных:', error);
    });
    
  } catch (error) {
    console.error('❌ [YANDEX-FORMS] Ошибка webhook:', error);
    // Все равно отвечаем 200, чтобы Яндекс.Формы не повторяли запрос
    res.status(200).json({ success: false, error: error.message });
  }
});

// Обработка данных от Яндекс.Форм
async function handleYandexFormSubmission(data) {
  try {
    console.log('🔄 [YANDEX-FORMS] Начало обработки данных от Яндекс.Форм');
    
    // Яндекс.Формы могут отправлять данные в разных форматах
    // Вариант 1: JSON-RPC формат
    // Вариант 2: Простой JSON с параметрами
    // Вариант 3: Параметры в теле запроса
    
    let name, phone, email, telegramUsername;
    
    // Пытаемся извлечь данные из разных форматов
    if (data.params) {
      // JSON-RPC формат
      name = data.params.name || data.params.Имя || '';
      phone = data.params.phone || data.params.Телефон || '';
      email = data.params.email || data.params.Почта || '';
      telegramUsername = data.params.telegram || data.params['Ник telegram'] || '';
    } else if (data.name || data.phone || data.email) {
      // Простой JSON формат
      name = data.name || '';
      phone = data.phone || '';
      email = data.email || '';
      telegramUsername = data.telegram || data.telegramUsername || '';
    } else {
      // Пытаемся найти данные в любом месте объекта
      name = data.name || data.Имя || data['name'] || '';
      phone = data.phone || data.Телефон || data['phone'] || '';
      email = data.email || data.Почта || data['email'] || '';
      telegramUsername = data.telegram || data['Ник telegram'] || data.telegramUsername || '';
    }
    
    console.log('📋 [YANDEX-FORMS] Извлеченные данные:', { name, phone, email, telegramUsername });
    
    // Проверяем обязательные поля
    if (!name || !phone || !email) {
      console.error('❌ [YANDEX-FORMS] Отсутствуют обязательные поля:', { name: !!name, phone: !!phone, email: !!email });
      return;
    }
    
    // Генерируем номер заявки
    const requestNumber = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    console.log('📋 [YANDEX-FORMS] Номер заявки:', requestNumber);
    
    // НЕ сохраняем заявку в базу данных для соблюдения закона о персональных данных
    // Данные отправляются только в Telegram
    
    // Отправляем уведомление в Telegram
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!chatId) {
      console.error('❌ [YANDEX-FORMS] TELEGRAM_CHAT_ID не установлен');
      return;
    }
    
    // Форматируем Telegram username
    const formattedTelegramUsername = telegramUsername 
      ? (telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`)
      : 'Не указан';
    
    const message = `🔔 Новая заявка на подбор психолога (из Яндекс.Форм)!

📋 Номер заявки: ${requestNumber}
👤 Имя: ${name}
📞 Телефон: ${phone}
📧 Email: ${email}
💬 Telegram: ${formattedTelegramUsername}
⏰ Время: ${new Date().toLocaleString('ru-RU')}
📝 Источник: Яндекс.Формы`;

    await bot.sendMessage(chatId, message);
    console.log('✅ [YANDEX-FORMS] Сообщение отправлено в Telegram');
    
    // Генерируем и отправляем PDF документы (если есть sessionId с результатами теста)
    // Для заявок из Яндекс.Форм может не быть sessionId с тестами, поэтому PDF не генерируем
    // Если нужно генерировать PDF, можно добавить логику здесь
    
  } catch (error) {
    console.error('❌ [YANDEX-FORMS] Ошибка обработки заявки:', error);
    throw error;
  }
}

export default router;

