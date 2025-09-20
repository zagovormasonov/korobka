-- Шаг 1: Добавляем поле email
ALTER TABLE additional_test_results 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);



