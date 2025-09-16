-- Добавляем поле dashboard_token в таблицу primary_test_results
ALTER TABLE primary_test_results 
ADD COLUMN IF NOT EXISTS dashboard_token VARCHAR(255) UNIQUE;

-- Создаем индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_dashboard_token ON primary_test_results(dashboard_token);
