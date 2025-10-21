# 🚨 СРОЧНАЯ МИГРАЦИЯ БАЗЫ ДАННЫХ

## Проблема
В таблице `psychologist_requests` отсутствуют колонки:
- `request_number` - номер заявки
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` - UTM-метки

## Решение
Выполните SQL-миграцию в Supabase SQL Editor:

### 1. Откройте Supabase Dashboard
- Перейдите в ваш проект Supabase
- Откройте раздел "SQL Editor"

### 2. Выполните миграцию
Скопируйте и выполните следующий SQL:

```sql
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

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_psychologist_requests_request_number 
ON psychologist_requests(request_number);

CREATE INDEX IF NOT EXISTS idx_psychologist_requests_utm_source 
ON psychologist_requests(utm_source);

CREATE INDEX IF NOT EXISTS idx_psychologist_requests_utm_campaign 
ON psychologist_requests(utm_campaign);
```

### 3. Проверьте результат
После выполнения миграции:
1. Перейдите в раздел "Table Editor"
2. Откройте таблицу `psychologist_requests`
3. Убедитесь, что появились новые колонки:
   - `request_number`
   - `utm_source`
   - `utm_medium`
   - `utm_campaign`
   - `utm_term`
   - `utm_content`

## После миграции
- Заявки на подбор психолога будут работать корректно
- UTM-метки будут сохраняться в базе данных
- Номера заявок будут генерироваться и сохраняться

## Файлы миграции
- `supabase/migration_add_request_number_and_utm.sql` - SQL для миграции
- `supabase/schema.sql` - обновленная схема базы данных
