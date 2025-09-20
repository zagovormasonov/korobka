-- Шаг 3: Обновляем существующие записи
UPDATE additional_test_results 
SET email = ptr.email 
FROM primary_test_results ptr 
WHERE additional_test_results.session_id = ptr.session_id;



