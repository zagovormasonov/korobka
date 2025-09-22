import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Загружаем переменные окружения
dotenv.config({ path: path.join(projectRoot, '.env') });

// Создаем клиент Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть установлены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Создаем подключение к PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: { rejectUnauthorized: false }
});

async function initSupabase() {
  try {
    console.log('🚀 Инициализация Supabase...');
    
    // Проверяем подключение к Supabase
    console.log('🔍 Проверка подключения к Supabase...');
    const { data, error } = await supabase.from('primary_test_results').select('count').limit(1);
    
    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error);
      process.exit(1);
    }
    
    console.log('✅ Подключение к Supabase успешно');
    
    // Проверяем подключение к PostgreSQL
    console.log('🔍 Проверка подключения к PostgreSQL...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Подключение к PostgreSQL успешно');
    console.log(`⏰ Время сервера БД: ${result.rows[0].current_time}`);
    client.release();
    
    // Проверяем существование таблиц
    console.log('🔍 Проверка структуры базы данных...');
    
    const tables = [
      'primary_test_results',
      'additional_test_results', 
      'payments',
      'dashboard_tokens',
      'psychologist_requests'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Таблица ${table} не найдена:`, error.message);
        console.log('💡 Выполните SQL схему из supabase/schema.sql в Supabase SQL Editor');
        process.exit(1);
      }
      console.log(`✅ Таблица ${table} найдена`);
    }
    
    console.log('🎉 Инициализация Supabase завершена успешно!');
    console.log('📋 Следующие шаги:');
    console.log('1. Убедитесь, что все таблицы созданы');
    console.log('2. Проверьте RLS политики');
    console.log('3. Запустите приложение');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации Supabase:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запускаем инициализацию
initSupabase();
