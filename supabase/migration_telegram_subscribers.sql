-- Миграция: Таблица подписчиков Telegram бота для уведомлений
-- Выполните этот SQL в Supabase SQL Editor

-- Таблица подписчиков Telegram бота для уведомлений
CREATE TABLE IF NOT EXISTS telegram_subscribers (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,  -- ID пользователя Telegram
    chat_id BIGINT NOT NULL,  -- ID чата (может отличаться от user_id в группах)
    username VARCHAR(255),    -- Опционально, username пользователя
    first_name VARCHAR(255),  -- Имя пользователя
    last_name VARCHAR(255),   -- Фамилия пользователя
    is_active BOOLEAN DEFAULT true,  -- Для отписки
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, chat_id)  -- Один пользователь = одна запись
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_user_id ON telegram_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_chat_id ON telegram_subscribers(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_subscribers_is_active ON telegram_subscribers(is_active);

-- RLS политика
ALTER TABLE telegram_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for service role" ON telegram_subscribers
    FOR ALL USING (true);

