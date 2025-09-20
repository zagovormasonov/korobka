import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { pool } from '../index.js';

const router = express.Router();

// Инициализация Telegram бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Отправить заявку на подбор психолога в Telegram
router.post('/psychologist-request', async (req, res) => {
  try {
    const { sessionId, name, phone, email, telegramUsername } = req.body;
    
    // Сохраняем заявку в базу данных
    const result = await pool.query(
      'INSERT INTO psychologist_requests (session_id, name, phone, email, telegram_username) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [sessionId, name, phone, email, telegramUsername]
    );
    
    // Отправляем уведомление в Telegram
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const message = `🔔 Новая заявка на подбор психолога!

👤 Имя: ${name}
📞 Телефон: ${phone}
📧 Email: ${email}
💬 Telegram: @${telegramUsername}
🆔 Session ID: ${sessionId}
⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

    await bot.sendMessage(chatId, message);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error sending psychologist request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить заявки на подбор психолога
router.get('/psychologist-requests', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM psychologist_requests ORDER BY created_at DESC'
    );
    
    res.json({ success: true, data: result.rows });
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



