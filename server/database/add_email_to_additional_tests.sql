-- Добавление колонки email в таблицу additional_test_results
-- Эта миграция добавляет отсутствующую колонку email

DO $$
BEGIN
    -- Проверяем, существует ли колонка email
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'additional_test_results' 
        AND column_name = 'email'
    ) THEN
        -- Добавляем колонку email
        ALTER TABLE additional_test_results 
        ADD COLUMN email VARCHAR(255);
        
        RAISE NOTICE 'Колонка email добавлена в таблицу additional_test_results';
    ELSE
        RAISE NOTICE 'Колонка email уже существует в таблице additional_test_results';
    END IF;
    
    -- Создаем индекс для колонки email для быстрого поиска
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_additional_test_email') THEN
        CREATE INDEX idx_additional_test_email ON additional_test_results(email);
        RAISE NOTICE 'Индекс idx_additional_test_email создан';
    END IF;
    
    -- Обновляем существующие записи, заполняя email из primary_test_results
    UPDATE additional_test_results 
    SET email = (
        SELECT ptr.email 
        FROM primary_test_results ptr 
        WHERE ptr.session_id = additional_test_results.session_id
    )
    WHERE email IS NULL;
    
    RAISE NOTICE 'Email заполнен для существующих записей additional_test_results';
END $$;
