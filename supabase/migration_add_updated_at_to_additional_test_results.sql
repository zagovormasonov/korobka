-- Добавляем колонку updated_at в таблицу additional_test_results
-- Это позволит отслеживать время последнего обновления записи

ALTER TABLE additional_test_results
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Создаем индекс для быстрой сортировки по updated_at
CREATE INDEX IF NOT EXISTS idx_additional_test_results_updated_at 
ON additional_test_results(updated_at DESC);

-- Обновляем существующие записи, устанавливая updated_at = created_at
UPDATE additional_test_results
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Устанавливаем триггер для автоматического обновления updated_at при UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггер, если его еще нет
DROP TRIGGER IF EXISTS update_additional_test_results_updated_at ON additional_test_results;
CREATE TRIGGER update_additional_test_results_updated_at
    BEFORE UPDATE ON additional_test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

