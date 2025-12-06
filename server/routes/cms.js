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

// Функция анализа предполагаемых диагнозов на основе первичного опросника
function analyzeDiagnosis(answers) {
  // Инициализируем счетчики для каждого диагноза
  const scores = {
    bpd: 0,        // Пограничное расстройство личности
    depression: 0,  // Депрессия
    anxiety: 0,     // Тревожное расстройство
    bipolar: 0,     // Биполярное расстройство
    adhd: 0,        // СДВГ
    ptsd: 0,        // ПТСР
    ocd: 0,         // ОКР
    eating: 0,      // Расстройства пищевого поведения
    substance: 0,   // Зависимость от веществ
    dissociative: 0 // Диссоциативное расстройство
  };
  
  // Анализируем ответы (answers - массив объектов с questionId и answer)
  answers.forEach(ans => {
    const qId = ans.questionId;
    const answer = ans.answer;
    
    // Биполярное расстройство (БАР)
    if ([2, 18].includes(qId) && answer === 'yes') scores.bipolar += 2;
    if (qId === 2 && typeof answer === 'number' && answer >= 7) scores.bipolar += 1;
    
    // Пограничное расстройство личности (ПРЛ)
    if ([4, 17, 19, 22, 26, 38].includes(qId) && answer === 'yes') scores.bpd += 1.5;
    if ([19, 22].includes(qId) && typeof answer === 'number' && answer >= 7) scores.bpd += 1;
    
    // СДВГ
    if ([3, 11, 16].includes(qId) && answer === 'yes') scores.adhd += 2;
    if ([3, 11].includes(qId) && typeof answer === 'number' && answer >= 6) scores.adhd += 1;
    
    // ПТСР
    if ([6, 34].includes(qId) && answer === 'yes') scores.ptsd += 2;
    if (qId === 6 && typeof answer === 'number' && answer >= 7) scores.ptsd += 1;
    
    // Депрессия
    if ([2, 3, 18].includes(qId) && answer === 'yes') scores.depression += 1.5;
    if ([25, 27, 29].includes(qId) && typeof answer === 'number' && answer >= 7) scores.depression += 1;
    
    // Тревожное расстройство
    if ([5, 12, 21].includes(qId) && answer === 'yes') scores.anxiety += 1.5;
    if ([5, 12].includes(qId) && typeof answer === 'number' && answer >= 7) scores.anxiety += 1;
    
    // ОКР
    if (qId === 13 && answer === 'yes') scores.ocd += 3;
    if (qId === 13 && typeof answer === 'number' && answer >= 7) scores.ocd += 1;
    
    // Расстройства пищевого поведения
    if (qId === 7 && answer === 'yes') scores.eating += 3;
    if (qId === 7 && typeof answer === 'number' && answer >= 7) scores.eating += 1;
    
    // Зависимость от веществ
    if ([8, 32].includes(qId) && answer === 'yes') scores.substance += 2;
    
    // Диссоциативное расстройство
    if ([14, 25].includes(qId) && answer === 'yes') scores.dissociative += 2;
    if (qId === 14 && typeof answer === 'number' && answer >= 7) scores.dissociative += 1;
  });
  
  return scores;
}

