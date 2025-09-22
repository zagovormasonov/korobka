-- Миграция для добавления недостающих колонок в Supabase
-- Выполните этот SQL в Supabase SQL Editor

-- Добавляем недостающие колонки в primary_test_results
ALTER TABLE primary_test_results 
ADD COLUMN IF NOT EXISTS dashboard_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS dashboard_password VARCHAR(255);

-- Добавляем недостающую колонку в additional_test_results
ALTER TABLE additional_test_results 
ADD COLUMN IF NOT EXISTS test_url VARCHAR(500);

-- Добавляем недостающую колонку в psychologist_requests
ALTER TABLE psychologist_requests 
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);

-- Создаем таблицу session_feedback если её нет
CREATE TABLE IF NOT EXISTS session_feedback (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    feedback_text TEXT NOT NULL,
    ai_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id) ON DELETE CASCADE
);

-- Добавляем индекс для session_feedback
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON session_feedback(session_id);

-- Включаем RLS для session_feedback
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

-- Создаем политику RLS для session_feedback
CREATE POLICY "Enable all operations for service role" ON session_feedback
    FOR ALL USING (true);

-- Проверяем структуру таблиц
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('primary_test_results', 'additional_test_results', 'psychologist_requests', 'session_feedback')
ORDER BY table_name, ordinal_position;
