import express from 'express';
import { supabase } from '../index.js';
import crypto from 'crypto';

const router = express.Router();

// Тестовый endpoint для проверки работы роута
router.get('/test-route', (req, res) => {
  console.log('🧪 [DASHBOARD] Test route called');
  res.json({ 
    success: true, 
    message: 'Dashboard route is working!',
    timestamp: new Date().toISOString()
  });
});

// Проверить валидность токена доступа
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    console.log('🔐 [DASHBOARD] Проверяем токен:', token.substring(0, 20) + '...');

    // Ищем пользователя по токену
    const { data: user, error } = await supabase
      .from('primary_test_results')
      .select('session_id, nickname')
      .eq('dashboard_token', token)
      .maybeSingle();

    if (error) {
      console.error('❌ [DASHBOARD] Ошибка при проверке токена:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!user) {
      console.log('❌ [DASHBOARD] Токен не найден в БД');
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    console.log('✅ [DASHBOARD] Токен валиден, sessionId:', user.session_id);

    res.json({ 
      success: true, 
      sessionId: user.session_id,
      nickname: user.nickname || ''
    });
  } catch (error) {
    console.error('❌ [DASHBOARD] Ошибка при проверке токена:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Проверить доступность никнейма
router.post('/check-nickname', async (req, res) => {
  try {
    const { nickname } = req.body;

    if (!nickname) {
      return res.status(400).json({ success: false, error: 'Nickname is required' });
    }

    console.log('🔍 [DASHBOARD] Проверяем доступность никнейма:', nickname);

    const { data: existingNickname, error } = await supabase
      .from('primary_test_results')
      .select('id, nickname')
      .eq('nickname', nickname)
      .maybeSingle();

    if (error && !error.message.includes('nickname')) {
      console.error('❌ [DASHBOARD] Ошибка при проверке никнейма:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const available = !existingNickname;
    console.log(available ? '✅ [DASHBOARD] Никнейм доступен' : '❌ [DASHBOARD] Никнейм занят');

    res.json({ success: true, available });
  } catch (error) {
    console.error('❌ [DASHBOARD] Ошибка при проверке никнейма:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Создать учетные данные для доступа к ЛК
router.post('/create-credentials', async (req, res) => {
  try {
    console.log('📥 [DASHBOARD] Получен запрос на создание учетных данных');
    console.log('📋 [DASHBOARD] Тело запроса:', JSON.stringify(req.body, null, 2));
    
    const { sessionId, nickname, password } = req.body;

    console.log('🔍 [DASHBOARD] Извлеченные данные:', { sessionId, nickname, password });

    if (!sessionId || !nickname || !password) {
      console.log('❌ [DASHBOARD] Не все поля заполнены');
      return res.status(400).json({ 
        success: false, 
        error: 'Все поля обязательны' 
      });
    }

    // Сначала проверим, что вообще есть в таблице
    console.log('🔍 [DASHBOARD] Проверяем все записи в таблице...');
    const { data: allRecords, error: allError } = await supabase
      .from('primary_test_results')
      .select('id, session_id')
      .limit(5);

    if (allError) {
      console.error('❌ [DASHBOARD] Ошибка при получении всех записей:', allError);
    } else {
      console.log('📊 [DASHBOARD] Всего записей в таблице:', allRecords?.length || 0);
      console.log('📊 [DASHBOARD] Первые записи:', allRecords);
    }

    // Теперь проверим, существует ли конкретная сессия
    console.log('🔍 [DASHBOARD] Проверяем существование сессии:', sessionId);
    const { data: existingSession, error: checkError } = await supabase
      .from('primary_test_results')
      .select('id, session_id')
      .eq('session_id', sessionId)
      .maybeSingle(); // Используем maybeSingle вместо single

    if (checkError) {
      console.error('❌ [DASHBOARD] Ошибка при проверке сессии:', checkError);
      return res.status(500).json({ 
        success: false, 
        error: `Ошибка при проверке сессии: ${checkError.message}` 
      });
    }

    if (!existingSession) {
      console.log('❌ [DASHBOARD] Сессия не найдена в базе данных');
      console.log('🔍 [DASHBOARD] Искали sessionId:', sessionId);
      return res.status(404).json({ 
        success: false, 
        error: 'Сессия не найдена в базе данных' 
      });
    }

    console.log('✅ [DASHBOARD] Сессия найдена:', existingSession);

    // Проверяем, не занят ли уже этот никнейм
    console.log('🔍 [DASHBOARD] Проверяем уникальность никнейма:', nickname);
    const { data: existingNickname, error: nicknameCheckError } = await supabase
      .from('primary_test_results')
      .select('id, nickname, session_id')
      .eq('nickname', nickname)
      .maybeSingle();

    if (nicknameCheckError) {
      // Если ошибка не связана с отсутствием поля, возвращаем ее
      if (!nicknameCheckError.message.includes('nickname')) {
        console.error('❌ [DASHBOARD] Ошибка при проверке никнейма:', nicknameCheckError);
        return res.status(500).json({ 
          success: false, 
          error: `Ошибка при проверке никнейма: ${nicknameCheckError.message}` 
        });
      }
      // Если поля nickname не существует, продолжаем без проверки
      console.log('⚠️ [DASHBOARD] Поле nickname не существует в таблице, пропускаем проверку уникальности');
    } else if (existingNickname && existingNickname.session_id !== sessionId) {
      // Никнейм уже занят другим пользователем
      console.log('❌ [DASHBOARD] Никнейм уже занят');
      return res.status(400).json({ 
        success: false, 
        error: 'Этот никнейм уже занят. Пожалуйста, выберите другой' 
      });
    }

    console.log('✅ [DASHBOARD] Никнейм свободен или принадлежит текущей сессии');

    // Генерируем уникальный токен для доступа к ЛК
    const dashboardToken = crypto.randomUUID();
    console.log('🔑 [DASHBOARD] Сгенерированный токен:', dashboardToken);

    // Обновляем запись в primary_test_results
    console.log('💾 [DASHBOARD] Обновляем запись с данными:', {
      nickname, 
      dashboard_token: dashboardToken,
      sessionId
    });

    // Сначала попробуем с nickname
    let { data, error } = await supabase
      .from('primary_test_results')
      .update({
        nickname: nickname,
        dashboard_password: password,
        dashboard_token: dashboardToken,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .maybeSingle();

    // Если ошибка связана с отсутствием поля nickname, попробуем без него
    if (error && error.message && error.message.includes('nickname')) {
      console.log('⚠️ [DASHBOARD] Поле nickname не существует, пробуем без него');
      
      const result = await supabase
        .from('primary_test_results')
        .update({
          dashboard_password: password,
          dashboard_token: dashboardToken,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .maybeSingle();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('❌ [DASHBOARD] Ошибка при сохранении учетных данных:', error);
      console.error('❌ [DASHBOARD] Детали ошибки:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({ 
        success: false, 
        error: `Ошибка при сохранении данных: ${error.message}` 
      });
    }

    if (!data) {
      console.log('❌ [DASHBOARD] Данные не обновлены (сессия не найдена)');
      return res.status(404).json({ 
        success: false, 
        error: 'Сессия не найдена' 
      });
    }

    console.log('✅ [DASHBOARD] Учетные данные успешно сохранены для сессии:', sessionId);
    console.log('✅ [DASHBOARD] Обновленные данные:', data);

    res.json({ 
      success: true, 
      dashboardToken,
      message: 'Учетные данные успешно сохранены'
    });

  } catch (error) {
    console.error('❌ [DASHBOARD] Критическая ошибка при создании учетных данных:', error);
    console.error('❌ [DASHBOARD] Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: `Внутренняя ошибка сервера: ${error.message}` 
    });
  }
});

export default router;
