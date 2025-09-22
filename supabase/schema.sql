-- Supabase Database Schema
-- Выполните этот SQL в Supabase SQL Editor

-- Включаем расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Таблица результатов первичного теста
CREATE TABLE IF NOT EXISTS primary_test_results (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    answers JSONB NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица результатов дополнительных тестов
CREATE TABLE IF NOT EXISTS additional_test_results (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id) ON DELETE CASCADE
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id) ON DELETE CASCADE
);

-- Таблица токенов дашборда
CREATE TABLE IF NOT EXISTS dashboard_tokens (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id) ON DELETE CASCADE
);

-- Таблица заявок на подбор психолога
CREATE TABLE IF NOT EXISTS psychologist_requests (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id) ON DELETE CASCADE
);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_primary_test_session_id ON primary_test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_additional_test_session_id ON additional_test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_token ON dashboard_tokens(token);
CREATE INDEX IF NOT EXISTS idx_dashboard_tokens_session_id ON dashboard_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_psychologist_requests_session_id ON psychologist_requests(session_id);

-- Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггеры для автоматического обновления updated_at
CREATE TRIGGER update_primary_test_results_updated_at 
    BEFORE UPDATE ON primary_test_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем Row Level Security (RLS)
ALTER TABLE primary_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologist_requests ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS (разрешаем все операции для сервисного ключа)
CREATE POLICY "Enable all operations for service role" ON primary_test_results
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for service role" ON additional_test_results
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for service role" ON payments
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for service role" ON dashboard_tokens
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for service role" ON psychologist_requests
    FOR ALL USING (true);
