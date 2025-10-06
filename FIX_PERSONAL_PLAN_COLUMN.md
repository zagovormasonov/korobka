# 🔧 СРОЧНОЕ ИСПРАВЛЕНИЕ: Добавление колонки personal_plan

## 🎯 Проблема

В базе данных отсутствует колонка `personal_plan` в таблице `primary_test_results`.

**Ошибка из логов:**
```
column primary_test_results.personal_plan does not exist
```

## ✅ Решение (2 минуты)

### Вариант 1: Через Supabase Dashboard (РЕКОМЕНДУЕТСЯ)

1. **Откройте Supabase Dashboard**
   - Зайдите на https://supabase.com/dashboard
   - Выберите ваш проект

2. **Откройте SQL Editor**
   - В боковом меню нажмите "SQL Editor"
   - Нажмите "New query"

3. **Скопируйте и выполните этот SQL:**

```sql
-- Добавление колонки personal_plan в таблицу primary_test_results
ALTER TABLE primary_test_results 
ADD COLUMN IF NOT EXISTS personal_plan TEXT;

-- Создаем индекс для оптимизации
CREATE INDEX IF NOT EXISTS idx_primary_test_results_personal_plan_exists 
ON primary_test_results((personal_plan IS NOT NULL));

-- Добавляем комментарий
COMMENT ON COLUMN primary_test_results.personal_plan IS 
'Персональный план психологического благополучия, сгенерированный AI';
```

4. **Нажмите "Run" или Ctrl+Enter**

5. **Должно появиться:**
   ```
   Success. No rows returned
   ```

### Вариант 2: Через файл миграции

Если у вас настроен Supabase CLI:

```bash
# Находясь в папке korobka/
supabase db push
```

Это применит файл `korobka/supabase/migration_add_personal_plan_column.sql`

### Вариант 3: Через psql (если есть прямой доступ)

```bash
# Подключитесь к БД и выполните:
psql "your_connection_string" -f korobka/supabase/migration_add_personal_plan_column.sql
```

## 🔍 Проверка

После выполнения миграции проверьте, что колонка добавлена:

```sql
-- Выполните в SQL Editor:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'primary_test_results' 
AND column_name = 'personal_plan';
```

**Должен быть результат:**
```
column_name    | data_type
---------------+-----------
personal_plan  | text
```

## 🚀 После миграции

1. **НЕ НУЖНО перезапускать сервер** - изменения в БД применяются сразу

2. **Попробуйте снова сгенерировать план:**
   - Откройте личный кабинет
   - Нажмите "Скачать персональный план"
   - Подождите 30-60 секунд

3. **Проверьте логи:**
   ```
   ✅ [PERSONAL-PLAN] План получен от Gemini
   ✅ [PERSONAL-PLAN] Персональный план сохранён в БД
   ✅ [PDF-PERSONAL-PLAN] HTML успешно отправлен клиенту
   ```

## 🎯 Ожидаемый результат

### До миграции (текущее):
```
❌ [PERSONAL-PLAN] Результаты теста не найдены: {
  message: 'column primary_test_results.personal_plan does not exist'
}
```

### После миграции:
```
✅ [PERSONAL-PLAN] Промпт успешно прочитан
🚀 [PERSONAL-PLAN] Вызываем Gemini API...
✅ Gemini API ответ получен через SDK
✅ [PERSONAL-PLAN] План получен от Gemini
💾 [PERSONAL-PLAN] Сохраняем план в БД...
✅ [PERSONAL-PLAN] Персональный план сохранён в БД
✅ [PDF-PERSONAL-PLAN] HTML успешно отправлен клиенту
```

## ⚠️ Важно

- **Миграция безопасна** - использует `IF NOT EXISTS`, не удалит данные
- **Не требует остановки сервера** - можно выполнить прямо сейчас
- **Обратно совместима** - не сломает существующие функции

## 🆘 Если возникли проблемы

### Ошибка: "permission denied"

Убедитесь, что:
- Вы используете правильный проект в Supabase Dashboard
- У вас есть права администратора проекта

### Ошибка: "table does not exist"

Это значит, что таблица `primary_test_results` не существует. Нужно сначала создать её:

```sql
-- Создание таблицы (если её нет)
CREATE TABLE IF NOT EXISTS primary_test_results (
    id SERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    answers JSONB,
    email TEXT,
    nickname TEXT,
    lumi_dashboard_message TEXT,
    personal_plan TEXT,  -- <- наша новая колонка
    personal_plan_unlocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 📊 Дополнительная информация

### Что делает эта колонка?

`personal_plan` хранит сгенерированный AI персональный план в формате Markdown/текста. 

**Преимущества:**
- ✅ Кеширование: план генерируется 1 раз, потом берется из БД
- ✅ Быстрый доступ: не нужно каждый раз вызывать Gemini API
- ✅ Экономия: меньше запросов к платному API
- ✅ Надежность: план сохранен, даже если API недоступен

### Зачем нужен индекс?

Индекс `idx_primary_test_results_personal_plan_exists` ускоряет запросы типа:
```sql
SELECT * FROM primary_test_results WHERE personal_plan IS NOT NULL;
```

Это полезно для аналитики и поиска пользователей с готовыми планами.

---

**Следующий шаг:** Выполните SQL миграцию из Варианта 1 и попробуйте снова! 🚀

