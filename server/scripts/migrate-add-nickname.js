import fs from 'fs';
import path from 'path';
import { supabase } from '../index.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Запускаем миграцию для добавления поля nickname...');
    
    // Читаем SQL файл
    const sqlPath = path.join(__dirname, '../database/add_nickname_field.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL команда:', sql);
    
    // Выполняем SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Ошибка при выполнении миграции:', error);
      process.exit(1);
    }
    
    console.log('✅ Миграция выполнена успешно!');
    console.log('📊 Результат:', data);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

runMigration();
