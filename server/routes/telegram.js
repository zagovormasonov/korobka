import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '../index.js';

const router = express.Router();

// Инициализация Telegram бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Отправить заявку на подбор психолога в Telegram с PDF документами
router.post('/psychologist-request', async (req, res) => {
  try {
    const { sessionId, name, phone, email, telegramUsername, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = req.body;
    
    console.log('🎯 [TELEGRAM-PSYCHOLOGIST-REQUEST] Начало обработки заявки:', { sessionId, name });
    
    // Проверяем лимит заявок (3 раза в час)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentRequests, error: limitError } = await supabase
      .from('psychologist_requests')
      .select('id')
      .eq('session_id', sessionId)
      .gte('created_at', oneHourAgo.toISOString());
    
    if (limitError) {
      console.error('❌ [TELEGRAM] Ошибка проверки лимита:', limitError);
      return res.status(500).json({ success: false, error: 'Failed to check request limit' });
    }
    
    if (recentRequests && recentRequests.length >= 3) {
      console.log('⚠️ [TELEGRAM] Превышен лимит заявок:', recentRequests.length);
      return res.status(429).json({ 
        success: false, 
        error: 'Превышен лимит заявок. Можно отправлять не более 3 заявок в час.',
        limit: 3,
        remaining: 0
      });
    }
    
    console.log('✅ [TELEGRAM] Лимит не превышен, заявок за последний час:', recentRequests?.length || 0);
    
    // Генерируем номер заявки
    const requestNumber = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    console.log('📋 [TELEGRAM] Номер заявки:', requestNumber);
    
    // Сохраняем заявку в базу данных
    const { data, error } = await supabase
      .from('psychologist_requests')
      .insert({
        session_id: sessionId,
        name: name,
        phone: phone,
        email: email,
        telegram_username: telegramUsername,
        request_number: requestNumber,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent
      })
      .select()
      .single();

    if (error) throw error;
    
    // Отправляем уведомление в Telegram
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    // Форматируем Telegram username (избегаем дублирования @)
    const formattedTelegramUsername = telegramUsername 
      ? (telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`)
      : 'Не указан';
    
    const utmInfo = utmSource || utmMedium || utmCampaign ? `
📊 UTM-метки:
${utmSource ? `🔗 Источник: ${utmSource}` : ''}
${utmMedium ? `📱 Канал: ${utmMedium}` : ''}
${utmCampaign ? `🎯 Кампания: ${utmCampaign}` : ''}
${utmTerm ? `🔍 Ключевое слово: ${utmTerm}` : ''}
${utmContent ? `📝 Контент: ${utmContent}` : ''}` : '';

    const message = `🔔 Новая заявка на подбор психолога!

📋 Номер заявки: ${requestNumber}
👤 Имя: ${name}
📞 Телефон: ${phone}
📧 Email: ${email}
💬 Telegram: ${formattedTelegramUsername}
🆔 Session ID: ${sessionId}
⏰ Время: ${new Date().toLocaleString('ru-RU')}${utmInfo}

📄 Генерирую PDF документы...`;

    await bot.sendMessage(chatId, message);
    
    // Генерируем и отправляем все 3 PDF документа
    const baseUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
    
    try {
      // 1. Персональный план
      console.log('📄 [TELEGRAM] Генерируем персональный план...');
      const personalPlanResponse = await fetch(`${baseUrl}/api/pdf/personal-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(300000), // 5 минут timeout
      });
      
      if (personalPlanResponse.ok) {
        const personalPlanBuffer = await personalPlanResponse.arrayBuffer();
        await bot.sendDocument(chatId, Buffer.from(personalPlanBuffer), {
          filename: `personal-plan-${requestNumber}.pdf`,
          caption: `📋 Персональный план психологического благополучия\n📋 Заявка: ${requestNumber}`
        });
        console.log('✅ [TELEGRAM] Персональный план отправлен');
      } else {
        console.error('❌ [TELEGRAM] Ошибка генерации персонального плана:', personalPlanResponse.status);
      }
      
      // 2. Подготовка к сеансам
      console.log('📄 [TELEGRAM] Генерируем подготовку к сеансам...');
      const sessionPrepResponse = await fetch(`${baseUrl}/api/pdf/session-preparation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(300000), // 5 минут timeout
      });
      
      if (sessionPrepResponse.ok) {
        const sessionPrepBuffer = await sessionPrepResponse.arrayBuffer();
        await bot.sendDocument(chatId, Buffer.from(sessionPrepBuffer), {
          filename: `session-preparation-${requestNumber}.pdf`,
          caption: `🎯 Подготовка к сеансам с психологом и психиатром\n📋 Заявка: ${requestNumber}`
        });
        console.log('✅ [TELEGRAM] Подготовка к сеансам отправлена');
      } else {
        console.error('❌ [TELEGRAM] Ошибка генерации подготовки к сеансам:', sessionPrepResponse.status);
      }
      
      // 3. PDF для психолога и психиатра
      console.log('📄 [TELEGRAM] Генерируем PDF для специалистов...');
      const psychologistPdfResponse = await fetch(`${baseUrl}/api/pdf/psychologist-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(300000), // 5 минут timeout
      });
      
      if (psychologistPdfResponse.ok) {
        const psychologistPdfBuffer = await psychologistPdfResponse.arrayBuffer();
        await bot.sendDocument(chatId, Buffer.from(psychologistPdfBuffer), {
          filename: `psychologist-pdf-${requestNumber}.pdf`,
          caption: `👨‍⚕️ Подготовительный документ для психолога и психиатра\n📋 Заявка: ${requestNumber}`
        });
        console.log('✅ [TELEGRAM] PDF для специалистов отправлен');
      } else {
        console.error('❌ [TELEGRAM] Ошибка генерации PDF для специалистов:', psychologistPdfResponse.status);
      }
      
      // Отправляем финальное сообщение
      await bot.sendMessage(chatId, `✅ Все документы для заявки ${name} успешно сгенерированы и отправлены!`);
      
    } catch (pdfError) {
      console.error('❌ [TELEGRAM] Ошибка при генерации PDF:', pdfError);
      await bot.sendMessage(chatId, `⚠️ Ошибка при генерации PDF документов для заявки ${name}: ${pdfError.message}`);
    }
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error sending psychologist request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить заявки на подбор психолога
router.get('/psychologist-requests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('psychologist_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching psychologist requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Отправить уведомление о завершении теста
router.post('/test-completed', async (req, res) => {
  try {
    const { sessionId, email } = req.body;
    
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const message = `✅ Тест завершен!

📧 Email: ${email}
🆔 Session ID: ${sessionId}
⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

    await bot.sendMessage(chatId, message);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending test completion notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Отправить уведомление об оплате
router.post('/payment-completed', async (req, res) => {
  try {
    const { sessionId, amount, paymentId } = req.body;
    
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const message = `💰 Платеж получен!

💳 Сумма: ${amount / 100} ₽
🆔 Payment ID: ${paymentId}
🆔 Session ID: ${sessionId}
⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

    await bot.sendMessage(chatId, message);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending payment notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;




