const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL или SUPABASE_ANON_KEY не установлены');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPersonalPlanContentField() {
  try {
    console.log('🔧 Проверяем существование поля personal_plan_content...');
    
    // Проверяем структуру таблицы
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('personal_plan_content')
      .limit(1);
    
    if (error && error.message.includes('column "personal_plan_content" does not exist')) {
      console.log('❌ Поле personal_plan_content не существует, нужно добавить его вручную в Supabase Dashboard');
      console.log('📝 SQL для выполнения:');
      console.log('ALTER TABLE primary_test_results ADD COLUMN personal_plan_content TEXT;');
    } else if (error) {
      console.error('❌ Ошибка при проверке поля:', error);
    } else {
      console.log('✅ Поле personal_plan_content уже существует');
    }
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
  }
}

addPersonalPlanContentField();
