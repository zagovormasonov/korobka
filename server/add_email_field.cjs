const { Pool } = require('pg');

async function addEmailField() {
  const pool = new Pool({
    host: process.env.POSTGRESQL_HOST || 'localhost',
    port: process.env.POSTGRESQL_PORT || 5432,
    user: process.env.POSTGRESQL_USER || 'postgres',
    password: process.env.POSTGRESQL_PASSWORD || 'password',
    database: process.env.POSTGRESQL_DBNAME || 'korob_db'
  });

  try {
    console.log('🔄 Добавляем поле email в таблицу additional_test_results...');
    
    // Добавляем поле email
    await pool.query('ALTER TABLE additional_test_results ADD COLUMN IF NOT EXISTS email VARCHAR(255)');
    console.log('✅ Поле email добавлено');
    
    // Создаем индекс
    await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_test_email ON additional_test_results(email)');
    console.log('✅ Индекс создан');
    
    // Обновляем существующие записи
    const updateResult = await pool.query(`
      UPDATE additional_test_results 
      SET email = ptr.email 
      FROM primary_test_results ptr 
      WHERE additional_test_results.session_id = ptr.session_id
    `);
    console.log(`✅ Обновлено ${updateResult.rowCount} записей`);
    
    console.log('🎉 Миграция завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  } finally {
    await pool.end();
  }
}

addEmailField();


