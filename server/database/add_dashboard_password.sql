-- Добавляем поле dashboard_password в таблицу primary_test_results
ALTER TABLE primary_test_results 
ADD COLUMN IF NOT EXISTS dashboard_password VARCHAR(255);

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_dashboard_password ON primary_test_results(dashboard_password);
