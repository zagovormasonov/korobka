# СРОЧНО: Добавьте поле в базу данных

## Ошибка
```
Failed to load resource: the server responded with a status of 500
```

## Причина
Поле `personal_plan_unlocked` отсутствует в таблице `primary_test_results`.

## Решение (выберите один из способов)

### Способ 1: Supabase Dashboard UI

1. Откройте https://app.supabase.com
2. Выберите ваш проект
3. Перейдите в **Table Editor** → **primary_test_results**
4. Нажмите **"+ New Column"** (справа сверху)
5. Заполните форму:
   ```
   Name: personal_plan_unlocked
   Type: boolean
   Default value: false
   Is Nullable: ✗ (снимите галочку)
   Is Unique: ✗ (не отмечено)
   Is Primary Key: ✗ (не отмечено)
   ```
6. Нажмите **"Save"**

### Способ 2: SQL Query

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Создайте новый запрос
3. Вставьте и выполните:

```sql
ALTER TABLE primary_test_results
ADD COLUMN personal_plan_unlocked BOOLEAN DEFAULT false NOT NULL;
```

4. Нажмите **"Run"** или `Cmd+Enter`

### Проверка успешности

После добавления поля выполните проверочный запрос:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'primary_test_results'
  AND column_name = 'personal_plan_unlocked';
```

Должно вернуть:
```
column_name              | data_type | is_nullable | column_default
-------------------------|-----------|-------------|----------------
personal_plan_unlocked   | boolean   | NO          | false
```

### Проверка в приложении

1. Обновите страницу личного кабинета в браузере
2. Нажмите кнопку "Перейти к персональному плану"
3. Должно появиться:
   - Сообщение: "Добро пожаловать в персональный план!"
   - Страница переключится на 4 карточки персонального плана

### Если всё еще не работает

Проверьте логи сервера:
- **Render:** Dashboard → Logs
- **Vercel:** Dashboard → Deployments → View Function Logs
- **Railway:** Dashboard → Service → Logs

Ищите сообщения с префиксом:
```
❌ [DASHBOARD] Ошибка при разблокировке:
```

## Дополнительная информация

Это поле используется для:
- Сохранения состояния перехода к персональному плану
- Постоянного отображения персонального плана вместо тестов
- Предотвращения повторного показа тестов после их завершения

## Откат (если нужно)

Чтобы вернуть пользователя к тестам:

```sql
UPDATE primary_test_results 
SET personal_plan_unlocked = false 
WHERE nickname = 'USERNAME';
```

## Удаление поля (если нужно откатить миграцию)

```sql
ALTER TABLE primary_test_results
DROP COLUMN personal_plan_unlocked;
```

