import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Получаем путь к корневой директории проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Загружаем переменные окружения из .env в корне проекта
dotenv.config({ path: path.join(projectRoot, '.env') });

const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  try {
    console.log('🔍 Проверка подключения к базе данных...');
    console.log(`📡 Хост: ${process.env.POSTGRESQL_HOST}`);
    console.log(`🔌 Порт: ${process.env.POSTGRESQL_PORT}`);
    console.log(`👤 Пользователь: ${process.env.POSTGRESQL_USER}`);
    console.log(`🗄 База данных: ${process.env.POSTGRESQL_DBNAME}`);
    
    // Тестируем подключение
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Подключение к базе данных успешно!');
    console.log(`⏰ Время сервера БД: ${result.rows[0].current_time}`);
    client.release();
    
    console.log('\n📋 Инициализация схемы базы данных...');
    
    // Читаем схему из файла
    const schemaPath = path.join(process.cwd(), 'server', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Выполняем SQL скрипт
    await pool.query(schema);
    
    console.log('✅ База данных успешно инициализирована!');
    console.log('📊 Созданы таблицы:');
    console.log('   - primary_test_results');
    console.log('   - additional_test_results');
    console.log('   - payments');
    console.log('   - psychologist_requests');
    console.log('   - session_feedback');
    console.log('🔍 Созданы индексы для оптимизации');
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:');
    console.error(`🔴 ${error.message}`);
    
    if (error.message.includes('already exists')) {
      console.log('💡 Некоторые объекты уже существуют - это нормально при повторном запуске');
    } else {
      console.error('💡 Проверьте настройки подключения к базе данных');
    }
  } finally {
    await pool.end();
  }
}

initializeDatabase();
