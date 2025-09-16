import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.POSTGRESQL_HOST,
  port: process.env.POSTGRESQL_PORT,
  user: process.env.POSTGRESQL_USER,
  password: process.env.POSTGRESQL_PASSWORD,
  database: process.env.POSTGRESQL_DBNAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addDashboardToken() {
  try {
    console.log('📋 Добавляем поле dashboard_token...');
    
    const sqlPath = path.join(__dirname, '../database/add_dashboard_token.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Поле dashboard_token успешно добавлено');
    
    // Генерируем токены для существующих записей
    const existingRecords = await pool.query(
      'SELECT session_id FROM primary_test_results WHERE dashboard_token IS NULL'
    );
    
    for (const record of existingRecords.rows) {
      const token = generateToken();
      await pool.query(
        'UPDATE primary_test_results SET dashboard_token = $1 WHERE session_id = $2',
        [token, record.session_id]
      );
      console.log(`🔑 Сгенерирован токен для session_id: ${record.session_id}`);
    }
    
    console.log(`✅ Обновлено ${existingRecords.rows.length} записей`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

function generateToken() {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

addDashboardToken();
