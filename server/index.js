import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
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
    'POSTGRESQL_HOST',
    'POSTGRESQL_PORT', 
    'POSTGRESQL_USER',
    'POSTGRESQL_PASSWORD',
    'POSTGRESQL_DBNAME'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Отсутствуют обязательные переменные окружения:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('💡 Создайте файл .env на основе env.example');
    process.exit(1);
  }
  
  console.log('✅ Все переменные окружения настроены');
}

// Проверяем переменные окружения
checkEnvironmentVariables();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
export const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('🔍 Проверка подключения к базе данных...');
    console.log(`📡 Хост: ${process.env.POSTGRESQL_HOST}`);
    console.log(`🔌 Порт: ${process.env.POSTGRESQL_PORT}`);
    console.log(`👤 Пользователь: ${process.env.POSTGRESQL_USER}`);
    console.log(`🗄 База данных: ${process.env.POSTGRESQL_DBNAME}`);
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Подключение к базе данных успешно!');
    console.log(`⏰ Время сервера БД: ${result.rows[0].current_time}`);
    client.release();
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:');
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

// Database health check
app.get('/api/health/database', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    
    res.json({ 
      status: 'OK', 
      database: 'connected',
      current_time: result.rows[0].current_time,
      db_version: result.rows[0].db_version
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log(`🔧 Backend API: http://localhost:${PORT}`);
  
  // Проверяем подключение к базе данных
  await testDatabaseConnection();
});
