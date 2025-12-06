-- Создание таблицы analytics_events для отслеживания событий пользователей
-- Используйте этот SQL в Supabase SQL Editor

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_url TEXT,
  metadata JSONB, -- Для хранения дополнительных данных (номер вопроса, процент прохождения и т.д.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date ON analytics_events(event_type, created_at);

-- Комментарии для понимания структуры
COMMENT ON TABLE analytics_events IS 'Таблица для отслеживания событий пользователей (аналитика воронки)';
COMMENT ON COLUMN analytics_events.session_id IS 'ID сессии пользователя';
COMMENT ON COLUMN analytics_events.event_type IS 'Тип события: page_visit, test_start, test_question_N, test_complete, payment_init, payment_success';
COMMENT ON COLUMN analytics_events.page_url IS 'URL страницы, где произошло событие';
COMMENT ON COLUMN analytics_events.metadata IS 'JSON с дополнительными данными (номер вопроса, процент прохождения, название теста и т.д.)';

-- Примеры событий:
-- page_visit: { url: '/', referrer: 'google.com' }
-- test_start: { test_type: 'primary' }
-- test_question: { question_number: 5, total_questions: 20, test_type: 'primary' }
-- test_complete: { test_type: 'primary', duration_seconds: 300 }
-- payment_init: { amount: 10 }
-- payment_success: { amount: 10, payment_id: 'xxx' }

