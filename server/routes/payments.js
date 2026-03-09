import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { supabase } from '../index.js';

const router = express.Router();

// Создать платеж
router.post('/create', async (req, res) => {
  try {
    console.log('💳 Запрос на создание платежа:', req.body);
    
    const { sessionId, amount = 1000 } = req.body; // 10 рублей = 1000 копеек
    
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
    console.log('🔑 Terminal Key значение:', terminalKey);
    console.log('🔑 Это DEMO ключ?', terminalKey?.includes('DEMO'));

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
    // Принудительно используем idenself.ru для перенаправлений после оплаты
    const baseUrl = process.env.FRONTEND_URL || 'https://idenself.ru';
    console.log('🌐 Base URL для платежей:', baseUrl);
    console.log('🌐 SuccessURL:', `${baseUrl}/payment-success?sessionId=${sessionId}`);
    console.log('🌐 FailURL:', `${baseUrl}/payment?sessionId=${sessionId}&payment=failed`);
    
    const paymentData = {
      TerminalKey: terminalKey,
      Amount: amount,
      OrderId: orderId,
      Description: 'Персональный план психологического благополучия',
      CustomerKey: sessionId,
      SuccessURL: `${baseUrl}/payment-success?sessionId=${sessionId}`,
      FailURL: `${baseUrl}/payment?sessionId=${sessionId}&payment=failed`,
      Receipt: {
        Email: 'test@example.com',
        Taxation: 'usn_income',
        Items: [
          {
            Name: 'Персональный план психологического благополучия',
            Price: amount,
            Quantity: 1,
            Amount: amount,
            Tax: 'none'
          }
        ]
      }
    };

    // Создаем токен для подписи - добавляем Password к данным платежа
    const tokenData = {
      ...paymentData,
      Password: password
    };
    
    const token = createToken(tokenData);
    paymentData.Token = token;

    console.log('📤 Отправляем запрос в Тинькофф API...');
    console.log('📋 Данные платежа:', JSON.stringify(paymentData, null, 2));
    console.log('🔐 Token для подписи:', token);
    console.log('🔑 TerminalKey:', terminalKey);
    console.log('💰 Amount:', amount);
    console.log('🆔 OrderId:', orderId);

    const response = await axios.post('https://securepay.tinkoff.ru/v2/Init', paymentData);
    
    console.log('📥 Ответ от Тинькофф:', response.data);
    console.log('📥 Статус ответа:', response.status);
    console.log('📥 Заголовки ответа:', response.headers);
    
    if (response.data.Success) {
      console.log('✅ Платеж успешно создан в Тинькофф');
      
      // Сохраняем информацию о платеже в базу
      const { data, error } = await supabase
        .from('payments')
        .insert({
          session_id: sessionId,
          payment_id: orderId,
          amount: amount,
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('💾 Платеж сохранен в базу данных');

      res.json({
        success: true,
        paymentUrl: response.data.PaymentURL,
        paymentId: orderId
      });
    } else {
      console.error('❌ Ошибка создания платежа в Тинькофф:', response.data);
      console.error('❌ Код ошибки:', response.data.ErrorCode);
      console.error('❌ Сообщение ошибки:', response.data.Message);
      console.error('❌ Детали ошибки:', response.data.Details);
      res.status(400).json({
        success: false,
        error: response.data.Message || 'Payment creation failed',
        errorCode: response.data.ErrorCode,
        details: response.data.Details
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
      
      console.log('📊 Статус платежа из Тинькофф:', status);
      
      // Обновляем статус в базе данных
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);

      if (error) throw error;
      
      console.log('💾 Статус платежа обновлен в БД');
      
      // ВАЖНО: НЕ разблокируем персональный план автоматически!
      // Разблокировка происходит только после прохождения дополнительных тестов
      if (status === 'CONFIRMED') {
        console.log('✅ Платеж подтвержден');
        console.log('ℹ️ Персональный план будет разблокирован после прохождения дополнительных тестов');
      }
      
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
    
    console.log('🔔 Получен webhook от Тинькофф:', { Status, PaymentId, OrderId });
    
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
      console.error('❌ Неверная подпись webhook');
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }
    
    console.log('✅ Подпись webhook валидна');
    
    // Обновляем статус платежа
    const { error } = await supabase
      .from('payments')
      .update({ 
        status: Status,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', PaymentId);

    if (error) throw error;
    
    console.log('💾 Статус платежа обновлен в БД');
    
    // ВАЖНО: НЕ разблокируем персональный план автоматически!
    // Разблокировка происходит только после прохождения дополнительных тестов
    if (Status === 'CONFIRMED') {
      console.log('✅ [WEBHOOK] Платеж подтвержден');
      console.log('ℹ️ [WEBHOOK] Персональный план будет разблокирован после прохождения дополнительных тестов');
    }
    
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
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    res.json({
      success: true,
      payment: {
        id: data.payment_id,
        amount: data.amount,
        status: data.status,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Функция для создания токена подписи согласно документации Тинькофф
// Алгоритм: SHA-256 от конкатенации ЗНАЧЕНИЙ полей, отсортированных по алфавиту КЛЮЧЕЙ
function createToken(data) {
  // Исключаем Token, Receipt, и любые объекты из подписи
  const filteredData = {};
  for (const key in data) {
    if (key !== 'Token' && key !== 'Receipt' && typeof data[key] !== 'object') {
      filteredData[key] = data[key];
    }
  }
  
  console.log('🔐 Данные для токена:', filteredData);
  
  // Сортируем ключи по алфавиту и берем только ЗНАЧЕНИЯ
  const sortedKeys = Object.keys(filteredData).sort();
  const values = sortedKeys.map(key => filteredData[key]);
  const tokenString = values.join('');
  
  console.log('🔐 Отсортированные ключи:', sortedKeys);
  console.log('🔐 Значения для подписи:', values);
  console.log('🔐 Строка для подписи:', tokenString);
  
  const token = crypto.createHash('sha256').update(tokenString).digest('hex');
  console.log('🔐 Сгенерированный токен:', token);
  
  return token;
}

export default router;
