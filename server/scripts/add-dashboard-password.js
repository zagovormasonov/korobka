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

async function addDashboardPassword() {
  try {
    console.log('📋 Добавляем поле dashboard_password...');
    
    const sqlPath = path.join(__dirname, '../database/add_dashboard_password.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Поле dashboard_password успешно добавлено');
    
    // Генерируем пароли для существующих записей
    const existingRecords = await pool.query(
      'SELECT session_id FROM primary_test_results WHERE dashboard_password IS NULL'
    );
    
    for (const record of existingRecords.rows) {
      const password = generatePassword();
      await pool.query(
        'UPDATE primary_test_results SET dashboard_password = $1 WHERE session_id = $2',
        [password, record.session_id]
      );
      console.log(`🔑 Сгенерирован пароль для session_id: ${record.session_id}`);
    }
    
    console.log(`✅ Обновлено ${existingRecords.rows.length} записей`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

addDashboardPassword();
