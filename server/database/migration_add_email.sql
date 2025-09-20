-- Миграция для добавления поля email в таблицу additional_test_results
-- Выполнить эту команду в PostgreSQL для обновления существующей таблицы

ALTER TABLE additional_test_results 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Создаем индекс для оптимизации поиска по email
CREATE INDEX IF NOT EXISTS idx_additional_test_email ON additional_test_results(email);

-- Обновляем существующие записи, заполняя email из связанной таблицы primary_test_results
UPDATE additional_test_results 
SET email = ptr.email 
FROM primary_test_results ptr 
WHERE additional_test_results.session_id = ptr.session_id 
AND additional_test_results.email IS NULL;