// Статистика по предполагаемым диагнозам на основе первичного опросника
router.get('/stats/diagnosis', checkAuth, async (req, res) => {
  try {
    console.log('📊 [CMS] Получение статистики предполагаемых диагнозов');
    
    // Получаем последние 1000 результатов для анализа
    const { data: results, error } = await supabase
      .from('primary_test_results')
      .select('answers')
      .not('answers', 'is', null)
      .limit(1000)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Подсчитываем реальные диагнозы из ответов
    const diagnosisCounts = {
      bpd: 0,
      depression: 0,
      anxiety: 0,
      bipolar: 0,
      adhd: 0,
      ptsd: 0,
      ocd: 0,
      eating: 0,
      substance: 0,
      dissociative: 0,
      none: 0
    };
    
    // Для подсчета коморбидности
    const comorbidity = {
      bpdDepression: 0,
      bpdAnxiety: 0,
      bpdEating: 0,
      total: 0
    };
    
    results.forEach(result => {
      if (!result.answers || !Array.isArray(result.answers)) return;
      
      const scores = analyzeDiagnosis(result.answers);
      
      // Определяем какие диагнозы превышают пороговые значения
      const diagnosed = {
        bpd: scores.bpd >= 4,
        depression: scores.depression >= 3,
        anxiety: scores.anxiety >= 3,
        bipolar: scores.bipolar >= 3,
        adhd: scores.adhd >= 3,
        ptsd: scores.ptsd >= 3,
        ocd: scores.ocd >= 3,
        eating: scores.eating >= 3,
        substance: scores.substance >= 2,
        dissociative: scores.dissociative >= 3
      };
      
      // Подсчитываем диагнозы
      let hasAnyDiagnosis = false;
      Object.keys(diagnosed).forEach(key => {
        if (diagnosed[key]) {
          diagnosisCounts[key]++;
          hasAnyDiagnosis = true;
        }
      });
      
      if (!hasAnyDiagnosis) {
        diagnosisCounts.none++;
      }
      
      // Подсчитываем коморбидность (если есть ПРЛ)
      if (diagnosed.bpd) {
        comorbidity.total++;
        if (diagnosed.depression) comorbidity.bpdDepression++;
        if (diagnosed.anxiety) comorbidity.bpdAnxiety++;
        if (diagnosed.eating) comorbidity.bpdEating++;
      }
    });
    
    const totalAnalyzed = results.length;
    
    console.log(`✅ [CMS] Проанализировано ${totalAnalyzed} анкет`);
    console.log(`📊 [CMS] Распределение диагнозов:`, diagnosisCounts);
    
    res.json({
      success: true,
      totalAnalyzed,
      distribution: [
        { name: 'ПРЛ (Пограничное расстройство)', value: diagnosisCounts.bpd, color: '#FF8042' },
        { name: 'Депрессия', value: diagnosisCounts.depression, color: '#0088FE' },
        { name: 'Тревожное расстройство', value: diagnosisCounts.anxiety, color: '#00C49F' },
        { name: 'БАР (Биполярное расстройство)', value: diagnosisCounts.bipolar, color: '#FFBB28' },
        { name: 'СДВГ', value: diagnosisCounts.adhd, color: '#8DD1E1' },
        { name: 'ПТСР', value: diagnosisCounts.ptsd, color: '#A4DE6C' },
        { name: 'ОКР', value: diagnosisCounts.ocd, color: '#D0ED57' },
        { name: 'РПП', value: diagnosisCounts.eating, color: '#FFC658' },
        { name: 'Зависимость от веществ', value: diagnosisCounts.substance, color: '#FF6B9D' },
        { name: 'Диссоциативное расстройство', value: diagnosisCounts.dissociative, color: '#C3AED6' },
        { name: 'Без выраженных признаков', value: diagnosisCounts.none, color: '#8884d8' }
      ],
      correlations: comorbidity.total > 0 ? [
        { 
          name: 'ПРЛ + Депрессия', 
          value: Math.round((comorbidity.bpdDepression / comorbidity.total) * 100) 
        },
        { 
          name: 'ПРЛ + Тревожность', 
          value: Math.round((comorbidity.bpdAnxiety / comorbidity.total) * 100) 
        },
        { 
          name: 'ПРЛ + РПП', 
          value: Math.round((comorbidity.bpdEating / comorbidity.total) * 100) 
        }
      ] : [
        { name: 'ПРЛ + Депрессия', value: 0 },
        { name: 'ПРЛ + Тревожность', value: 0 },
        { name: 'ПРЛ + РПП', value: 0 }
      ]
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения статистики диагнозов:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Детальная воронка конверсии с отслеживанием каждого шага
router.get('/stats/detailed-funnel', checkAuth, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    console.log(`📊 [CMS] Получение детальной воронки за период: ${period}`);
    
    // Вычисляем дату начала для фильтра
    let dateFilter = null;
    const now = new Date();
    
    if (period === 'day') {
      dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    } else if (period === 'week') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (period === 'month') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // Функция для подсчета уникальных пользователей по событию
    const countUniqueUsers = async (eventType, additionalFilter = null) => {
      let query = supabase
        .from('analytics_events')
        .select('session_id', { count: 'exact' })
        .eq('event_type', eventType);
      
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      if (additionalFilter) {
        query = additionalFilter(query);
      }
      
      const { data, error } = await query;
      if (error) return 0;
      
      // Уникальные session_id
      const uniqueSessions = new Set(data?.map(e => e.session_id) || []);
      return uniqueSessions.size;
    };
    
    // Подсчет по каждому вопросу
    const questionStats = [];
    for (let i = 1; i <= 45; i++) {
      const count = await countUniqueUsers('test_question', (query) => 
        query.contains('metadata', { question_number: i })
      );
      questionStats.push({
        step: `Вопрос ${i}`,
        users: count,
        stage: `question_${i}`
      });
    }
    
    // Основные этапы
    const testStart = await countUniqueUsers('test_start');
    const testComplete = await countUniqueUsers('test_complete');
    const paymentInit = await countUniqueUsers('payment_init');
    const paymentSuccess = await countUniqueUsers('payment_success');
    const planUnlocked = await countUniqueUsers('plan_unlocked');
    
    // PDF скачивания (подсчет уникальных пользователей по количеству скачанных PDFs)
    const { data: pdfEvents, error: pdfError } = await supabase
      .from('analytics_events')
      .select('session_id, metadata')
      .eq('event_type', 'pdf_download');
    
    if (pdfError) throw pdfError;
    
    // Группируем по session_id и считаем количество уникальных PDFs
    const pdfsByUser = {};
    pdfEvents?.forEach(event => {
      if (!pdfsByUser[event.session_id]) {
        pdfsByUser[event.session_id] = new Set();
      }
      if (event.metadata?.pdf_number) {
        pdfsByUser[event.session_id].add(event.metadata.pdf_number);
      }
    });
    
    // Считаем сколько пользователей скачали 1, 2 или 3 PDF
    let usersWithOnePdf = 0;
    let usersWithTwoPdf = 0;
    let usersWithThreePdf = 0;
    
    Object.values(pdfsByUser).forEach(pdfs => {
      if (pdfs.size >= 1) usersWithOnePdf++;
      if (pdfs.size >= 2) usersWithTwoPdf++;
      if (pdfs.size >= 3) usersWithThreePdf++;
    });
    
    const pdfDownloads = {
      one: usersWithOnePdf,
      two: usersWithTwoPdf,
      three: usersWithThreePdf
    };
    
    // Заявка на психолога
    const psychologistRequest = await countUniqueUsers('psychologist_request');
    
    // Обратная связь
    const feedbackSent = await countUniqueUsers('feedback_sent');
    
    // Формируем детальную воронку
    const detailedFunnel = [
      { step: 'Начали тест', users: testStart, stage: 'test_start' },
      ...questionStats,
      { step: 'Завершили тест и попали на страницу оплаты', users: testComplete, stage: 'test_complete' },
      { step: 'Инициировали оплату', users: paymentInit, stage: 'payment_init' },
      { step: 'Оплатили', users: paymentSuccess, stage: 'payment_success' },
      { step: 'Получили персональный план', users: planUnlocked, stage: 'plan_unlocked' },
      { step: 'Скачали 1 PDF', users: pdfDownloads.one, stage: 'pdf_1' },
      { step: 'Скачали 2 PDF', users: pdfDownloads.two, stage: 'pdf_2' },
      { step: 'Скачали все 3 PDF', users: pdfDownloads.three, stage: 'pdf_3' },
      { step: 'Оставили заявку на психолога', users: psychologistRequest, stage: 'psychologist' },
      { step: 'Использовали обратную связь', users: feedbackSent, stage: 'feedback' }
    ];
    
    res.json({
      success: true,
      period,
      funnel: detailedFunnel,
      totalSteps: detailedFunnel.length
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения детальной воронки:', error);
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

// График активности по времени
router.get('/stats/activity-by-hour', checkAuth, async (req, res) => {
  try {
    const { period = 'day', pages = 'all', date } = req.query;
    
    console.log('📊 [CMS] Получение активности за период:', period, 'дата:', date, 'страницы:', pages);
    
    // Определяем временной диапазон на основе выбранной даты
    const selectedDate = date ? new Date(date) : new Date();
    let startDate, endDate;
    
    if (period === 'day') {
      // За конкретные сутки (00:00 - 23:59 выбранного дня в UTC, но с учётом московского времени)
      // Вычитаем 3 часа из начала дня чтобы получить московский полдень в UTC
      startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      startDate = new Date(startDate.getTime() - 3 * 60 * 60 * 1000); // Московское время -> UTC
      
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (period === 'week') {
      // За неделю начиная с понедельника выбранной недели
      const dayOfWeek = selectedDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Понедельник
      
      startDate = new Date(selectedDate);
      startDate.setDate(selectedDate.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      startDate = new Date(startDate.getTime() - 3 * 60 * 60 * 1000);
      
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      // За весь выбранный месяц
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
      startDate = new Date(startDate.getTime() - 3 * 60 * 60 * 1000);
      
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1, 0, 0, 0, 0);
      endDate = new Date(endDate.getTime() - 3 * 60 * 60 * 1000);
    }
    
    // Получаем heartbeat события за выбранный период
    let query = supabase
      .from('analytics_events')
      .select('created_at, session_id, page_url')
      .eq('event_type', 'heartbeat')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());
    
    const { data: events, error } = await query;
    
    if (error) throw error;
    
    // Фильтруем события по страницам, если указаны фильтры
    let filteredEvents = events || [];
    if (pages && pages !== 'all') {
      const pageFilters = pages.split(',');
      filteredEvents = events?.filter(event => {
        const url = event.page_url || '';
        
        if (pageFilters.includes('homepage') && url === '/') return true;
        if (pageFilters.includes('test') && (url.startsWith('/test') || url.startsWith('/bpd-test'))) return true;
        if (pageFilters.includes('dashboard') && (url.startsWith('/dashboard') || url.startsWith('/personal-plan') || url.startsWith('/feedback-chat'))) return true;
        if (pageFilters.includes('other') && url !== '/' && !url.startsWith('/test') && !url.startsWith('/bpd-test') && !url.startsWith('/dashboard') && !url.startsWith('/personal-plan') && !url.startsWith('/feedback-chat')) return true;
        
        return false;
      }) || [];
    }
    
    let activityData = [];
    
    // Группируем данные в зависимости от периода
    if (period === 'day') {
      // За сутки: по часам (0-23) в московском времени (UTC+3)
      const hourlyActivity = new Array(24).fill(0).map((_, hour) => ({
        index: hour,
        label: `${hour}:00`,
        users: new Set()
      }));
      
      filteredEvents.forEach(event => {
        // Конвертируем в московское время (UTC+3)
        const date = new Date(event.created_at);
        const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
        const hour = moscowDate.getUTCHours();
        
        hourlyActivity[hour].users.add(event.session_id);
      });
      
      activityData = hourlyActivity.map(item => ({
        index: item.index,
        label: item.label,
        users: item.users.size
      }));
      
    } else if (period === 'week') {
      // За неделю: по дням недели (Пн-Вс)
      const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const weeklyActivity = weekDays.map((day, index) => ({
        index: index,
        label: day,
        users: new Set()
      }));
      
      filteredEvents.forEach(event => {
        // Конвертируем в московское время (UTC+3)
        const date = new Date(event.created_at);
        const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
        let dayOfWeek = moscowDate.getUTCDay(); // 0=Вс, 1=Пн, ..., 6=Сб
        
        // Преобразуем: Вс(0) -> 6, Пн(1) -> 0, ..., Сб(6) -> 5
        dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        weeklyActivity[dayOfWeek].users.add(event.session_id);
      });
      
      activityData = weeklyActivity.map(item => ({
        index: item.index,
        label: item.label,
        users: item.users.size
      }));
      
    } else if (period === 'month') {
      // За месяц: по дням месяца (1-31) в московском времени
      const daysInMonth = 31;
      const monthlyActivity = Array.from({ length: daysInMonth }, (_, i) => ({
        index: i + 1,
        label: `${i + 1}`,
        users: new Set()
      }));
      
      filteredEvents.forEach(event => {
        // Конвертируем в московское время (UTC+3)
        const date = new Date(event.created_at);
        const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
        const dayOfMonth = moscowDate.getUTCDate();
        
        if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth) {
          monthlyActivity[dayOfMonth - 1].users.add(event.session_id);
        }
      });
      
      activityData = monthlyActivity.map(item => ({
        index: item.index,
        label: item.label,
        users: item.users.size
      }));
    }
    
    console.log(`✅ [CMS] Данные активности сформированы: ${activityData.length} точек`);
    
    res.json({
      success: true,
      data: activityData,
      period,
      totalEvents: filteredEvents.length
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения активности:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Тепловая карта активности (день недели × час) и прогнозирование
router.get('/stats/heatmap', checkAuth, async (req, res) => {
  try {
    console.log('🔥 [CMS] Получение тепловой карты активности');
    
    // Получаем все heartbeat события за последние 30 дней
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('created_at, session_id')
      .eq('event_type', 'heartbeat')
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (error) throw error;
    
    // Создаём тепловую карту: 7 дней × 24 часа
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const heatmapMatrix = weekDays.map((day, dayIndex) => {
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        day: day,
        hour: hour,
        users: new Set()
      }));
      return { dayIndex, hourlyData };
    });
    
    // Заполняем данные
    events?.forEach(event => {
      const moscowDate = new Date(new Date(event.created_at).getTime() + 3 * 60 * 60 * 1000);
      let dayOfWeek = moscowDate.getUTCDay();
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Пн=0, ..., Вс=6
      const hour = moscowDate.getUTCHours();
      
      heatmapMatrix[dayOfWeek].hourlyData[hour].users.add(event.session_id);
    });
    
    // Формируем данные для тепловой карты
    const heatmap = [];
    heatmapMatrix.forEach(({ dayIndex, hourlyData }) => {
      hourlyData.forEach(({ day, hour, users }) => {
        heatmap.push({
          day: day,
          hour: hour,
          users: users.size
        });
      });
    });
    
    // Прогнозирование пиковых часов
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour,
      totalUsers: 0,
      count: 0
    }));
    
    heatmapMatrix.forEach(({ hourlyData }) => {
      hourlyData.forEach(({ hour, users }) => {
        hourlyStats[hour].totalUsers += users.size;
        if (users.size > 0) hourlyStats[hour].count++;
      });
    });
    
    // Средняя активность по часам
    const avgByHour = hourlyStats.map(({ hour, totalUsers, count }) => ({
      hour: hour,
      avg: count > 0 ? totalUsers / count : 0
    }));
    
    // Находим топ-3 пиковых часа
    const peakHours = [...avgByHour]
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map(h => `${h.hour}:00`);
    
    // Находим топ-3 часа с минимальной нагрузкой (для техработ)
    const lowHours = [...avgByHour]
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3)
      .map(h => `${h.hour}:00`);
    
    const prediction = {
      peakHours: peakHours,
      bestMaintenanceTime: lowHours,
      avgUsersPerHour: avgByHour.reduce((sum, h) => sum + h.avg, 0) / 24
    };
    
    console.log(`✅ [CMS] Тепловая карта сформирована: ${heatmap.length} точек`);
    console.log(`📊 [CMS] Пиковые часы:`, peakHours);
    console.log(`🔧 [CMS] Лучшее время для техработ:`, lowHours);
    
    res.json({
      success: true,
      heatmap: heatmap,
      prediction: prediction
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения тепловой карты:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

