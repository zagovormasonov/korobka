-- Создание таблиц для базы данных

-- Таблица для хранения результатов первичного теста
CREATE TABLE IF NOT EXISTS primary_test_results (
    id SERIAL PRIMARY KEY,
    session_id UUID UNIQUE NOT NULL,
    email VARCHAR(255),
    answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для хранения результатов дополнительных тестов
CREATE TABLE IF NOT EXISTS additional_test_results (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    email VARCHAR(255),
    test_name VARCHAR(255) NOT NULL,
    test_url VARCHAR(500),
    test_result TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id)
);

-- Таблица для хранения платежей
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    payment_id VARCHAR(255) UNIQUE,
    amount INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id)
);

-- Таблица для хранения заявок на подбор психолога
CREATE TABLE IF NOT EXISTS psychologist_requests (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telegram_username VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id)
);

-- Таблица для хранения обратной связи по сеансам
CREATE TABLE IF NOT EXISTS session_feedback (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    feedback_text TEXT NOT NULL,
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES primary_test_results(session_id)
);

-- Индексы для оптимизации (с обработкой ошибок)
DO $$
BEGIN
    -- Создаем индексы только если они не существуют
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_primary_test_session_id') THEN
        CREATE INDEX idx_primary_test_session_id ON primary_test_results(session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_additional_test_session_id') THEN
        CREATE INDEX idx_additional_test_session_id ON additional_test_results(session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_session_id') THEN
        CREATE INDEX idx_payments_session_id ON payments(session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_payment_id') THEN
        CREATE INDEX idx_payments_payment_id ON payments(payment_id);
    END IF;
END $$;
