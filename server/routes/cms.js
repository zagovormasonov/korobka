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
    // Получаем все события test_question и фильтруем по номеру вопроса в коде
    let questionQuery = supabase
      .from('analytics_events')
      .select('session_id, metadata, created_at')
      .eq('event_type', 'test_question');
    
    if (dateFilter) {
      questionQuery = questionQuery.gte('created_at', dateFilter);
    }
    
    const { data: allQuestionEvents, error: questionEventsError } = await questionQuery;
    
    if (questionEventsError) {
      console.error('❌ [CMS] Ошибка получения событий test_question:', questionEventsError);
    }
    
    const questionStats = [];
    for (let i = 1; i <= 45; i++) {
      // Фильтруем события по номеру вопроса из metadata
      const questionEvents = (allQuestionEvents || []).filter(e => {
        if (!e.metadata) return false;
        const metadata = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata;
        return metadata.question_number === i;
      });
      
      // Уникальные session_id для этого вопроса
      const uniqueSessions = new Set(questionEvents.map(e => e.session_id));
      questionStats.push({
        step: `Вопрос ${i}`,
        users: uniqueSessions.size,
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
    const onlineUsersList = getOnlineUsers();
    const onlineSessions = new Set(onlineUsersList);
    
    console.log('👥 [CMS] Онлайн пользователей из WebSocket:', onlineUsersList.length);
    console.log('👥 [CMS] Список онлайн sessionId:', onlineUsersList.slice(0, 10)); // Первые 10 для отладки

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

    // Получаем последнее событие для каждого пользователя (для определения последнего визита)
    // Используем любые события из analytics_events
    // Получаем все события, отсортированные по дате, и берем первое для каждого session_id
    const { data: allLastVisitEvents } = await supabase
      .from('analytics_events')
      .select('session_id, created_at')
      .order('created_at', { ascending: false });

    // Создаем мапу последних визитов по session_id (берем первое вхождение для каждого session_id)
    const lastVisitBySession = {};
    if (allLastVisitEvents) {
      allLastVisitEvents.forEach(event => {
        if (!lastVisitBySession[event.session_id]) {
          lastVisitBySession[event.session_id] = event.created_at;
        }
      });
    }

    // Получаем всех анонимов (включая удаленных) для правильной нумерации
    // Нумерация должна быть постоянной и не переиспользоваться
    const { data: allAnonymousUsers } = await supabase
      .from('primary_test_results')
      .select('session_id, created_at')
      .is('nickname', null)
      .order('created_at', { ascending: true }); // Сортируем по дате создания
    
    // Создаем мапу: session_id -> номер анонима (на основе позиции среди всех анонимов)
    const anonymousNumberMap = {};
    if (allAnonymousUsers) {
      allAnonymousUsers.forEach((anon, index) => {
        anonymousNumberMap[anon.session_id] = index + 1; // Номер начинается с 1
      });
    }
    
    console.log('📊 [CMS] Всего анонимов в БД:', allAnonymousUsers?.length || 0);
    console.log('📊 [CMS] Мапа номеров анонимов:', Object.keys(anonymousNumberMap).length);

    // Формируем результат с аналитикой для каждого пользователя
    const usersWithAnalytics = users?.map(user => {
      const events = eventsBySession[user.session_id] || [];
      const hasTestStart = events.some(e => e.event_type === 'test_start');
      const hasTestComplete = events.some(e => e.event_type === 'test_complete');
      const hasPayment = events.some(e => e.event_type === 'payment_success');
      
      // Подсчитываем количество отвеченных вопросов
      const questionEvents = events.filter(e => e.event_type === 'test_question');
      
      // Количество ответов: используем количество событий test_question для анонимов,
      // или answers.length если есть сохраненные ответы (более точно)
      const answersCount = user.answers && Array.isArray(user.answers) && user.answers.length > 0
        ? user.answers.length
        : questionEvents.length; // Для анонимов используем количество событий

      // Формируем никнейм: если нет nickname, используем нумерованный "Аноним"
      // Номер присваивается на основе позиции среди всех анонимов по дате создания
      let displayNickname = user.nickname;
      if (!displayNickname) {
        const anonymousNumber = anonymousNumberMap[user.session_id];
        if (anonymousNumber) {
          displayNickname = `Аноним ${anonymousNumber}`;
        } else {
          // Если не нашли в мапе (не должно происходить), используем временный номер
          displayNickname = `Аноним (временный)`;
          console.warn('⚠️ [CMS] Аноним не найден в мапе номеров:', user.session_id);
        }
      }

      const isUserOnline = onlineSessions.has(user.session_id);
      
      // Логирование для отладки онлайн статуса анонимов
      if (!user.nickname && isUserOnline) {
        console.log(`🟢 [CMS] Аноним онлайн: ${displayNickname} (${user.session_id})`);
      } else if (!user.nickname && !isUserOnline) {
        console.log(`🔴 [CMS] Аноним офлайн: ${displayNickname} (${user.session_id})`);
      }

      return {
        sessionId: user.session_id,
        nickname: displayNickname,
        hasPassword: !!user.dashboard_password,
        password: user.dashboard_password || null, // Будет скрыт на фронте по умолчанию
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastVisit: lastVisitBySession[user.session_id] || null, // Последний визит из analytics_events
        isOnline: isUserOnline,
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

// Получить все данные пользователя (ответы, тесты, планы, документы)
router.get('/users/:sessionId/data', checkAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('📋 [CMS] Получение всех данных пользователя, sessionId:', sessionId);
    console.log('📋 [CMS] Тип sessionId:', typeof sessionId);
    
    // Получаем данные первичного теста (используем maybeSingle для корректной обработки отсутствия записи)
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('answers, personal_plan, session_preparation, psychologist_document, nickname, email, session_id')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (primaryError) {
      console.error('❌ [CMS] Ошибка Supabase при получении первичного теста:', primaryError);
      return res.status(500).json({ success: false, error: 'Ошибка базы данных: ' + primaryError.message });
    }
    
    if (!primaryTest) {
      console.warn('⚠️ [CMS] Пользователь не найден для sessionId:', sessionId);
      // Попробуем найти пользователя без учета регистра или с другими вариантами
      const { data: allUsers } = await supabase
        .from('primary_test_results')
        .select('session_id')
        .limit(5);
      console.log('📊 [CMS] Примеры session_id в БД:', allUsers?.map(u => u.session_id));
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    console.log('✅ [CMS] Пользователь найден:', primaryTest.nickname || primaryTest.session_id);
    
    // Получаем вопросы первичного теста (используем тот же массив, что и в tests.js)
    const questions = [
      { id: 1, text: "В каком роде к вам обращаться?", type: "gender_choice" },
      { id: 2, text: "Испытываете ли вы периоды чрезмерной энергии, когда спите мало, но чувствуете себя полным сил и идей?", type: "yes_no_scale" },
      { id: 3, text: "Бывают ли у вас эпизоды глубокой грусти или депрессии, когда вы теряете интерес ко всему на недели или месяцы?", type: "yes_no_text" },
      { id: 4, text: "Часто ли вы чувствуете себя рассеянным, забываете вещи или не можете сосредоточиться на задачах?", type: "yes_no_scale" },
      { id: 5, text: "Есть ли у вас импульсивные действия, такие как необдуманные покупки или рискованное поведение?", type: "yes_no_examples" },
      { id: 6, text: "Испытываете ли вы сильную тревогу или панику в повседневных ситуациях?", type: "yes_no_scale" },
      { id: 7, text: "Оцените интенсивность переживаний, связанных с травматическими событиями из прошлого (если такие были)", type: "scale" },
      { id: 8, text: "Контролируете ли вы свой вес или еду чрезмерно, например, через диеты, переедание или очищение?", type: "yes_no_text" },
      { id: 9, text: "Используете ли вы алкоголь, наркотики или другие вещества, чтобы справиться с эмоциями?", type: "yes_no_text" },
      { id: 10, text: "Чувствуете ли вы хроническую усталость или потерю энергии без видимой причины?", type: "yes_no_scale" },
      { id: 11, text: "Бывают ли у вас маниакальные идеи, когда вы говорите быстро и не можете остановиться?", type: "yes_no_examples" },
      { id: 12, text: "Трудно ли вам сидеть на месте, или, может, вы постоянно ёрзаете, дёргаетесь?", type: "yes_no_text" },
      { id: 13, text: "Испытываете ли вы социальную тревогу, избегая встреч или общения?", type: "yes_no_scale" },
      { id: 14, text: "Есть ли у вас обсессивные мысли или компульсивные действия (например, перепроверка, заперли ли вы дверь по 5 раз подряд)?", type: "yes_no_text" },
      { id: 15, text: "Чувствуете ли вы себя оторванным от реальности или своих эмоций в стрессовых ситуациях?", type: "yes_no_scale" },
      { id: 16, text: "Бывают ли у вас суицидальные мысли или попытки самоповреждения?", type: "yes_no_text" },
      { id: 17, text: "Испытывали ли вы гиперактивность в детстве, которая продолжается во взрослой жизни?", type: "yes_no_examples" },
      { id: 18, text: "Есть ли у вас циклы настроения: от эйфории к депрессии?", type: "yes_no_text" },
      { id: 19, text: "Трудно ли вам регулировать эмоции, например, от гнева к слезам за минуты?", type: "yes_no_scale" },
      { id: 20, text: "Используете ли вы азартные игры или шопинг как способ отвлечься?", type: "yes_no_text" },
      { id: 21, text: "Бывают ли у вас галлюцинации или паранойя?", type: "yes_no_text" },
      { id: 22, text: "Чувствуете ли вы хроническую пустоту или скуку?", type: "yes_no_scale" },
      { id: 23, text: "Есть ли у вас проблемы с доверием или страх отвержения в отношениях?", type: "yes_no_examples" },
      { id: 24, text: "Испытываете ли вы бессонницу или чрезмерный сон во время эмоциональных спадов?", type: "yes_no_text" },
      { id: 25, text: "Бывают ли у вас компульсивные покупки или долги из-за импульсов?", type: "yes_no_text" },
      { id: 26, text: "Чувствуете ли вы себя \"другим человеком\" в разных ситуациях (расщепление идентичности)?", type: "yes_no_examples" },
      { id: 27, text: "Какой максимальный бюджет на один сеанс вы можете себе позволить?", type: "budget" },
      { id: 28, text: "Сколько сеансов в месяц вы планируете (или можете себе позволить)?", type: "scale" },
      { id: 29, text: "Предпочитаете ли вы бесплатные/государственные клиники и психологические центры, если они доступны?", type: "yes_no" },
      { id: 30, text: "Принципиален ли вид терапии (онлайн/очно)?", type: "yes_no_text" },
      { id: 31, text: "Зависите ли вы финансово от кого-то (родителей, партнера)?", type: "yes_no_scale" },
      { id: 32, text: "Находитесь ли вы в абьюзивных отношениях (эмоциональный, физический, финансовый абьюз)?", type: "yes_no_text" },
      { id: 33, text: "Есть ли у вас зависимости от веществ или другие, негативно влияющие на вашу жизнь?", type: "yes_no_text" },
      { id: 34, text: "Чувствуете ли вы себя изолированным от друзей или семьи?", type: "yes_no_scale" },
      { id: 35, text: "Были ли в вашей жизни травмы (детские, недавние)?", type: "yes_no_text" },
      { id: 36, text: "Есть ли у вас хронические заболевания, влияющие на психическое здоровье?", type: "yes_no_text" },
      { id: 37, text: "Работает ли ваш текущий график (работа/учеба) против вашего благополучия?", type: "yes_no_examples" },
      { id: 39, text: "Есть ли у вас доступ к безопасному месту для терапии (дом, онлайн)?", type: "no_text" },
      { id: 40, text: "Испытываете ли вы финансовый стресс (долги, безработица)?", type: "yes_no_scale" },
      { id: 41, text: "Был ли у вас предыдущий опыт терапии?", type: "yes_no_text" },
      { id: 42, text: "Есть ли у вас дети или иждивенцы, влияющие на ваше расписание?", type: "yes_no_text" },
      { id: 43, text: "Чувствуете ли вы давление от общества или культуры по поводу психического здоровья?", type: "scale" },
      { id: 44, text: "Готовы ли вы к изменениям в образе жизни (например, отказ от зависимостей)?", type: "scale" },
      { id: 45, text: "Какие ваши сильные стороны или ресурсы (хобби, поддержка), которые можно использовать в терапии?", type: "open_text" },
      { id: 46, text: "Опишите, что ещё вас беспокоит, а также дополнительные особенности вашей ситуации", type: "open_text" }
    ];
    
    // Формируем ответы на первичный тест с формулировками вопросов
    const primaryAnswers = [];
    if (primaryTest.answers && Array.isArray(primaryTest.answers)) {
      primaryTest.answers.forEach((answer) => {
        const question = questions.find(q => q.id === answer.questionId);
        primaryAnswers.push({
          questionId: answer.questionId,
          questionText: question ? question.text : `Вопрос ${answer.questionId}`,
          answer: answer.answer,
          additionalText: answer.additionalText || null
        });
      });
    }
    
    // Получаем результаты дополнительных тестов
    const { data: additionalTests, error: additionalError } = await supabase
      .from('additional_test_results')
      .select('test_type, test_name, test_result, answers')
      .eq('session_id', sessionId);
    
    const additionalTestsResults = [];
    if (additionalTests && !additionalError) {
      additionalTests.forEach((test) => {
        additionalTestsResults.push({
          testName: test.test_name || test.test_type,
          testType: test.test_type,
          result: test.test_result || (test.answers ? JSON.stringify(test.answers) : 'Результат не указан')
        });
      });
    }
    
    // Получаем персональный план (если есть)
    let personalPlan = null;
    if (primaryTest.personal_plan) {
      personalPlan = primaryTest.personal_plan;
    }
    
    // Получаем подготовку к сеансу через API (генерируется на лету)
    let sessionPreparation = null;
    try {
      const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
      const prepResponse = await fetch(`${baseUrl}/api/ai/session-preparation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(120000) // 2 минуты timeout
      });
      if (prepResponse.ok) {
        const prepData = await prepResponse.json();
        sessionPreparation = prepData.preparation || null;
      } else {
        console.warn('⚠️ [CMS] Подготовка к сеансу не получена, статус:', prepResponse.status);
      }
    } catch (error) {
      console.error('❌ [CMS] Ошибка получения подготовки к сеансу:', error);
      sessionPreparation = null; // Не показываем ошибку, просто null
    }
    
    // Получаем документ для специалиста через API (генерируется на лету)
    let psychologistDocument = null;
    try {
      const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
      const docResponse = await fetch(`${baseUrl}/api/ai/psychologist-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(120000) // 2 минуты timeout
      });
      if (docResponse.ok) {
        const docData = await docResponse.json();
        psychologistDocument = docData.psychologistPdf || null;
      } else {
        console.warn('⚠️ [CMS] Документ для специалиста не получен, статус:', docResponse.status);
      }
    } catch (error) {
      console.error('❌ [CMS] Ошибка получения документа для специалиста:', error);
      psychologistDocument = null; // Не показываем ошибку, просто null
    }
    
    res.json({
      success: true,
      data: {
        primaryTestAnswers: primaryAnswers,
        additionalTestsResults: additionalTestsResults,
        personalPlan: personalPlan,
        sessionPreparation: sessionPreparation,
        psychologistDocument: psychologistDocument
      }
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка получения данных пользователя:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Удаление пользователя со всеми данными
router.delete('/users/:sessionId', checkAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('🗑️ [CMS] Удаление пользователя:', sessionId);
    
    // Проверяем, существует ли пользователь
    const { data: user, error: userError } = await supabase
      .from('primary_test_results')
      .select('session_id, nickname')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (userError) throw userError;
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    console.log('🗑️ [CMS] Удаляем пользователя:', user.nickname || user.session_id);
    
    // Удаляем события аналитики (нет CASCADE, удаляем вручную)
    const { error: analyticsError } = await supabase
      .from('analytics_events')
      .delete()
      .eq('session_id', sessionId);
    
    if (analyticsError) {
      console.error('⚠️ [CMS] Ошибка удаления событий аналитики:', analyticsError);
      // Продолжаем удаление, даже если есть ошибка с аналитикой
    } else {
      console.log('✅ [CMS] События аналитики удалены');
    }
    
    // Удаляем основную запись пользователя (CASCADE удалит все связанные данные)
    const { error: deleteError } = await supabase
      .from('primary_test_results')
      .delete()
      .eq('session_id', sessionId);
    
    if (deleteError) throw deleteError;
    
    console.log('✅ [CMS] Пользователь успешно удален:', sessionId);
    
    res.json({ 
      success: true, 
      message: 'Пользователь и все связанные данные успешно удалены' 
    });
  } catch (error) {
    console.error('❌ [CMS] Ошибка удаления пользователя:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// График активности по времени
router.get('/stats/activity-by-hour', checkAuth, async (req, res) => {
  try {
    const { period = 'day', pages = 'all', date, metricType = 'active_users' } = req.query;
    
    console.log('📊 [CMS] Получение активности за период:', period, 'дата:', date, 'страницы:', pages, 'тип метрики:', metricType);
    
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
    
    // Получаем события за выбранный период в зависимости от типа метрики
    let events = [];
    
    if (metricType === 'active_users') {
      // Активность пользователей - heartbeat события
      let query = supabase
        .from('analytics_events')
        .select('created_at, session_id, page_url')
        .eq('event_type', 'heartbeat')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      
      const { data, error } = await query;
      if (error) throw error;
      events = data || [];
      
    } else if (metricType === 'new_users') {
      // Новые пользователи - первое событие test_start для каждого session_id
      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at, session_id')
        .eq('event_type', 'test_start')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Фильтруем - только первое событие для каждого session_id
      const seenSessions = new Set();
      events = (data || []).filter(event => {
        if (seenSessions.has(event.session_id)) return false;
        seenSessions.add(event.session_id);
        return true;
      });
      
    } else if (metricType === 'conversion_rate') {
      // Динамика конверсии - нужно получить test_start и payment_success
      const { data: testStarts, error: error1 } = await supabase
        .from('analytics_events')
        .select('created_at, session_id')
        .eq('event_type', 'test_start')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      
      const { data: payments, error: error2 } = await supabase
        .from('analytics_events')
        .select('created_at, session_id')
        .eq('event_type', 'payment_success')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      
      if (error1 || error2) throw error1 || error2;
      
      // Сохраняем оба набора данных для дальнейшей обработки
      events = {
        testStarts: testStarts || [],
        payments: payments || []
      };
    }
    
    // Фильтруем события по страницам, если указаны фильтры (только для active_users)
    let filteredEvents = events;
    if (metricType === 'active_users' && pages && pages !== 'all') {
      const pageFilters = pages.split(',');
      filteredEvents = events.filter(event => {
        const url = event.page_url || '';
        
        if (pageFilters.includes('homepage') && url === '/') return true;
        if (pageFilters.includes('test') && (url.startsWith('/test') || url.startsWith('/bpd-test'))) return true;
        if (pageFilters.includes('dashboard') && (url.startsWith('/dashboard') || url.startsWith('/personal-plan') || url.startsWith('/feedback-chat'))) return true;
        if (pageFilters.includes('other') && url !== '/' && !url.startsWith('/test') && !url.startsWith('/bpd-test') && !url.startsWith('/dashboard') && !url.startsWith('/personal-plan') && !url.startsWith('/feedback-chat')) return true;
        
        return false;
      });
    }
    
    let activityData = [];
    
    // Группируем данные в зависимости от периода
    if (period === 'day') {
      // За сутки: по часам (0-23) в московском времени (UTC+3)
      if (metricType === 'conversion_rate') {
        const hourlyData = new Array(24).fill(0).map((_, hour) => ({
          index: hour,
          label: `${hour}:00`,
          testStarts: new Set(),
          payments: new Set()
        }));
        
        filteredEvents.testStarts?.forEach(event => {
          const date = new Date(event.created_at);
          const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
          const hour = moscowDate.getUTCHours();
          hourlyData[hour].testStarts.add(event.session_id);
        });
        
        filteredEvents.payments?.forEach(event => {
          const date = new Date(event.created_at);
          const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
          const hour = moscowDate.getUTCHours();
          hourlyData[hour].payments.add(event.session_id);
        });
        
        activityData = hourlyData.map(item => ({
          index: item.index,
          label: item.label,
          users: item.testStarts.size > 0 ? Math.round((item.payments.size / item.testStarts.size) * 100) : 0
        }));
      } else {
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
      }
      
    } else if (period === 'week') {
      // За неделю: по дням недели (Пн-Вс)
      const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      
      if (metricType === 'conversion_rate') {
        const weeklyData = weekDays.map((day, index) => ({
          index: index,
          label: day,
          testStarts: new Set(),
          payments: new Set()
        }));
        
        filteredEvents.testStarts?.forEach(event => {
          const date = new Date(event.created_at);
          const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
          let dayOfWeek = moscowDate.getUTCDay();
          dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          weeklyData[dayOfWeek].testStarts.add(event.session_id);
        });
        
        filteredEvents.payments?.forEach(event => {
          const date = new Date(event.created_at);
          const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
          let dayOfWeek = moscowDate.getUTCDay();
          dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          weeklyData[dayOfWeek].payments.add(event.session_id);
        });
        
        activityData = weeklyData.map(item => ({
          index: item.index,
          label: item.label,
          users: item.testStarts.size > 0 ? Math.round((item.payments.size / item.testStarts.size) * 100) : 0
        }));
      } else {
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
      }
      
    } else if (period === 'month') {
      // За месяц: по дням месяца (1-31) в московском времени
      const daysInMonth = 31;
      
      if (metricType === 'conversion_rate') {
        const monthlyData = Array.from({ length: daysInMonth }, (_, i) => ({
          index: i + 1,
          label: `${i + 1}`,
          testStarts: new Set(),
          payments: new Set()
        }));
        
        filteredEvents.testStarts?.forEach(event => {
          const date = new Date(event.created_at);
          const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
          const dayOfMonth = moscowDate.getUTCDate();
          
          if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth) {
            monthlyData[dayOfMonth - 1].testStarts.add(event.session_id);
          }
        });
        
        filteredEvents.payments?.forEach(event => {
          const date = new Date(event.created_at);
          const moscowDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
          const dayOfMonth = moscowDate.getUTCDate();
          
          if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth) {
            monthlyData[dayOfMonth - 1].payments.add(event.session_id);
          }
        });
        
        activityData = monthlyData.map(item => ({
          index: item.index,
          label: item.label,
          users: item.testStarts.size > 0 ? Math.round((item.payments.size / item.testStarts.size) * 100) : 0
        }));
      } else {
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

