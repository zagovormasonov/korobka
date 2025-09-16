import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { pool } from '../index.js';

const router = express.Router();

// Создать платеж
router.post('/create', async (req, res) => {
  try {
    console.log('💳 Запрос на создание платежа:', req.body);
    
    const { sessionId, amount = 100 } = req.body; // 1 рубль = 100 копеек
    
    if (!sessionId) {
      console.error('❌ Отсутствует sessionId');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    const terminalKey = process.env.TINKOFF_TERMINAL_KEY;
    const password = process.env.TINKOFF_PASSWORD;
    
    if (!terminalKey || !password) {
      console.error('❌ Отсутствуют настройки платежей');
      return res.status(500).json({ success: false, error: 'Payment configuration not found' });
    }

    console.log('🔑 Terminal Key:', terminalKey ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    console.log('🔑 Password:', password ? 'установлен' : 'НЕ УСТАНОВЛЕН');

    const orderId = `${sessionId.slice(0, 8)}_${Date.now()}`;
    
    // Проверяем длину OrderId (максимум 50 символов для Тинькофф)
    if (orderId.length > 50) {
      console.error('❌ OrderId слишком длинный:', orderId.length, 'символов');
      return res.status(400).json({ 
        success: false, 
        error: 'OrderId слишком длинный' 
      });
    }
    
    console.log('🆔 OrderId:', orderId, '(длина:', orderId.length, 'символов)');
    
    const paymentData = {
      TerminalKey: terminalKey,
      Amount: amount,
      OrderId: orderId,
      Description: 'Персональный план психического здоровья',
      CustomerKey: sessionId,
      SuccessURL: `${process.env.FRONTEND_URL}/payment-success?sessionId=${sessionId}`,
      FailURL: `${process.env.FRONTEND_URL}/payment?sessionId=${sessionId}&payment=failed`,
      Receipt: {
        Email: 'test@example.com',
        Taxation: 'usn_income',
        Items: [
          {
            Name: 'Персональный план психического здоровья',
            Price: amount,
            Quantity: 1,
            Amount: amount,
            Tax: 'none'
          }
        ]
      }
    };

    // Создаем токен для подписи
    const tokenData = {
      TerminalKey: terminalKey,
      Amount: amount,
      OrderId: orderId,
      Password: password
    };
    
    const token = createToken(tokenData);
    paymentData.Token = token;

    console.log('📤 Отправляем запрос в Тинькофф API...');
    console.log('📋 Данные платежа:', JSON.stringify(paymentData, null, 2));

    const response = await axios.post('https://securepay.tinkoff.ru/v2/Init', paymentData);
    
    console.log('📥 Ответ от Тинькофф:', response.data);
    
    if (response.data.Success) {
      console.log('✅ Платеж успешно создан в Тинькофф');
      
      // Сохраняем информацию о платеже в базу
      await pool.query(
        'INSERT INTO payments (session_id, payment_id, amount, status) VALUES ($1, $2, $3, $4)',
        [sessionId, orderId, amount, 'PENDING']
      );

      console.log('💾 Платеж сохранен в базу данных');

      res.json({
        success: true,
        paymentUrl: response.data.PaymentURL,
        paymentId: orderId
      });
    } else {
      console.error('❌ Ошибка создания платежа в Тинькофф:', response.data.Message);
      res.status(400).json({
        success: false,
        error: response.data.Message || 'Payment creation failed'
      });
    }
  } catch (error) {
    console.error('❌ Ошибка при создании платежа:', error.message);
    
    if (error.response) {
      console.error('📥 Ответ сервера:', error.response.status, error.response.data);
      res.status(400).json({ 
        success: false, 
        error: `Ошибка Тинькофф API: ${error.response.data?.Message || error.message}` 
      });
    } else if (error.request) {
      console.error('📤 Запрос не был отправлен:', error.message);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка сети при обращении к Тинькофф API' 
      });
    } else {
      console.error('🔧 Ошибка настройки запроса:', error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
});

// Проверить статус платежа
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const terminalKey = process.env.TINKOFF_TERMINAL_KEY;
    const password = process.env.TINKOFF_PASSWORD;
    
    const statusData = {
      TerminalKey: terminalKey,
      PaymentId: paymentId,
      Password: password
    };
    
    const token = createToken(statusData);
    
    const response = await axios.post('https://securepay.tinkoff.ru/v2/GetState', {
      TerminalKey: terminalKey,
      PaymentId: paymentId,
      Token: token
    });
    
    if (response.data.Success) {
      const status = response.data.Status;
      
      // Обновляем статус в базе данных
      await pool.query(
        'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE payment_id = $2',
        [status, paymentId]
      );
      
      res.json({
        success: true,
        status: status,
        paid: status === 'CONFIRMED'
      });
    } else {
      res.status(400).json({
        success: false,
        error: response.data.Message || 'Status check failed'
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook для уведомлений от Тинькофф
router.post('/webhook', async (req, res) => {
  try {
    const { TerminalKey, Status, PaymentId, OrderId } = req.body;
    
    // Проверяем подпись
    const receivedToken = req.body.Token;
    const expectedToken = createToken({
      TerminalKey,
      Status,
      PaymentId,
      OrderId,
      Password: process.env.TINKOFF_PASSWORD
    });
    
    if (receivedToken !== expectedToken) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }
    
    // Обновляем статус платежа
    await pool.query(
      'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE payment_id = $2',
      [Status, PaymentId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить статус платежа по sessionId
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM payments WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    const payment = result.rows[0];
    res.json({
      success: true,
      payment: {
        id: payment.payment_id,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Функция для создания токена подписи
function createToken(data) {
  const values = Object.keys(data)
    .filter(key => key !== 'Token')
    .sort()
    .map(key => data[key])
    .join('');
  
  return crypto.createHash('sha256').update(values).digest('hex');
}

export default router;
