# Исправление ошибки Supabase - недостающие колонки

## 🚨 Проблема

Ошибка: `Could not find the 'dashboard_password' column of 'primary_test_results' in the schema cache`

Это означает, что в вашей базе данных Supabase отсутствуют необходимые колонки.

## 🔧 Решение

### 1. Выполните миграцию в Supabase SQL Editor

1. **Откройте Supabase Dashboard**
2. **Перейдите в SQL Editor**
3. **Выполните SQL из файла `supabase/migration_add_missing_columns.sql`**

Или скопируйте и выполните этот SQL:

```sql
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
```

### 2. Проверьте структуру таблиц

Выполните этот запрос для проверки:

```sql
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('primary_test_results', 'additional_test_results', 'psychologist_requests', 'session_feedback')
ORDER BY table_name, ordinal_position;
```

### 3. Перезапустите приложение

После выполнения миграции:
1. **Перезапустите ваш сервис на Render.com**
2. **Проверьте работу приложения**

## 📋 Ожидаемый результат

После миграции в таблице `primary_test_results` должны быть колонки:
- `dashboard_token` (VARCHAR)
- `dashboard_password` (VARCHAR)

В таблице `additional_test_results`:
- `test_url` (VARCHAR)

В таблице `psychologist_requests`:
- `telegram_username` (VARCHAR)

И должна существовать таблица `session_feedback`.

## ✅ Проверка

После миграции ошибка `Could not find the 'dashboard_password' column` должна исчезнуть, и приложение должно работать корректно.

## 🆘 Если проблемы остаются

1. **Проверьте переменные окружения** в Render.com
2. **Убедитесь, что SUPABASE_SERVICE_ROLE_KEY правильный**
3. **Проверьте логи сервера** на Render.com
4. **Выполните полную схему** из `supabase/schema.sql` заново
