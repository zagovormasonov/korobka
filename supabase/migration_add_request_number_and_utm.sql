-- Миграция для добавления колонок request_number и UTM-меток в таблицу psychologist_requests
-- Выполните этот SQL в Supabase SQL Editor

-- Добавляем колонку request_number
ALTER TABLE psychologist_requests 
ADD COLUMN IF NOT EXISTS request_number VARCHAR(50);

-- Добавляем UTM-метки
ALTER TABLE psychologist_requests 
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);

ALTER TABLE psychologist_requests 
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);

ALTER TABLE psychologist_requests 
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);

ALTER TABLE psychologist_requests 
ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);

ALTER TABLE psychologist_requests 
ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);

-- Создаем индекс для request_number для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_psychologist_requests_request_number 
ON psychologist_requests(request_number);

-- Создаем индекс для UTM-меток для аналитики
CREATE INDEX IF NOT EXISTS idx_psychologist_requests_utm_source 
ON psychologist_requests(utm_source);

CREATE INDEX IF NOT EXISTS idx_psychologist_requests_utm_campaign 
ON psychologist_requests(utm_campaign);
