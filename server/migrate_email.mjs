import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем путь к корневой директории проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Загружаем переменные окружения из .env в корне проекта
dotenv.config({ path: path.join(projectRoot, '.env') });

async function runMigration() {
  const pool = new Pool({
    host: process.env.POSTGRESQL_HOST,
    port: process.env.POSTGRESQL_PORT,
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    database: process.env.POSTGRESQL_DBNAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Проверяем структуру таблицы additional_test_results...');
    console.log('📊 Настройки БД:', {
      host: process.env.POSTGRESQL_HOST,
      port: process.env.POSTGRESQL_PORT,
      user: process.env.POSTGRESQL_USER,
      database: process.env.POSTGRESQL_DBNAME
    });
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'additional_test_results' 
      ORDER BY ordinal_position
    `);
    
    console.log('Структура таблицы:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Проверяем, есть ли поле email
    const hasEmail = result.rows.some(row => row.column_name === 'email');
    console.log(`\nПоле email ${hasEmail ? '✅ найдено' : '❌ НЕ найдено'}`);
    
    if (!hasEmail) {
      console.log('\n🔄 Добавляем поле email...');
      await pool.query('ALTER TABLE additional_test_results ADD COLUMN email VARCHAR(255)');
      console.log('✅ Поле email добавлено');
      
      console.log('🔄 Создаем индекс...');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_test_email ON additional_test_results(email)');
      console.log('✅ Индекс создан');
      
      console.log('🔄 Обновляем существующие записи...');
      const updateResult = await pool.query(`
        UPDATE additional_test_results 
        SET email = ptr.email 
        FROM primary_test_results ptr 
        WHERE additional_test_results.session_id = ptr.session_id 
        AND additional_test_results.email IS NULL
      `);
      console.log(`✅ Обновлено ${updateResult.rowCount} записей`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

runMigration();



