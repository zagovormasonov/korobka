-- Миграция для создания таблицы истории чата обратной связи
-- Выполните этот SQL в Supabase SQL Editor

-- Создаем таблицу для хранения сообщений чата обратной связи
CREATE TABLE IF NOT EXISTS feedback_chat_messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id) ON DELETE CASCADE
);

-- Добавляем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_feedback_chat_session_id ON feedback_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_chat_created_at ON feedback_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_chat_role ON feedback_chat_messages(role);

-- Включаем RLS для feedback_chat_messages
ALTER TABLE feedback_chat_messages ENABLE ROW LEVEL SECURITY;

-- Создаем политику RLS для feedback_chat_messages
CREATE POLICY "Enable all operations for service role" ON feedback_chat_messages
    FOR ALL USING (true);

-- Проверяем структуру таблицы
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'feedback_chat_messages'
ORDER BY ordinal_position;

