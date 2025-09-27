# Миграция для добавления поля nickname

## Проблема
API endpoint `/api/dashboard/create-credentials` возвращает ошибку 500, скорее всего из-за отсутствия поля `nickname` в таблице `primary_test_results`.

## Решение
Выполните следующий SQL в Supabase Dashboard:

### SQL для выполнения:
```sql
ALTER TABLE primary_test_results
ADD COLUMN IF NOT EXISTS nickname VARCHAR(255);
```

### Как выполнить:
1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Перейдите в ваш проект
3. Перейдите в **SQL Editor**
4. Вставьте SQL команду выше
5. Нажмите **Run**

### Проверка:
После выполнения миграции проверьте таблицу:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'primary_test_results';
```

Должно появиться поле `nickname` с типом `character varying`.

## Альтернативное решение
Если миграция по каким-то причинам не работает, код уже содержит fallback - он попробует обновить запись без поля `nickname`.

## После миграции
1. Сделайте Manual Deploy на Render
2. Протестируйте создание учетных данных после оплаты
3. Проверьте логи сервера для диагностики

## Логи для диагностики
После деплоя в логах Render должны появиться подробные сообщения с префиксом `[DASHBOARD]`, которые помогут понять, что именно происходит при сохранении данных.
