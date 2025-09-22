import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import testRoutes from './routes/tests.js';
import paymentRoutes from './routes/payments.js';
import aiRoutes from './routes/ai.js';
import telegramRoutes from './routes/telegram.js';
import pdfRoutes from './routes/pdf.js';

// Получаем путь к корневой директории проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Загружаем переменные окружения из .env в корне проекта
dotenv.config({ path: path.join(projectRoot, '.env') });

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

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    
    // Разрешаем запросы с render.com доменов
    if (origin && origin.includes('render.com')) return callback(null, true);
    if (FRONTEND_URL && origin === FRONTEND_URL) return callback(null, true);
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
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
    
    const { data, error } = await supabase.from('primary_test_results').select('count').limit(1);
    
    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error.message);
      console.error('💡 Проверьте переменные окружения SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    
    console.log('✅ Подключение к Supabase успешно!');
  } catch (error) {
    console.error('❌ Ошибка подключения к Supabase:');
    console.error(`🔴 ${error.message}`);
    console.error('💡 Проверьте переменные окружения в файле .env');
    process.exit(1);
  }
}

// Routes
app.use('/api/tests', testRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/pdf', pdfRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// SPA fallback - все остальные запросы возвращают index.html
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(projectRoot, 'dist', 'index.html'));
  });
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

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Сервер запущен на 0.0.0.0:${PORT}`);
  console.log(`🌐 Frontend: ${FRONTEND_URL || 'не задан (FRONTEND_URL)'}`);
  console.log(`🔧 Backend API: ${process.env.BACKEND_URL || `http://127.0.0.1:${PORT}`}`);
  
  // Проверяем подключение к Supabase
  await testSupabaseConnection();
});
