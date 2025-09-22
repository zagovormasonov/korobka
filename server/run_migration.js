const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/korob_db'
  });

  try {
    console.log('🔄 Начинаем миграцию...');
    
    // Добавляем поле email
    await pool.query('ALTER TABLE additional_test_results ADD COLUMN IF NOT EXISTS email VARCHAR(255)');
    console.log('✅ Поле email добавлено');
    
    // Создаем индекс
    await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_test_email ON additional_test_results(email)');
    console.log('✅ Индекс создан');
    
    // Обновляем существующие записи
    const result = await pool.query(`
      UPDATE additional_test_results 
      SET email = ptr.email 
      FROM primary_test_results ptr 
      WHERE additional_test_results.session_id = ptr.session_id 
      AND additional_test_results.email IS NULL
    `);
    console.log(`✅ Обновлено ${result.rowCount} записей`);
    
    console.log('🎉 Миграция завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  } finally {
    await pool.end();
  }
}

runMigration();




