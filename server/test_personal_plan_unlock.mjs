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

async function testPersonalPlanField() {
  try {
    console.log('🧪 Тестирование поля personal_plan_unlocked');
    console.log('');
    
    // Пытаемся выбрать поле
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('id, session_id, nickname, personal_plan_unlocked')
      .limit(5);

    if (error) {
      if (error.message.includes('personal_plan_unlocked')) {
        console.error('❌ Поле personal_plan_unlocked не найдено!');
        console.log('');
        console.log('📝 Пожалуйста, добавьте поле вручную в Supabase Dashboard:');
        console.log('');
        console.log('1. Откройте https://app.supabase.com');
        console.log('2. Выберите Table Editor → primary_test_results');
        console.log('3. Нажмите "+ New Column"');
        console.log('4. Заполните:');
        console.log('   - Name: personal_plan_unlocked');
        console.log('   - Type: boolean');
        console.log('   - Default value: false');
        console.log('   - Is Nullable: ✗ (не отмечено)');
        console.log('5. Нажмите "Save"');
        console.log('');
        console.log('Или выполните SQL:');
        console.log('```sql');
        console.log('ALTER TABLE primary_test_results');
        console.log('ADD COLUMN personal_plan_unlocked BOOLEAN DEFAULT false NOT NULL;');
        console.log('```');
      } else {
        console.error('❌ Ошибка при тестировании:', error);
      }
      process.exit(1);
    }

    console.log('✅ Поле personal_plan_unlocked успешно найдено!');
    console.log('');
    console.log('📊 Результаты теста:');
    console.log(`   Найдено записей: ${data.length}`);
    
    const unlocked = data.filter(row => row.personal_plan_unlocked);
    const locked = data.filter(row => !row.personal_plan_unlocked);
    
    console.log(`   С разблокированным планом: ${unlocked.length}`);
    console.log(`   Без разблокированного плана: ${locked.length}`);
    console.log('');
    
    if (data.length > 0) {
      console.log('📋 Примеры записей:');
      data.slice(0, 3).forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.nickname || 'без никнейма'} - план ${row.personal_plan_unlocked ? '🔓 разблокирован' : '🔒 заблокирован'}`);
      });
      console.log('');
    }
    
    console.log('🎉 Миграция успешна! Приложение готово к работе.');
    
    // Тестируем разблокировку
    if (locked.length > 0) {
      const testSession = locked[0].session_id;
      console.log('');
      console.log(`🧪 Тестируем разблокировку для сессии: ${testSession}`);
      
      const { error: updateError } = await supabase
        .from('primary_test_results')
        .update({ personal_plan_unlocked: true })
        .eq('session_id', testSession);
      
      if (updateError) {
        console.error('❌ Ошибка при разблокировке:', updateError);
      } else {
        console.log('✅ Разблокировка выполнена успешно!');
        
        // Проверяем результат
        const { data: checkData } = await supabase
          .from('primary_test_results')
          .select('session_id, personal_plan_unlocked')
          .eq('session_id', testSession)
          .single();
        
        if (checkData && checkData.personal_plan_unlocked) {
          console.log('✅ Проверка: поле успешно обновлено');
          
          // Откатываем изменения
          await supabase
            .from('primary_test_results')
            .update({ personal_plan_unlocked: false })
            .eq('session_id', testSession);
          
          console.log('↩️  Тестовые изменения откачены');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
    process.exit(1);
  }
}

testPersonalPlanField();

