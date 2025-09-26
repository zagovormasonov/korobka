-- Простая версия миграции для выполнения в Supabase Dashboard
-- Выполняйте команды по одной

-- 1. Добавляем колонку email
ALTER TABLE additional_test_results 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_additional_test_email 
ON additional_test_results(email);

-- 3. Обновляем существующие записи
UPDATE additional_test_results 
SET email = (
    SELECT ptr.email 
    FROM primary_test_results ptr 
    WHERE ptr.session_id = additional_test_results.session_id
)
WHERE email IS NULL;
