-- SQL скрипт для добавления поля email в таблицу additional_test_results

-- 1. Добавляем поле email (если его еще нет)
ALTER TABLE additional_test_results 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Создаем индекс для оптимизации поиска по email
CREATE INDEX IF NOT EXISTS idx_additional_test_email 
ON additional_test_results(email);

-- 3. Обновляем существующие записи, заполняя email из связанной таблицы primary_test_results
-- ВАЖНО: Выполните эту команду отдельно после создания поля email
UPDATE additional_test_results 
SET email = ptr.email 
FROM primary_test_results ptr 
WHERE additional_test_results.session_id = ptr.session_id;

-- 4. Проверяем результат
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'additional_test_results' 
ORDER BY ordinal_position;

-- 5. Показываем количество обновленных записей
SELECT 
    COUNT(*) as total_records,
    COUNT(email) as records_with_email,
    COUNT(*) - COUNT(email) as records_without_email
FROM additional_test_results;
