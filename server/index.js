import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { initializeWebSocket, getOnlineUsers, getOnlineCount } from './websocket.js';
import { sendErrorToTelegram } from './utils/telegram-errors.js';
import testRoutes from './routes/tests.js';

// Перехватываем console.error() для отправки всех ошибок в Telegram
// Это нужно для того, чтобы все события типа "error" в Render отправлялись в Telegram
const originalConsoleError = console.error;
const errorNotificationCache = new Map(); // Кэш для дебаунса одинаковых ошибок
const DEBOUNCE_TIME = 60000; // 1 минута - не отправляем одинаковые ошибки чаще раза в минуту

console.error = function (...args) {
  // Вызываем оригинальный console.error
  originalConsoleError.apply(console, args);

  // Формируем сообщение об ошибке
  const errorMessage = args
    .map(arg => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
      }
      return String(arg);
    })
    .join(' ');

  // Пропускаем ошибки, которые уже обрабатываются через sendErrorToTelegram
  // (чтобы избежать дублирования)
  const skipPatterns = [
    '[TELEGRAM-ERROR]',
    '[GLOBAL-ERROR-HANDLER]',
    'Не удалось отправить ошибку в Telegram'
  ];

  if (skipPatterns.some(pattern => errorMessage.includes(pattern))) {
    return;
  }

  // Создаем ключ для дебаунса (первые 200 символов сообщения)
  const cacheKey = errorMessage.substring(0, 200);
  const now = Date.now();
  const lastSent = errorNotificationCache.get(cacheKey);

  // Если эта ошибка уже отправлялась недавно, пропускаем
  if (lastSent && (now - lastSent) < DEBOUNCE_TIME) {
    return;
  }

  // Обновляем кэш
  errorNotificationCache.set(cacheKey, now);

  // Очищаем старые записи из кэша (старше 10 минут)
  for (const [key, timestamp] of errorNotificationCache.entries()) {
    if (now - timestamp > 600000) {
      errorNotificationCache.delete(key);
    }
  }

  // Отправляем в Telegram асинхронно (не блокируем выполнение)
  setImmediate(async () => {
    try {
      // Создаем объект ошибки из сообщения
      const error = new Error(errorMessage.substring(0, 500));
      error.stack = errorMessage;
      error.name = 'ConsoleError';

      await sendErrorToTelegram(error, {
        source: 'console.error',
        originalArgs: args.length,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      // Используем оригинальный console.error, чтобы избежать рекурсии
      originalConsoleError('❌ Не удалось отправить console.error в Telegram:', err);
    }
  });
};
import paymentRoutes from './routes/payments.js';
import aiRoutes from './routes/ai.js';
import telegramRoutes from './routes/telegram.js';
import telegramNotificationsRoutes from './routes/telegram-notifications.js';
import yandexFormsRoutes from './routes/yandex-forms.js';
import pdfRoutes from './routes/pdf.js';
import pdfHtmlRoutes from './routes/pdf-html.js';
import dashboardRoutes from './routes/dashboard.js';
import chatRoutes from './routes/chat.js';
import backgroundGenerationRoutes from './routes/background-generation.js';
import cmsRoutes from './routes/cms.js';
import analyticsRoutes from './routes/analytics.js';
import questionnaireGenerationRoutes from './routes/questionnaire-generation.js';
import budgetAlertsRoutes from './routes/budget-alerts.js';
import generateVariantsRoutes from './routes/generate-variants.js';
import symptomsRoutes from './routes/symptoms.js';
import renderDeployRoutes from './routes/render-deploy.js';
import clientErrorsRoutes from './routes/client-errors.js';

// Получаем путь к корневой директории проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Загружаем переменные окружения из .env в корне проекта
dotenv.config({ path: path.join(projectRoot, '.env') });

const app = express();

// --- РЕДИРЕКТ ДОМЕНА (ДОЛЖЕН БЫТЬ ПЕРВЫМ) ---
app.use((req, res, next) => {
  const host = req.hostname || req.get('host') || '';

  // Исключаем роут /chat и статические ассеты из редиректа
  const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|txt|json|map)$/.test(req.path) ||
    req.path.startsWith('/assets/') ||
    req.path.startsWith('/static/');

  if (req.path === '/chat' || req.path.startsWith('/chat/') || req.path.startsWith('/api/') || isAsset) {
    return next();
  }

  if (host === 'idenself.com' || host === 'www.idenself.com') {
    const redirectUrl = `https://idenself.ru${req.originalUrl}`;
    console.log(`🔀 Domain Redirect (302): ${host}${req.originalUrl} → ${redirectUrl}`);
    return res.redirect(302, redirectUrl);
  }
  next();
});
// --------------------------------------------

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Проверка обязательных переменных окружения
function checkEnvironmentVariables() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Отсутствуют обязательные переменные окружения:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('💡 Создайте файл .env на основе env.supabase.example');
    process.exit(1);
  }

  console.log('✅ Все переменные окружения настроены');
}

// Проверяем переменные окружения
checkEnvironmentVariables();

// Middleware

