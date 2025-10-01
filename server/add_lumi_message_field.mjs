import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: SUPABASE_URL или SUPABASE_KEY не установлены в .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addLumiMessageField() {
  try {
    console.log('🔧 Начинаем миграцию: добавление поля lumi_dashboard_message');
    console.log('📊 Суть миграции: добавить текстовое поле для хранения сообщения от Луми');
    console.log('');
    
    console.log('ℹ️  ВАЖНО: Это поле нужно добавить вручную в Supabase Dashboard:');
    console.log('');
    console.log('1. Откройте Supabase Dashboard: https://app.supabase.com');
    console.log('2. Перейдите в Table Editor');
    console.log('3. Выберите таблицу "primary_test_results"');
    console.log('4. Нажмите "New Column" (+ Add column)');
    console.log('5. Заполните поля:');
    console.log('   - Name: lumi_dashboard_message');
    console.log('   - Type: text');
    console.log('   - Default value: (пусто)');
    console.log('   - Is Nullable: ✓ (да)');
    console.log('   - Is Unique: ✗ (нет)');
    console.log('6. Нажмите "Save"');
    console.log('');
    
    // Проверяем существование таблицы
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Ошибка при проверке таблицы:', error);
      console.log('⚠️  Убедитесь, что таблица primary_test_results существует');
    } else {
      console.log('✅ Таблица primary_test_results найдена');
      console.log('');
      console.log('📝 После добавления поля в Dashboard, запустите тест:');
      console.log('   node server/test_lumi_field.mjs');
    }
    
  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
    process.exit(1);
  }
}

addLumiMessageField();

