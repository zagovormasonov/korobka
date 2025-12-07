-- Делаем поле answers необязательным, чтобы можно было создавать запись при начале теста
-- Выполните этот SQL в Supabase SQL Editor

ALTER TABLE primary_test_results 
ALTER COLUMN answers DROP NOT NULL;

-- Добавляем комментарий для ясности
COMMENT ON COLUMN primary_test_results.answers IS 'Ответы на вопросы теста. Может быть NULL если пользователь только начал тест.';

