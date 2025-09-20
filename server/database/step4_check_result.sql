-- Шаг 4: Проверяем результат
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'additional_test_results' 
ORDER BY ordinal_position;

-- Показываем статистику
SELECT 
    COUNT(*) as total_records,
    COUNT(email) as records_with_email,
    COUNT(*) - COUNT(email) as records_without_email
FROM additional_test_results;



