-- Добавляем поле nickname в таблицу primary_test_results
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'primary_test_results'
        AND column_name = 'nickname'
    ) THEN
        ALTER TABLE primary_test_results
        ADD COLUMN nickname VARCHAR(255);

        RAISE NOTICE 'Колонка nickname добавлена в таблицу primary_test_results';
    ELSE
        RAISE NOTICE 'Колонка nickname уже существует в таблице primary_test_results';
    END IF;
END $$;
