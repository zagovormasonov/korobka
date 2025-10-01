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

async function testLumiField() {
  try {
    console.log('🧪 Тестирование поля lumi_dashboard_message');
    console.log('');
    
    // Пытаемся выбрать поле
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('id, session_id, lumi_dashboard_message')
      .limit(5);

    if (error) {
      if (error.message.includes('lumi_dashboard_message')) {
        console.error('❌ Поле lumi_dashboard_message не найдено!');
        console.log('');
        console.log('📝 Пожалуйста, добавьте поле вручную в Supabase Dashboard:');
        console.log('   Запустите: node server/add_lumi_message_field.mjs');
      } else {
        console.error('❌ Ошибка при тестировании:', error);
      }
      process.exit(1);
    }

    console.log('✅ Поле lumi_dashboard_message успешно найдено!');
    console.log('');
    console.log('📊 Результаты теста:');
    console.log(`   Найдено записей: ${data.length}`);
    
    const withMessage = data.filter(row => row.lumi_dashboard_message);
    console.log(`   С сообщением Луми: ${withMessage.length}`);
    console.log(`   Без сообщения: ${data.length - withMessage.length}`);
    console.log('');
    console.log('🎉 Миграция успешна! Приложение готово к работе.');
    
  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
    process.exit(1);
  }
}

testLumiField();

