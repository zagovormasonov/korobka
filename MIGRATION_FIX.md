# Исправление ошибки: column additional_test_results.email does not exist

## Проблема
В таблице `additional_test_results` отсутствует колонка `email`, что вызывает ошибку 500 при загрузке результатов дополнительных тестов.

## Решение

### Вариант 1: Автоматическая миграция
Запустите команду для автоматического добавления колонки:

```bash
npm run migrate:add-email
```

### Вариант 2: Ручное выполнение SQL
Выполните следующий SQL запрос в вашей базе данных:

```sql
-- Добавляем колонку email если её нет
ALTER TABLE additional_test_results 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_additional_test_email 
ON additional_test_results(email);

-- Обновляем существующие записи
UPDATE additional_test_results 
SET email = (
    SELECT ptr.email 
    FROM primary_test_results ptr 
    WHERE ptr.session_id = additional_test_results.session_id
)
WHERE email IS NULL;
```

### Вариант 3: Через Supabase Dashboard
1. Откройте Supabase Dashboard
2. Перейдите в Table Editor
3. Выберите таблицу `additional_test_results`
4. Добавьте новую колонку:
   - Name: `email`
   - Type: `varchar`
   - Length: `255`
   - Nullable: `true`

## Проверка
После выполнения миграции убедитесь, что:
1. Колонка `email` добавлена в таблицу `additional_test_results`
2. Существующие записи обновлены с email из `primary_test_results`
3. Приложение больше не выдает ошибку "column does not exist"

## Что изменилось в коде
- Обновлен роут `/api/tests/additional/save-result` для сохранения email
- Обновлены API роуты в `server/routes/ai.js` для поиска по email
- Исправлены имена колонок в запросах (`test_type` → `test_name`, `answers` → `test_result`)
