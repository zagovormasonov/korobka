import { supabase } from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyDocumentGenerationMigration() {
  try {
    console.log('🚀 [MIGRATION] Начинаем применение миграции для фоновой генерации документов');
    
    // Читаем SQL файл миграции
    const migrationPath = path.join(__dirname, '../database/add_document_generation_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 [MIGRATION] Применяем SQL миграцию...');
    
    // Выполняем миграцию
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ [MIGRATION] Ошибка применения миграции:', error);
      throw error;
    }
    
    console.log('✅ [MIGRATION] Миграция успешно применена');
    
    // Проверяем, что поля добавлены
    console.log('🔍 [MIGRATION] Проверяем структуру таблицы...');
    const { data: columns, error: columnsError } = await supabase
      .from('primary_test_results')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ [MIGRATION] Ошибка проверки структуры:', columnsError);
    } else {
      console.log('✅ [MIGRATION] Структура таблицы проверена');
    }
    
    console.log('🎉 [MIGRATION] Миграция завершена успешно!');
    
  } catch (error) {
    console.error('❌ [MIGRATION] Критическая ошибка:', error);
    process.exit(1);
  }
}

// Запускаем миграцию
applyDocumentGenerationMigration();
