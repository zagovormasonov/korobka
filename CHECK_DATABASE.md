# Проверка базы данных

## Шаг 1: Проверьте значение в базе данных

1. Откройте **Supabase Dashboard**
2. Перейдите в **Table Editor** → **primary_test_results**
3. Найдите свою запись (по `nickname` или `session_id`)
4. Проверьте значение колонки `personal_plan_unlocked`

### Если значение `false` (или пустое):

Это означает, что флаг не сохранился при нажатии кнопки. 

**Выполните SQL вручную:**

```sql
-- Замените YOUR_SESSION_ID на ваш реальный session_id
UPDATE primary_test_results 
SET personal_plan_unlocked = true 
WHERE session_id = 'YOUR_SESSION_ID';
```

Ваш `session_id` из логов: `975600e6-d253-4f2f-9606-77679e58efb0`

Так что выполните:

```sql
UPDATE primary_test_results 
SET personal_plan_unlocked = true 
WHERE session_id = '975600e6-d253-4f2f-9606-77679e58efb0';
```

### Если значение `true`:

Тогда проблема в API - он не возвращает правильное значение.

## Шаг 2: Проверьте логи сервера

Откройте логи вашего деплоя и найдите:

```
🔐 [DASHBOARD] Проверяем токен: ...
🔓 [DASHBOARD] personal_plan_unlocked из БД: ...
```

Это покажет, что именно возвращает база данных.

## Шаг 3: Проверьте структуру таблицы

Выполните SQL:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'primary_test_results'
  AND column_name = 'personal_plan_unlocked';
```

Должно вернуть:
```
personal_plan_unlocked | boolean | NO | false
```

## Возможная проблема

Если поле `personal_plan_unlocked` НЕ существует или имеет другой тип, добавьте его:

```sql
-- Только если поле отсутствует!
ALTER TABLE primary_test_results
ADD COLUMN personal_plan_unlocked BOOLEAN DEFAULT false NOT NULL;
```

## После исправления

1. Обновите страницу в браузере (F5)
2. Должно сразу показаться: персональный план
3. В логах должно быть: `personalPlanUnlocked: true`


