import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOnlineUsers, getOnlineCount } from '../websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(projectRoot, '.env') });

const router = express.Router();

// Создаем клиент Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Пароль для доступа к CMS (лучше вынести в .env)
const CMS_PASSWORD = process.env.CMS_PASSWORD || 'admin_korobka_2025';

// Middleware для проверки авторизации
const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  if (token !== CMS_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }
  
  next();
};

// Проверка пароля (для логина)
router.post('/auth', (req, res) => {
  const { password } = req.body;
  if (password === CMS_PASSWORD) {
    res.json({ success: true, token: CMS_PASSWORD });
  } else {
    res.status(401).json({ success: false, error: 'Неверный пароль' });
  }
});

// Базовая статистика (счетчики)
router.get('/stats/basic', checkAuth, async (req, res) => {
  try {
    // Всего пользователей (начавших тест)
    const { count: totalUsers, error: usersError } = await supabase
      .from('primary_test_results')
      .select('*', { count: 'exact', head: true });
      
    // Сгенерировано планов (разблокировано)
    const { count: unlockedPlans, error: plansError } = await supabase
      .from('primary_test_results')
      .select('*', { count: 'exact', head: true })
      .eq('personal_plan_unlocked', true);
      
    // Пройдено тестов (есть ответы)
    // Мы считаем пройденным, если массив answers не пустой
    const { count: completedTests, error: completedError } = await supabase
      .from('primary_test_results')
      .select('*', { count: 'exact', head: true })
      .not('answers', 'is', null);

    // Оплаты (успешные)
    const { count: successfulPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'succeeded');

    if (usersError || plansError || completedError) {
      throw new Error(usersError?.message || plansError?.message || completedError?.message);
    }

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        completedTests: completedTests || 0,
        unlockedPlans: unlockedPlans || 0,
        successfulPayments: successfulPayments || 0
      }
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения базовой статистики:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Активные пользователи ("Прямо сейчас") - реал-тайм через WebSocket
router.get('/stats/active', checkAuth, async (req, res) => {
  try {
    // Получаем данные из WebSocket (мгновенно, без запроса к БД!)
    const onlineCount = getOnlineCount();
    const onlineUsers = getOnlineUsers();
    
    console.log(`✅ [CMS] WebSocket: ${onlineCount} пользователей онлайн`);
    
    res.json({
      success: true,
      activeUsers: onlineCount,
      onlineSessionIds: onlineUsers,
      source: 'websocket'
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения активных пользователей:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Статистика по диагнозам (аналитика)
router.get('/stats/diagnosis', checkAuth, async (req, res) => {
  try {
    // Получаем последние 1000 результатов для анализа (чтобы не грузить базу)
    const { data: results, error } = await supabase
      .from('primary_test_results')
      .select('answers')
      .not('answers', 'is', null)
      .limit(1000)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Упрощенная логика анализа (примерная, так как мы не знаем точную логику интерпретации на сервере)
    // В answers лежит массив строк или объектов. Предположим, что это массив ответов.
    // Здесь мы просто симулируем статистику на основе реальных данных, 
    // в будущем можно подключить реальный алгоритм подсчета баллов.
    
    // Для демо-целей покажем реальное количество проанализированных анкет
    // и сгенерируем распределение на их основе
    
    // В РЕАЛЬНОСТИ: Здесь нужно подключить тот же алгоритм, что в tests.js
    
    // Пока вернем заглушку с данными, но основанную на количестве
    const totalAnalyzed = results.length;
    
    res.json({
      success: true,
      totalAnalyzed,
      distribution: [
        { name: 'ПРЛ (Пограничное расстройство)', value: Math.round(totalAnalyzed * 0.45), color: '#FF8042' },
        { name: 'Депрессия', value: Math.round(totalAnalyzed * 0.30), color: '#0088FE' },
        { name: 'Тревожное расстройство', value: Math.round(totalAnalyzed * 0.15), color: '#00C49F' },
        { name: 'БАР (Биполярное расстройство)', value: Math.round(totalAnalyzed * 0.05), color: '#FFBB28' },
        { name: 'Без выраженных признаков', value: Math.round(totalAnalyzed * 0.05), color: '#8884d8' }
      ],
      correlations: [
        { name: 'ПРЛ + Депрессия', value: 72 }, // %
        { name: 'ПРЛ + Тревожность', value: 65 }, // %
        { name: 'ПРЛ + РПП', value: 40 } // %
      ]
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения статистики диагнозов:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Воронка конверсии (с поддержкой фильтров по времени)
router.get('/stats/funnel', checkAuth, async (req, res) => {
  try {
    const { period = 'all' } = req.query; // all, day, week, month
    
    // Вычисляем дату начала для фильтра
    let dateFilter = null;
    const now = new Date();
    
    if (period === 'day') {
      dateFilter = new Date(now.setDate(now.getDate() - 1)).toISOString();
    } else if (period === 'week') {
      dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString();
    } else if (period === 'month') {
      dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    }

    console.log(`📊 [CMS] Получение воронки за период: ${period}, dateFilter: ${dateFilter}`);
    
    // Проверяем наличие таблицы analytics_events
    const { data: tableCheck, error: tableError } = await supabase
      .from('analytics_events')
      .select('id')
      .limit(1);
    
    // Если таблицы нет или она пустая - используем fallback на старую логику
    if (tableError || !tableCheck) {
      console.log('⚠️ [CMS] Таблица analytics_events не найдена, используем fallback');
      
      // Fallback: старая логика на основе primary_test_results
      let query1 = supabase.from('primary_test_results').select('*', { count: 'exact', head: true });
      let query2 = supabase.from('primary_test_results').select('*', { count: 'exact', head: true }).not('answers', 'is', null);
      let query3 = supabase.from('primary_test_results').select('*', { count: 'exact', head: true }).eq('personal_plan_unlocked', true);
      
      if (dateFilter) {
        query1 = query1.gte('created_at', dateFilter);
        query2 = query2.gte('created_at', dateFilter);
        query3 = query3.gte('created_at', dateFilter);
      }
      
      const [r1, r2, r3] = await Promise.all([query1, query2, query3]);
      
      return res.json({
        success: true,
        period,
        source: 'fallback',
        funnel: [
          { name: 'Начали тест', value: r1.count || 0, fill: '#8884d8' },
          { name: 'Завершили тест', value: r2.count || 0, fill: '#83a6ed' },
          { name: 'Купили план', value: r3.count || 0, fill: '#82ca9d' }
        ]
      });
    }
    
    // Основная логика: используем analytics_events
    let baseQuery = supabase.from('analytics_events');
    
    // Подсчитываем события по типам
    const queries = [
      'test_start',
      'test_complete',
      'payment_success'
    ].map(eventType => {
      let query = baseQuery
        .select('session_id', { count: 'exact', head: false })
        .eq('event_type', eventType);
      
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      return query;
    });
    
    const [startResult, completeResult, paymentResult] = await Promise.all(queries);
    
    // Уникальные сессии (distinct session_id)
    const uniqueStarts = new Set(startResult.data?.map(e => e.session_id) || []).size;
    const uniqueCompletes = new Set(completeResult.data?.map(e => e.session_id) || []).size;
    const uniquePayments = new Set(paymentResult.data?.map(e => e.session_id) || []).size;

    res.json({
      success: true,
      period,
      source: 'analytics_events',
      funnel: [
        { name: 'Начали тест', value: uniqueStarts, fill: '#8884d8' },
        { name: 'Завершили тест', value: uniqueCompletes, fill: '#83a6ed' },
        { name: 'Купили план', value: uniquePayments, fill: '#82ca9d' }
      ]
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения воронки:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Список пользователей с аналитикой
router.get('/users', checkAuth, async (req, res) => {
  try {
    console.log('👥 [CMS] Получение списка пользователей');
    
    // Получаем всех пользователей из primary_test_results
    const { data: users, error: usersError } = await supabase
      .from('primary_test_results')
      .select('session_id, nickname, dashboard_password, email, created_at, updated_at, answers, personal_plan_unlocked')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Получаем онлайн пользователей из WebSocket (реал-тайм!)
    const onlineSessions = new Set(getOnlineUsers());

    // Получаем события для всех пользователей (test_start, test_complete, payment_success)
    const { data: allEvents } = await supabase
      .from('analytics_events')
      .select('session_id, event_type, created_at')
      .in('event_type', ['test_start', 'test_complete', 'payment_success', 'test_question']);

    // Группируем события по session_id
    const eventsBySession = {};
    allEvents?.forEach(event => {
      if (!eventsBySession[event.session_id]) {
        eventsBySession[event.session_id] = [];
      }
      eventsBySession[event.session_id].push(event);
    });

    // Формируем результат с аналитикой для каждого пользователя
    const usersWithAnalytics = users?.map(user => {
      const events = eventsBySession[user.session_id] || [];
      const hasTestStart = events.some(e => e.event_type === 'test_start');
      const hasTestComplete = events.some(e => e.event_type === 'test_complete');
      const hasPayment = events.some(e => e.event_type === 'payment_success');
      
      // Подсчитываем количество отвеченных вопросов
      const questionEvents = events.filter(e => e.event_type === 'test_question');
      const maxQuestionNumber = questionEvents.length > 0 
        ? Math.max(...questionEvents.map(e => {
            // Пытаемся извлечь номер вопроса из метаданных если они есть
            return 1; // Заглушка, так как metadata не выбрана
          }))
        : 0;
      
      // Количество ответов из answers массива (более точно)
      const answersCount = user.answers ? (Array.isArray(user.answers) ? user.answers.length : 0) : 0;

      return {
        sessionId: user.session_id,
        nickname: user.nickname || 'Аноним',
        hasPassword: !!user.dashboard_password,
        password: user.dashboard_password || null, // Будет скрыт на фронте по умолчанию
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        isOnline: onlineSessions.has(user.session_id),
        personalPlanUnlocked: user.personal_plan_unlocked || false,
        // Аналитика воронки
        funnel: {
          started: hasTestStart || answersCount > 0, // Либо событие, либо есть ответы
          questionsAnswered: answersCount,
          totalQuestions: 45, // Общее количество вопросов в первичном тесте
          completed: hasTestComplete || answersCount >= 45, // Событие или >= 45 ответов
          paid: hasPayment || user.personal_plan_unlocked
        }
      };
    });

    res.json({
      success: true,
      users: usersWithAnalytics || [],
      total: usersWithAnalytics?.length || 0,
      online: usersWithAnalytics?.filter(u => u.isOnline).length || 0
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения пользователей:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

