const { Pool } = require('pg');

async function checkTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/korob_db'
  });

  try {
    console.log('🔍 Проверяем структуру таблицы additional_test_results...');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'additional_test_results' 
      ORDER BY ordinal_position
    `);
    
    console.log('Структура таблицы:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Проверяем, есть ли поле email
    const hasEmail = result.rows.some(row => row.column_name === 'email');
    console.log(`\nПоле email ${hasEmail ? '✅ найдено' : '❌ НЕ найдено'}`);
    
    if (!hasEmail) {
      console.log('\n🔄 Добавляем поле email...');
      await pool.query('ALTER TABLE additional_test_results ADD COLUMN email VARCHAR(255)');
      console.log('✅ Поле email добавлено');
      
      console.log('🔄 Создаем индекс...');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_test_email ON additional_test_results(email)');
      console.log('✅ Индекс создан');
      
      console.log('🔄 Обновляем существующие записи...');
      const updateResult = await pool.query(`
        UPDATE additional_test_results 
        SET email = ptr.email 
        FROM primary_test_results ptr 
        WHERE additional_test_results.session_id = ptr.session_id 
        AND additional_test_results.email IS NULL
      `);
      console.log(`✅ Обновлено ${updateResult.rowCount} записей`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

checkTable();


