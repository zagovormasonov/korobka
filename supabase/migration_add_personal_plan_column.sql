-- Добавление колонки personal_plan в таблицу primary_test_results
-- Эта колонка хранит сгенерированный персональный план пользователя

-- Проверяем, существует ли колонка, и добавляем её, если нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'primary_test_results' 
        AND column_name = 'personal_plan'
    ) THEN
        ALTER TABLE primary_test_results 
        ADD COLUMN personal_plan TEXT;
        
        RAISE NOTICE 'Колонка personal_plan успешно добавлена';
    ELSE
        RAISE NOTICE 'Колонка personal_plan уже существует';
    END IF;
END $$;

-- Создаем индекс для быстрого поиска пользователей с планами
CREATE INDEX IF NOT EXISTS idx_primary_test_results_personal_plan_exists 
ON primary_test_results((personal_plan IS NOT NULL));

-- Комментарий к колонке
COMMENT ON COLUMN primary_test_results.personal_plan IS 
'Персональный план психологического благополучия, сгенерированный AI на основе результатов тестов';

