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

  if (req.path === '/chat' || req.path.startsWith('/chat/') || isAsset) {
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
      !(req.path === '/chat' || req.path.startsWith('/chat/') || isAsset)) {
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
