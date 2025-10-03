# Добавление поля personal_plan в базу данных

## Описание

Добавляем поле `personal_plan` в таблицу `primary_test_results` для кэширования сгенерированных персональных планов. Это решает проблему с таймаутом при генерации PDF.

## Миграция в Supabase

### Вариант 1: Через SQL Editor (Рекомендуется)

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Нажмите **"New query"**
3. Вставьте следующий SQL:

```sql
-- Добавляем поле personal_plan для кэширования сгенерированных планов
ALTER TABLE primary_test_results
ADD COLUMN IF NOT EXISTS personal_plan TEXT;

-- Проверяем, что поле добавлено
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'primary_test_results'
  AND column_name = 'personal_plan';
```

4. Нажмите **"Run"**
5. Убедитесь, что запрос выполнился успешно

### Вариант 2: Через Table Editor

1. Откройте **Supabase Dashboard** → **Table Editor**
2. Выберите таблицу **`primary_test_results`**
3. Нажмите **"Add column"** или "+" рядом с последней колонкой
4. Заполните поля:
   - **Name**: `personal_plan`
   - **Type**: `text`
   - **Nullable**: ✅ (да)
   - **Default Value**: (оставьте пустым)
5. Нажмите **"Save"**

## Как работает кэширование

### До изменений (медленно, с таймаутами):
1. Пользователь нажимает "Скачать персональный план"
2. Фронтенд → `/api/pdf/personal-plan`
3. Backend → `/api/ai/personal-plan` (генерация через Gemini AI ~30+ секунд)
4. ❌ **Таймаут** → соединение разрывается

### После изменений (быстро):
1. Пользователь нажимает "Скачать персональный план"
2. Фронтенд → `/api/pdf/personal-plan`
3. Backend → `/api/ai/personal-plan`
   - ✅ **Есть кэш** → возвращаем мгновенно
   - ⏳ **Нет кэша** → генерируем (1 раз), сохраняем, возвращаем
4. PDF генерируется из кэшированного плана → быстро!

## Преимущества

- ✅ Решена проблема с таймаутом
- ✅ Быстрая загрузка PDF при повторных запросах
- ✅ Снижена нагрузка на Gemini API
- ✅ Экономия на API вызовах

## Проверка

После добавления поля выполните:

```sql
-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'primary_test_results'
ORDER BY ordinal_position;
```

Должны увидеть:
```
personal_plan | text | YES | null
```

## Примечание

Поле `personal_plan` будет:
- Пустым (`null`) для новых пользователей
- Заполняться автоматически при первой генерации плана
- Переиспользоваться при повторных запросах

