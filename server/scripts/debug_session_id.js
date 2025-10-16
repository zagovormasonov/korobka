import { supabase } from '../index.js';

async function debugSessionId() {
  try {
    console.log('🔍 [DEBUG] Проверяем sessionId в базе данных...');
    
    // Получаем все записи с session_id
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('session_id, dashboard_token, nickname, personal_plan_unlocked')
      .limit(10);
    
    if (error) {
      console.error('❌ [DEBUG] Ошибка запроса:', error);
      return;
    }
    
    console.log('📊 [DEBUG] Найдено записей:', data.length);
    
    data.forEach((record, index) => {
      console.log(`\n--- Запись ${index + 1} ---`);
      console.log('Session ID:', record.session_id);
      console.log('Session ID тип:', typeof record.session_id);
      console.log('Session ID длина:', record.session_id?.length);
      console.log('Dashboard Token:', record.dashboard_token ? 'есть' : 'нет');
      console.log('Nickname:', record.nickname || 'не указан');
      console.log('Personal Plan Unlocked:', record.personal_plan_unlocked);
      console.log('Personal Plan Unlocked тип:', typeof record.personal_plan_unlocked);
    });
    
    // Проверяем, есть ли записи с session_id = true
    const trueSessionIds = data.filter(record => record.session_id === true);
    if (trueSessionIds.length > 0) {
      console.log('\n⚠️ [DEBUG] Найдены записи с session_id = true:');
      trueSessionIds.forEach(record => {
        console.log('- ID записи:', record.id || 'не указан');
        console.log('- Dashboard Token:', record.dashboard_token);
      });
    }
    
    // Проверяем валидность UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidSessionIds = data.filter(record => 
      record.session_id && 
      record.session_id !== true && 
      !uuidRegex.test(record.session_id)
    );
    
    if (invalidSessionIds.length > 0) {
      console.log('\n⚠️ [DEBUG] Найдены записи с невалидным session_id:');
      invalidSessionIds.forEach(record => {
        console.log('- Session ID:', record.session_id);
        console.log('- Dashboard Token:', record.dashboard_token);
      });
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Критическая ошибка:', error);
  }
}

// Запускаем диагностику
debugSessionId();
