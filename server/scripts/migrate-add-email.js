import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройка Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'dummy-key';

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL не найден в переменных окружения');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Запуск миграции для добавления колонки email...');
    
    // Читаем SQL файл миграции
    const migrationPath = path.join(__dirname, '../database/add_email_to_additional_tests.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Выполняем миграцию
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Ошибка выполнения миграции:', error);
      
      // Пробуем альтернативный способ - через отдельные запросы
      console.log('🔄 Попытка выполнить миграцию по частям...');
      
      // Добавляем колонку email
      const { error: addColumnError } = await supabase
        .from('additional_test_results')
        .select('email')
        .limit(1);
        
      if (addColumnError && addColumnError.message.includes('does not exist')) {
        console.log('📝 Добавление колонки email...');
        
        // Используем прямой SQL запрос
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE additional_test_results ADD COLUMN IF NOT EXISTS email VARCHAR(255);'
        });
        
        if (alterError) {
          console.error('❌ Ошибка добавления колонки:', alterError);
          return;
        }
        
        console.log('✅ Колонка email добавлена');
        
        // Обновляем существующие записи
        console.log('📝 Обновление существующих записей...');
        const { error: updateError } = await supabase.rpc('exec_sql', {
          sql: `UPDATE additional_test_results 
                SET email = (
                  SELECT ptr.email 
                  FROM primary_test_results ptr 
                  WHERE ptr.session_id = additional_test_results.session_id
                )
                WHERE email IS NULL;`
        });
        
        if (updateError) {
          console.warn('⚠️ Предупреждение при обновлении записей:', updateError);
        } else {
          console.log('✅ Существующие записи обновлены');
        }
        
        // Создаем индекс
        console.log('📝 Создание индекса...');
        const { error: indexError } = await supabase.rpc('exec_sql', {
          sql: 'CREATE INDEX IF NOT EXISTS idx_additional_test_email ON additional_test_results(email);'
        });
        
        if (indexError) {
          console.warn('⚠️ Предупреждение при создании индекса:', indexError);
        } else {
          console.log('✅ Индекс создан');
        }
        
      } else {
        console.log('✅ Колонка email уже существует');
      }
      
    } else {
      console.log('✅ Миграция выполнена успешно');
      console.log('📊 Результат:', data);
    }
    
    // Проверяем результат
    console.log('🔍 Проверка структуры таблицы...');
    const { data: tableInfo, error: infoError } = await supabase
      .from('additional_test_results')
      .select('*')
      .limit(1);
      
    if (infoError) {
      console.error('❌ Ошибка проверки таблицы:', infoError);
    } else {
      console.log('✅ Таблица additional_test_results готова к работе');
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка миграции:', error);
    process.exit(1);
  }
}

// Запуск миграции
runMigration()
  .then(() => {
    console.log('🎉 Миграция завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Миграция провалена:', error);
    process.exit(1);
  });
