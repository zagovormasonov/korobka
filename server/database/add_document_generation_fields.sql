-- Добавление полей для отслеживания генерации документов
-- Добавляем поля в таблицу primary_test_results для отслеживания статуса генерации

-- Добавляем поля для отслеживания генерации документов
ALTER TABLE primary_test_results 
ADD COLUMN IF NOT EXISTS personal_plan_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS session_preparation_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS psychologist_pdf_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS documents_generation_started BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS documents_generation_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS documents_generation_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS documents_generation_completed_at TIMESTAMP;

-- Добавляем поля для хранения сгенерированных PDF документов
ALTER TABLE primary_test_results 
ADD COLUMN IF NOT EXISTS personal_plan_pdf BYTEA,
ADD COLUMN IF NOT EXISTS session_preparation_pdf BYTEA,
ADD COLUMN IF NOT EXISTS psychologist_pdf BYTEA,
-- Альтернативные форматы для тестирования
ADD COLUMN IF NOT EXISTS personal_plan_pdf_base64 TEXT,
ADD COLUMN IF NOT EXISTS session_preparation_pdf_base64 TEXT,
ADD COLUMN IF NOT EXISTS psychologist_pdf_base64 TEXT;

-- Создаем индекс для оптимизации запросов по статусу генерации
CREATE INDEX IF NOT EXISTS idx_primary_test_documents_generation 
ON primary_test_results(documents_generation_started, documents_generation_completed);