// Middleware
// CORS настройки
console.log('🚀 Starting server with CORS configuration...');
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🌍 FRONTEND_URL:', FRONTEND_URL);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://idenself.ru',
  'https://www.idenself.ru',
  'https://idenself.com',
  'https://www.idenself.com',
  'http://5.129.250.81', // Внешний сервер для генерации опросников
  FRONTEND_URL
].filter(Boolean);

console.log('✅ Разрешённые origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, Postman, curl)
    if (!origin) return callback(null, true);

    // Разрешаем все origins из списка
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS: Запрос с неразрешённого origin:', origin);
      // Временно разрешаем все origins для совместимости
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Добавляем CORS заголовки вручную для всех запросов
app.use((req, res, next) => {
  const origin = req.get('Origin');
  console.log(`📥 ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);

  // Устанавливаем CORS заголовки вручную
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization', 'X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Отвечаем на preflight OPTIONS запросы
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling preflight OPTIONS request');
    return res.status(200).end();
  }

  next();
});
app.use(express.json());
app.use(express.static('public'));

// Статическая раздача фронтенда в продакшне
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(projectRoot, 'dist')));
}

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть установлены');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('🔍 Проверка подключения к Supabase...');
    console.log(`📡 Supabase URL: ${supabaseUrl}`);

    const { data, error } = await supabase.from('primary_test_results').select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error.message);
      return;
    }

    console.log('✅ Подключение к Supabase успешно!');
  } catch (error) {
    console.error('❌ Исключение при подключении к Supabase:', error.message);
  }
}

// Routes
app.use('/api/tests', testRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/telegram-notifications', telegramNotificationsRoutes);
app.use('/api/yandex-forms', yandexFormsRoutes);
app.use('/api/budget-alerts', budgetAlertsRoutes);
app.use('/api/render-deploy', renderDeployRoutes);
app.use('/api', generateVariantsRoutes);
app.use('/api', symptomsRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/pdf-html', pdfHtmlRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/background-generation', backgroundGenerationRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', questionnaireGenerationRoutes);
app.use('/api/errors', clientErrorsRoutes);

// --- Helper: вызов Gemini API с указанной моделью и температурой ---
async function aiGenerate(modelType, systemPrompt, userMessage, temperature = 0.5, rawText = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY не установлен');

  const modelMap = {
    trackers: 'gemini-3.1-flash-lite-preview',
    gemini: 'gemini-3.1-flash-lite-preview',
  };
  const modelName = modelMap[modelType] || 'gemini-3.1-pro-preview';

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const generationConfig = { temperature };
  if (!rawText) {
    generationConfig.responseMimeType = 'application/json';
  }

  const requestBody = {
    contents: [{ parts: [{ text: systemPrompt + '\n\n' + userMessage }] }],
    generationConfig,
  };

  console.log(`🤖 [AI-GENERATE] model=${modelName}, temp=${temperature}, rawText=${rawText}, promptLen=${(systemPrompt + userMessage).length}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [AI-GENERATE] Ошибка ${response.status}:`, errorText.substring(0, 500));
    throw new Error(`Gemini API error (${response.status}): ${errorText.substring(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini API вернул пустой ответ');

  if (rawText) {
    return text.trim();
  }

  return text;
}

function parseJsonFromAI(raw) {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('❌ [TRACKER] JSON parse failed, raw:', raw.slice(0, 500));
    throw e;
  }
}

// --- Tracker endpoints ---

app.post('/api/tracker/generate-goals', async (req, res) => {
  try {
    const { diagnosticSummary } = req.body;
    if (!diagnosticSummary) {
      return res.status(400).json({ error: 'diagnosticSummary is required' });
    }

    console.log('📥 [TRACKER] generate-goals, hasDiagnostic:', !!diagnosticSummary);

    const systemPrompt = `Ты — профессиональный психолог. На основе результатов диагностики пользователя предложи 5–8 целей для ежедневного отслеживания психического здоровья.

Каждая цель — конкретное направление работы над собой, сформулированное позитивно (например, «Снизить уровень тревожности» вместо «Не тревожиться»).

Возвращай JSON:
{
  "goals": [
    { "id": "unique-slug", "label": "Текст цели на русском" }
  ]
}`;

    const userMessage = `Результаты диагностики пользователя:\n${JSON.stringify(diagnosticSummary, null, 2)}`;
    console.log('📝 [TRACKER] generate-goals userMessage preview:', userMessage.slice(0, 500));

    const raw = await aiGenerate('trackers', systemPrompt, userMessage, 0.5);
    console.log('✅ [TRACKER] generate-goals AI success:', raw.slice(0, 300));

    const parsed = parseJsonFromAI(raw);
    const goals = Array.isArray(parsed.goals) ? parsed.goals : [];

    console.log('📤 [TRACKER] generate-goals → client:', goals.length, 'goals');
    res.json({ goals });
  } catch (error) {
    console.error('❌ [TRACKER] generate-goals failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });
    res.status(500).json({ error: 'Failed to generate goals', details: error.message });
  }
});

app.post('/api/tracker/generate-indicators', async (req, res) => {
  try {
    const { goals, goalsText, diagnosticSummary } = req.body;

    if ((!goals || (Array.isArray(goals) && goals.length === 0)) && !goalsText) {
      return res.status(400).json({ success: false, error: 'goals or goalsText is required' });
    }

    const systemPrompt = `Ты — профессиональный психолог. На основе выбранных пользователем целей и результатов диагностики предложи от 10 до 30 показателей для ежедневного отслеживания. Чем больше релевантных показателей, тем лучше — пользователь сам выберет нужные.

Для каждого показателя укажи:
- id: уникальный slug (латиница, kebab-case)
- label: название на русском (кратко, 2–5 слов)
- timeEstimateSec: минимальное время заполнения в секундах (10, 15, 20, 25 или 30)

Показатели должны быть конкретными и измеримыми. Включи:
- Субъективные оценки (настроение, тревога, энергия)
- Поведенческие (сон, физическая активность, питание)
- Социальные (общение, изоляция)

Возвращай JSON:
{
  "indicators": [
    { "id": "mood", "label": "Настроение", "timeEstimateSec": 10 }
  ]
}`;

    let userMessage = '';
    if (goals && Array.isArray(goals) && goals.length > 0) {
      const goalsListText = goals.map((g, i) => `${i + 1}. ${g.label || g}`).join('\n');
      userMessage += `Выбранные цели пользователя:\n${goalsListText}`;
    }
    if (goalsText) {
      userMessage += `${userMessage ? '\n\n' : ''}Пользователь описал цели своими словами:\n"${goalsText}"`;
    }
    if (diagnosticSummary) {
      userMessage += `${userMessage ? '\n\n' : ''}Результаты диагностики:\n${JSON.stringify(diagnosticSummary, null, 2)}`;
    }

    console.log('📥 [TRACKER] generate-indicators, goals:', goals?.length || 0, ', hasGoalsText:', !!goalsText, ', hasDiagnostic:', !!diagnosticSummary);
    console.log('📝 [TRACKER] userMessage preview:', userMessage.slice(0, 500));

    const raw = await aiGenerate('trackers', systemPrompt, userMessage, 0.5);
    console.log('✅ [TRACKER] generate-indicators AI success:', raw.slice(0, 300));

    const parsed = parseJsonFromAI(raw);
    const indicatorCount = parsed.indicators?.length || 0;

    console.log('📤 [TRACKER] generate-indicators → client:', indicatorCount, 'indicators');
    res.json(parsed);
  } catch (error) {
    console.error('❌ [TRACKER] generate-indicators failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tracker/generate-blocks', async (req, res) => {
  try {
    const { indicators, goals, goalsText, diagnosticSummary } = req.body;

    if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
      return res.status(400).json({ success: false, error: 'indicators is required (массив показателей)' });
    }

    const systemPrompt = `Ты — профессиональный психолог, создающий ежедневный трекер психического здоровья.

На основе выбранных показателей создай пошаговый трекер. Сгруппируй показатели в тематические шаги (3–7 шагов). Каждый шаг ОБЯЗАТЕЛЬНО содержит 2–5 блоков — не 1 блок! Группируй связанные показатели в один шаг. Для каждого блока выбери наиболее подходящий тип и заполни его параметры.

Доступные типы блоков и их параметры:

1. "text_input" — Текстовое поле с микрофоном.
   Параметры: placeholder (пример ответа).
   Предпочтителен для: описание чувств, заметки, открытые вопросы.

2. "single_choice" — Выбор одного варианта из карточек.
   Параметры: options[] (3–6 вариантов).
   Предпочтителен для: настроение, уровень энергии, общее самочувствие.

3. "multi_choice" — Множественный выбор чипсов.
   Параметры: options[] (5–12 вариантов).
   Предпочтителен для: эмоции за день, симптомы, виды активности.

4. "likert_scale" — Шкала Лайкерта (5–7 пунктов с подписями).
   Параметры: points[] (подписи, до 20 символов каждая), defaultValue (индекс 0-based).
   Предпочтителен для: согласие/несогласие, самооценка, удовлетворённость.

5. "slider" — Числовой слайдер С единицей измерения.
   Параметры: unit (очень коротко: "ч", "мин", "%"), min, max, step, defaultValue.
   Предпочтителен для: часы сна, процент тревоги, продуктивность %.

6. "slider_plain" — Числовой слайдер БЕЗ единиц измерения.
   Параметры: min, max, step, defaultValue.
   Предпочтителен для: абстрактные оценки: уровень стресса 1–10, мотивация 1–10.

7. "number_input" — Ввод числа с единицей измерения.
   Параметры: unit (очень коротко: "ч", "мин", "шт"), defaultValue.
   Предпочтителен для: часы сна, стаканы воды, минуты медитации.

8. "stepper" — Счётчик с кнопками +/−.
   Параметры: defaultValue.
   Предпочтителен для: количество приёмов пищи, тренировок, панических атак.

9. "yes_no" — Да/Нет.
   Параметры: нет дополнительных.
   Предпочтителен для: привычки — лекарства, спорт, прогулка, медитация.

10. "ranking" — Перетаскивание для ранжирования.
    Параметры: items[] (3–7 текстов в порядке по умолчанию).
    Предпочтителен для: "что больше всего беспокоит сегодня".

11. "time_range" — Временной диапазон (начало-конец).
    Параметры: defaultStart ("22:00"), defaultEnd ("07:00").
    Предпочтителен для: время сна (лёг/встал), рабочие часы.

Для КАЖДОГО блока ОБЯЗАТЕЛЬНО укажи:
- indicatorId: id показателя из входных данных
- type: один из 11 типов выше
- label: вопрос-инструкция для пользователя на русском
- timeEstimateSec: оценка времени заполнения в секундах
- ВСЕ параметры, специфичные для выбранного типа (см. выше)

Возвращай JSON:
{
  "steps": [
    {
      "title": "Настроение и эмоции",
      "blocks": [
        {
          "indicatorId": "mood",
          "type": "single_choice",
          "label": "Как ваше настроение сегодня?",
          "options": ["Отличное", "Хорошее", "Нормальное", "Плохое", "Очень плохое"],
          "timeEstimateSec": 10
        },
        {
          "indicatorId": "emotions",
          "type": "multi_choice",
          "label": "Какие эмоции вы испытывали сегодня?",
          "options": ["Радость", "Спокойствие", "Тревога", "Грусть", "Раздражение", "Злость", "Апатия", "Воодушевление"],
          "timeEstimateSec": 15
        },
        {
          "indicatorId": "anxiety-level",
          "type": "slider_plain",
          "label": "Уровень тревоги прямо сейчас",
          "min": 1,
          "max": 10,
          "step": 1,
          "defaultValue": 3,
          "timeEstimateSec": 8
        }
      ]
    },
    {
      "title": "Сон и восстановление",
      "blocks": [
        {
          "indicatorId": "sleep-time",
          "type": "time_range",
          "label": "Во сколько вы легли и встали?",
          "defaultStart": "23:00",
          "defaultEnd": "07:00",
          "timeEstimateSec": 10
        },
        {
          "indicatorId": "sleep-quality",
          "type": "slider_plain",
          "label": "Оцените качество сна",
          "min": 1,
          "max": 10,
          "step": 1,
          "defaultValue": 5,
          "timeEstimateSec": 8
        }
      ]
    },
    {
      "title": "Тревога и стресс",
      "blocks": [
        {
          "indicatorId": "anxiety-level",
          "type": "slider",
          "label": "Уровень тревоги сейчас",
          "unit": "%",
          "min": 0,
          "max": 100,
          "step": 5,
          "defaultValue": 30,
          "timeEstimateSec": 8
        },
        {
          "indicatorId": "stress-thoughts",
          "type": "text_input",
          "label": "Что вас тревожит прямо сейчас?",
          "placeholder": "Например: переживаю из-за дедлайна на работе...",
          "timeEstimateSec": 25
        }
      ]
    },
    {
      "title": "Активность и привычки",
      "blocks": [
        {
          "indicatorId": "exercise",
          "type": "yes_no",
          "label": "Вы занимались физической активностью сегодня?",
          "timeEstimateSec": 3
        },
        {
          "indicatorId": "water",
          "type": "stepper",
          "label": "Сколько стаканов воды вы выпили?",
          "defaultValue": 0,
          "timeEstimateSec": 5
        },
        {
          "indicatorId": "meditation-time",
          "type": "number_input",
          "label": "Сколько минут медитации сегодня?",
          "unit": "мин",
          "defaultValue": 0,
          "timeEstimateSec": 5
        }
      ]
    },
    {
      "title": "Рефлексия",
      "blocks": [
        {
          "indicatorId": "self-esteem",
          "type": "likert_scale",
          "label": "Насколько вы довольны собой сегодня?",
          "points": ["Совсем нет", "Скорее нет", "Наполовину", "Скорее да", "Полностью"],
          "defaultValue": 2,
          "timeEstimateSec": 8
        },
        {
          "indicatorId": "worries-rank",
          "type": "ranking",
          "label": "Что беспокоит больше всего? Перетащите наверх главное",
          "items": ["Работа", "Отношения", "Здоровье", "Финансы", "Будущее"],
          "timeEstimateSec": 15
        }
      ]
    }
  ]
}`;

    const indicatorsListText = Array.isArray(indicators)
      ? indicators.map((ind, i) => `${i + 1}. ${ind.label || ind.id} (id: ${ind.id}, ~${ind.timeEstimateSec || '?'}с)`).join('\n')
      : JSON.stringify(indicators);

    const goalsListText = Array.isArray(goals)
      ? goals.map((g, i) => `${i + 1}. ${g.label || g}`).join('\n')
      : '';

    let userMessage = `Выбранные показатели для отслеживания:\n${indicatorsListText}`;
    if (goalsListText) userMessage += `\n\nЦели пользователя:\n${goalsListText}`;
    if (goalsText) userMessage += `\n\nПользователь уточнил цели своими словами:\n"${goalsText}"`;
    if (diagnosticSummary) userMessage += `\n\nКонтекст диагностики:\n${JSON.stringify(diagnosticSummary, null, 2)}`;

    console.log('📥 [TRACKER] generate-blocks, indicators:', indicators.length, ', hasGoals:', !!goals, ', hasGoalsText:', !!goalsText, ', hasDiagnostic:', !!diagnosticSummary);
    console.log('📝 [TRACKER] userMessage preview:', userMessage.slice(0, 500));

    const raw = await aiGenerate('trackers', systemPrompt, userMessage, 0.4);
    console.log('✅ [TRACKER] generate-blocks AI success:', raw.slice(0, 300));

    const parsed = parseJsonFromAI(raw);
    const steps = Array.isArray(parsed.steps) ? parsed.steps : [];

    console.log('📤 [TRACKER] generate-blocks → client:', steps.length, 'steps');
    res.json({ steps });
  } catch (error) {
    console.error('❌ [TRACKER] generate-blocks failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tracker/generate-feedback', async (req, res) => {
  try {
    const { answers, blocks, goals, goalsText, previousCheckins, checkinDate, diagnosticsDate, freeText } = req.body;
    console.log('[generate-feedback] Received request, answers keys:', answers ? Object.keys(answers).length : 0);

    const systemPrompt = `Ты — Луми, дружелюбный ИИ-помощник по ментальному здоровью. Ты анализируешь ежедневные чек-ины пользователя и даёшь тёплую, поддерживающую и полезную обратную связь на русском языке.

Стиль обратной связи:
- Тебе доступны дата/время текущего чек-ина и дата диагностики. Используй это для контекста: сколько дней прошло с диагностики, в какое время суток заполнен чек-ин (утро/вечер), интервалы между чек-инами.
- Если есть данные предыдущих чек-инов — ищи паттерны и тренды: что растёт, что снижается, какие закономерности. Ссылайся на конкретные даты.
- Если предыдущих чек-инов НЕТ — анализируй только связи внутри текущего чек-ина. НЕ упоминай предыдущие дни, тренды или динамику.
- Находи неочевидные связи между ответами внутри чек-ина: например, связь сна с раздражительностью, социальной активности с энергией.
- Комментируй ВСЕ текстовые ответы пользователя — они особенно важны, потому что человек потратил время, чтобы их написать.
- Валидируй состояние пользователя, а не поучай. Вместо советов — признание того, через что он проходит.
- Подмечай неочевидные позитивные моменты, которые пользователь сам мог не заметить.
- Если видишь тренд на ухудшение — мягко предупреди и дай прогноз, а не банальный совет.

Правила:
- Максимум 900 символов
- Обращайся на "вы"
- НЕ используй Markdown-разметку, пиши простым текстом
- НИКОГДА не задавай вопросов. Это единоразовая обратная связь, а не диалог.
- НИКОГДА не выдумывай данные. Если предыдущих чек-инов нет, НЕ пиши "по сравнению с прошлыми днями", "динамика показывает" и подобное.
- НИКОГДА не давай очевидных советов типа "подышите квадратом", "выпейте стакан воды", "прогуляйтесь", "ложитесь пораньше". Если даёшь совет — он должен быть неочевидным и конкретным, основанным на данных этого пользователя.

Возвращай только текст обратной связи, без JSON и обёрток.`;

    const formatDate = (d) => {
      if (!d) return null;
      const dt = new Date(d);
      return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    const checkinDateStr = formatDate(checkinDate);
    const diagDateStr = formatDate(diagnosticsDate);

    let readableAnswers = '';
    if (blocks && blocks.steps && Array.isArray(blocks.steps)) {
      for (const step of blocks.steps) {
        if (step.title) readableAnswers += `\n[${step.title}]\n`;
        if (Array.isArray(step.blocks)) {
          for (const block of step.blocks) {
            const blockId = block.id || block.blockId;
            const answer = answers && blockId ? answers[blockId] : undefined;
            if (answer === undefined || answer === null || answer === '') continue;
            const question = block.label || block.question || blockId;
            readableAnswers += `- ${question}: ${typeof answer === 'object' ? JSON.stringify(answer) : answer}\n`;
          }
        }
      }
    }

    let userMessage = '';
    if (checkinDateStr) userMessage += `Дата и время текущего чек-ина: ${checkinDateStr}\n`;
    if (diagDateStr) userMessage += `Дата прохождения диагностики: ${diagDateStr}\n`;
    userMessage += '\n';

    userMessage += readableAnswers.trim()
      ? `Ответы сегодняшнего чек-ина:\n${readableAnswers}`
      : `Ответы сегодняшнего чек-ина (сырые данные):\n${JSON.stringify(answers, null, 2)}`;

    if (freeText && freeText.trim()) {
      userMessage += `\n\nСвободный комментарий пользователя о сегодняшнем дне:\n"${freeText.trim()}"`;
    }

    if (goals && Array.isArray(goals) && goals.length > 0) {
      userMessage += `\n\nЦели пользователя:\n${goals.map((g, i) => `${i + 1}. ${g.label || g}`).join('\n')}`;
    }
    if (goalsText) {
      userMessage += `\n\nУточнение целей своими словами: "${goalsText}"`;
    }
    if (previousCheckins && previousCheckins.length > 0) {
      userMessage += `\n\nПредыдущие чек-ины (от новых к старым):`;
      previousCheckins.forEach((c) => {
        userMessage += `\n--- ${formatDate(c.date) || c.date} ---\n${JSON.stringify(c.answers, null, 2)}`;
      });
    } else {
      userMessage += `\n\nЭто первый чек-ин пользователя. Предыдущих данных нет.`;
    }

    const feedback = await aiGenerate('trackers', systemPrompt, userMessage, 0.6, true);
    console.log('[generate-feedback] Generated feedback, length:', typeof feedback === 'string' ? feedback.length : 0);

    res.json({ feedback: typeof feedback === 'string' ? feedback : String(feedback) });
  } catch (error) {
    console.error('Error generating feedback:', error);
    res.status(500).json({ error: 'Failed to generate feedback', details: error.message });
  }
});

app.post('/api/tracker/generate-reminder', async (req, res) => {
  try {
    const {
      goals, goalsText, messageType, dayOfWeek, activityLevel,
      weeklyCheckins, checkinCount, daysWithoutCheckin,
      dataAggregates, lastFeedbackSummary, recentMessages, safetyFiltered,
    } = req.body;

    console.log('📥 [TRACKER] generate-reminder, messageType:', messageType, ', checkinCount:', checkinCount, ', safetyFiltered:', !!safetyFiltered);

    const systemPrompt = `Ты — Луми, помощник по ментальному здоровью. Напиши сообщение для пользователя (4-6 предложений, 300-500 символов).

ВЕРНИ СТРОГО JSON:
{
  "text": "Текст сообщения (300-500 символов)",
  "buttonText": "Короткий текст кнопки (2-5 слов, без стрелок, приглашение заполнить заметку)"
}

Для buttonText: придумай короткую, живую фразу-приглашение, которая органично продолжает тему сообщения и цели пользователя. Например: «Отметить сейчас», «Проверить себя», «Записать момент», «Поймать настроение», «Добавить заметку». Без стрелок и знаков пунктуации в конце.

ДВА РЕЖИМА ЦЕННОСТИ:
1. Зеркало — покажи человеку то, что он сам о себе не замечает: паттерн, расхождение, прогресс, слепое пятно в данных.
2. Редкий эксперт — дай то, что он услышал бы только от хорошего терапевта: конкретную книгу, метод, знание — THE one thing для его проблемы. Адаптируй под его текущее состояние по данным.

Тип сообщения: ${messageType || 'adaptive_calibration'}

ТИПЫ:
- blind_spot: покажи разрыв между тем, что пользователь думает о себе, и тем, что говорят данные. Например: «Вы оценили неделю как плохую, но 5 из 7 дней — выше среднего». Используй конкретные числа.
- trigger: найди конкретный порог или событие, после которого показатели падают. Не «сон влияет на тревогу», а «ваша граница — полночь: ВСЕ плохие дни были после засыпания позже 00:00». Числа обязательны.
- hidden_progress: покажи улучшение, которое пользователь не чувствует из-за привыкания к новой базовой линии. «Ваша тревожность в первую неделю — 4.1, сейчас — 2.8. Вы сдвинулись на 30%, но не замечаете.»
- precision_insight: дай THE one thing — самое эффективное знание для конкретной проблемы пользователя. Не generic-совет, а expert-level интервенция. Адаптируй под текущие данные: если человек срывается — один тон, если держится — другой. Можно рекомендовать конкретные методы (ERP при ОКР, парадоксальная интенция при бессоннице, и т.д.).
- resource_discovery: порекомендуй конкретную книгу, метод или тип терапии, который является золотым стандартом для проблемы пользователя. Объясни почему именно эта книга/метод, привяжи к данным. Не список — одна рекомендация.
- adaptive_calibration: считай тренд данных и подстрой тон и содержание. Если спад 3+ дня — нормализуй, покажи что спады конечны, приведи его предыдущий спад из данных. Если плато — объясни почему стабильность после нестабильности это результат. Если рост — покажи механизм.
- curiosity_hook (для <3 заметок): расскажи, что Луми скоро сможет показать. Приведи пример неочевидного открытия. Вызови любопытство к себе.

Обязательно:
- Обращайся на «вы»
- Начни сразу с персонального наблюдения или с сути — без приветствия
- Где есть данные — называй конкретные числа, дни, показатели
- Для типов precision_insight и resource_discovery — привязывай к целям и текущему состоянию пользователя по данным
- В конце — открытый вопрос или мягкая связка с наблюдением (не давление)
- Тон: умный аналитик + терапевт, который нашёл что-то важное для вас лично

Запрещено:
- Generic-советы: «подышите квадратом», «выпейте воды», «5-4-3-2-1»
- Общие психологические факты без привязки к данным или проблеме пользователя
- Слова «чек-ин», «трекер» — используй «заметка», «отметить», «минута для себя»
- «Не забудьте», «Вы пропустили», любое давление
- «Исследования показывают...» без связи с пользователем
- Стрики, серии подряд
- Медицинские диагнозы и назначения
- Банальности, мотивационные фразы
- Повторение предыдущих сообщений
- Контент, который можно найти в первых 3 ссылках Google
- Контент, который мог бы быть в любом психологическом Telegram-канале

БЕЗОПАСНОСТЬ — КРИТИЧНО:
- Если цель пользователя связана с причинением вреда себе или другим, самоповреждением, суицидом, насилием — НЕ упоминай эту цель. Используй нейтральную тему: общее самочувствие, энергия, сон.
- Никогда не говори, что достижение цели «будет хорошо» или «позитивно повлияет», если не уверен в безопасности цели.
- Если ВСЕ цели пользователя небезопасны — напиши о ценности регулярного отслеживания состояния в целом, без упоминания целей.`;

    const agg = dataAggregates || {};
    const recent = Array.isArray(recentMessages) ? recentMessages : [];
    const goalsStr = Array.isArray(goals) ? goals.join(', ') : (goals || 'не указаны');
    const patternsStr = Array.isArray(agg.notablePatterns) && agg.notablePatterns.length > 0
      ? agg.notablePatterns.join('; ')
      : 'недостаточно данных';
    const recentStr = recent.length > 0
      ? recent.map((m, i) => `${i + 1}. ${m}`).join('\n')
      : 'нет предыдущих';

    const userMessage = `Цели пользователя: ${goalsStr}
Цели своими словами: ${goalsText || 'не указаны'}
Тип сообщения: ${messageType || 'adaptive_calibration'}
День недели: ${dayOfWeek || 'не указан'}
Уровень активности: ${activityLevel || 'не указан'}
Заметок за эту неделю: ${weeklyCheckins ?? '?'} из 7
Всего заметок: ${checkinCount ?? '?'}
Дней с последней заметки: ${daysWithoutCheckin ?? '?'}

Агрегаты данных:
- Средние за всё время: ${JSON.stringify(agg.averages || null)}
- Эта неделя: ${JSON.stringify(agg.thisWeek || null)}
- Прошлая неделя: ${JSON.stringify(agg.lastWeek || null)}
- Тренд: ${agg.trend || 'нет данных'}
- Лучший день: ${agg.bestDay || 'нет данных'}
- Худший день: ${agg.worstDay || 'нет данных'}
- Всего дней с данными: ${agg.totalDays ?? '?'}
- Паттерны: ${patternsStr}

Последняя обратная связь: ${lastFeedbackSummary || 'нет'}

Последние 3 отправленных сообщения (не повторяй):
${recentStr}`;

    console.log('📝 [TRACKER] generate-reminder userMessage preview:', userMessage.slice(0, 500));

    const result = await aiGenerate('gemini', systemPrompt, userMessage, 0.7, false);
    console.log('✅ [TRACKER] generate-reminder success:', JSON.stringify(result).slice(0, 200));

    let text, buttonText;
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      text = parsed.text;
      buttonText = parsed.buttonText ?? null;
    } catch (parseErr) {
      console.error('❌ [TRACKER] generate-reminder JSON parse failed, fallback to raw text');
      text = typeof result === 'string' ? result : JSON.stringify(result);
      buttonText = null;
    }

    console.log('📤 [TRACKER] generate-reminder → client: text:', String(text).slice(0, 150), '| buttonText:', buttonText);
    res.json({ text, buttonText });
  } catch (error) {
    console.error('❌ [TRACKER] generate-reminder failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });
    res.status(500).json({ error: 'Failed to generate reminder', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test dashboard endpoint
app.get('/api/dashboard/test', (req, res) => {
  console.log('🧪 [TEST] Dashboard test endpoint called');
  res.json({
    status: 'Dashboard route working',
    timestamp: new Date().toISOString(),
    message: 'Dashboard router is properly connected'
  });
});

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
  console.log('🧪 CORS test endpoint called from:', req.get('Origin') || 'no-origin');
  console.log('🧪 Headers:', JSON.stringify(req.headers, null, 2));

  res.json({
    success: true,
    message: 'CORS is working!',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent')
  });
});

// Test deployment version endpoint
app.get('/api/test-version', (req, res) => {
  console.log('🔍 Version check endpoint called');

  res.json({
    success: true,
    version: '2.1-column-names-fix',
    message: 'Server updated with correct column names',
    timestamp: new Date().toISOString(),
    fixApplied: 'test_name -> test_type, test_result -> answers'
  });
});

// Статические файлы для production
if (process.env.NODE_ENV === 'production') {
  // Отдача статических файлов из папки dist
  app.use(express.static(path.join(projectRoot, 'dist')));

  // SPA fallback - все остальные запросы (не API) возвращают index.html
  app.get('*', (req, res, next) => {
    // Не перенаправляем API запросы - они должны обрабатываться роутерами выше
    if (req.path.startsWith('/api/')) {
      // Если это API запрос, но он не был обработан роутерами, возвращаем 404
      // Но только если это GET запрос (POST/PUT/DELETE обрабатываются роутерами)
      return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Дополнительная проверка: если домен idenself.com — редиректим (исключая /chat и ассеты)
    const host = req.hostname || req.get('host') || '';
    const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|txt|json|map)$/.test(req.path) ||
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/static/');

    if ((host === 'idenself.com' || host === 'www.idenself.com') &&
      !(req.path === '/chat' || req.path.startsWith('/chat/') || req.path.startsWith('/api/') || isAsset)) {
      return res.redirect(302, `https://idenself.ru${req.originalUrl}`);
    }

    // Устанавливаем правильные заголовки для HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(projectRoot, 'dist', 'index.html'));
  });
} else {
  // Для разработки отдаем статические файлы из public
  app.use(express.static(path.join(projectRoot, 'public')));
}

// Supabase health check
app.get('/api/health/database', async (req, res) => {
  try {
    const { data, error } = await supabase.from('primary_test_results').select('count').limit(1);

    if (error) {
      throw error;
    }

    res.json({
      status: 'OK',
      database: 'connected',
      supabase_url: supabaseUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Глобальный обработчик ошибок Express (должен быть после всех роутов)
app.use((error, req, res, next) => {
  console.error('❌ [GLOBAL-ERROR-HANDLER] Ошибка:', error);

  // Отправляем ошибку в Telegram
  sendErrorToTelegram(error, {
    route: req.path,
    method: req.method,
    body: req.body ? JSON.stringify(req.body).substring(0, 500) : 'нет body',
    query: Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : 'нет query',
    ip: req.ip,
    userAgent: req.get('user-agent')
  }).catch(err => {
    console.error('❌ Не удалось отправить ошибку в Telegram:', err);
  });

  // Отправляем ответ клиенту
  if (!res.headersSent) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Внутренняя ошибка сервера'
    });
  }
});

// Обработчик необработанных ошибок процесса
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED-REJECTION] Необработанное отклонение промиса:', reason);
  sendErrorToTelegram(
    reason instanceof Error ? reason : new Error(String(reason)),
    {
      type: 'unhandledRejection',
      promise: String(promise).substring(0, 200)
    }
  ).catch(err => {
    console.error('❌ Не удалось отправить ошибку в Telegram:', err);
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT-EXCEPTION] Необработанное исключение:', error);
  sendErrorToTelegram(error, { type: 'uncaughtException' }).catch(err => {
    console.error('❌ Не удалось отправить ошибку в Telegram:', err);
  });
  // Критическая ошибка - завершаем процесс
  process.exit(1);
});

// ── CMS Луми: AI-аналитик ──
app.post('/api/cms/lumi/chat', async (req, res) => {
  try {
    const { messages, analyticsContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const modelName = process.env.LUMI_CMS_MODEL || 'gemini-3.1-pro-preview';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const contextStr = analyticsContext ? JSON.stringify(analyticsContext, null, 2) : '{}';
    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `Ты — Луми, ИИ-аналитик сервиса idenself. Сегодня: ${today}.

idenself — сервис психологической самодиагностики и личного трекинга ментального здоровья:
- Пользователи проходят многоэтапную диагностику (симптомы → жалоба → опросники → результаты с гипотезами)
- После диагностики настраивают персональный трекер (цели → показатели → приоритеты → расписание)
- Ежедневно заполняют чек-ины по выбранным показателям (слайдеры, шкалы Ликерта, текстовые вопросы)
- Получают персонализированные ИИ-напоминания в Telegram

Тебе доступны актуальные аналитические данные CMS (ниже). Твоя задача — давать точные, конкретные инсайты на основе этих данных.

Как отвечать:
- Отвечай на русском, конкретно и по делу
- Называй точные значения из контекста, предлагай гипотезы и прогнозы
- Форматируй ответы читаемо: абзацы, списки через дефис, жирный текст **так**
- Не придумывай данные, которых нет в контексте

Актуальные данные CMS:
\`\`\`json
${contextStr}
\`\`\``;

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const requestBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.5 },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini v1beta API error (${response.status}): ${errorText.slice(0, 500)}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error(`Unexpected Gemini response structure: ${JSON.stringify(data).slice(0, 500)}`);
    }

    const text = data.candidates[0].content.parts[0].text.trim();
    res.json({ reply: text });
  } catch (error) {
    console.error('Error in CMS Lumi chat:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

// Создаем HTTP сервер для socket.io
const httpServer = createServer(app);

// Инициализируем WebSocket
const io = initializeWebSocket(httpServer);

// Экспортируем для использования в роутах
export { io, getOnlineUsers, getOnlineCount };

httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 HTTP сервер запущен на 0.0.0.0:${PORT}`);
  console.log(`🔌 WebSocket сервер активен`);
  console.log(`🌐 Frontend: ${FRONTEND_URL || 'не задан (FRONTEND_URL)'}`);
  console.log(`🔧 Backend API: ${process.env.BACKEND_URL || `http://127.0.0.1:${PORT}`}`);
  console.log(`📱 Telegram уведомления об ошибках: ${process.env.TELEGRAM_CHAT_ID ? 'включены' : 'отключены (TELEGRAM_CHAT_ID не установлен)'}`);

  // Проверяем подключение к Supabase
  await testSupabaseConnection();
});
