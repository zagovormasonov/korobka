# Миграция на Supabase

## 🚀 Преимущества Supabase

- **Бесплатный план** - 500MB базы данных
- **Автоматические бэкапы** и восстановление
- **Встроенная аутентификация** (если понадобится)
- **Real-time подписки** (если понадобится)
- **Простое управление** через веб-интерфейс
- **PostgreSQL совместимость** - минимальные изменения в коде

## 📋 Пошаговая миграция

### Шаг 1: Создание проекта Supabase

1. **Перейдите на [supabase.com](https://supabase.com)**
2. **Нажмите "Start your project"**
3. **Войдите через GitHub** (рекомендуется)
4. **Создайте новый проект**:
   - **Name**: mental-health-test
   - **Database Password**: создайте надежный пароль
   - **Region**: выберите ближайший к вам
5. **Дождитесь создания** проекта (2-3 минуты)

### Шаг 2: Настройка базы данных

1. **Откройте SQL Editor** в панели Supabase
2. **Скопируйте содержимое** файла `supabase/schema.sql`
3. **Вставьте и выполните** SQL код
4. **Проверьте создание таблиц** в разделе "Table Editor"

### Шаг 3: Получение данных подключения

1. **Перейдите в Settings → Database**
2. **Скопируйте данные подключения**:
   - **Host**: `db.xxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: ваш пароль

3. **Перейдите в Settings → API**
4. **Скопируйте ключи**:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJ...` (публичный ключ)
   - **service_role**: `eyJ...` (сервисный ключ)

### Шаг 4: Настройка Render.com

1. **Создайте новый Web Service** в Render.com
2. **Используйте `render-supabase.yaml`** как конфигурацию
3. **Установите переменные окружения**:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ... (публичный ключ)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (сервисный ключ)

# Supabase Database
POSTGRESQL_HOST=db.xxx.supabase.co
POSTGRESQL_PORT=5432
POSTGRESQL_USER=postgres
POSTGRESQL_PASSWORD=your_password
POSTGRESQL_DBNAME=postgres

# Остальные переменные (как обычно)
GEMINI_API_KEY=your_gemini_api_key
TINKOFF_TERMINAL_KEY=1758050657600
TINKOFF_PASSWORD=$Khw7TJ#U*Rv_EDq
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
DISABLE_PROXY=true
DISABLE_PDF=true
NODE_ENV=production
```

### Шаг 5: Деплой приложения

1. **Запустите деплой** в Render.com
2. **Дождитесь завершения** билда (3-5 минут)
3. **Выполните инициализацию** Supabase:
   ```bash
   npm run init-supabase
   ```

### Шаг 6: Проверка работы

1. **Откройте приложение** в браузере
2. **Пройдите тест** полностью
3. **Проверьте сохранение данных** в Supabase:
   - Откройте Supabase → Table Editor
   - Проверьте таблицу `primary_test_results`

## 🔧 Настройка Row Level Security (RLS)

Supabase использует RLS для безопасности. В схеме уже настроены политики:

```sql
-- Разрешаем все операции для сервисного ключа
CREATE POLICY "Enable all operations for service role" ON primary_test_results
    FOR ALL USING (true);
```

## 📊 Сравнение с PostgreSQL

| Параметр | PostgreSQL | Supabase |
|----------|------------|----------|
| **Стоимость** | Платно | Бесплатно (500MB) |
| **Управление** | Сложно | Просто |
| **Бэкапы** | Ручные | Автоматические |
| **Мониторинг** | Базовый | Расширенный |
| **API** | Только SQL | SQL + REST + GraphQL |
| **Аутентификация** | Нет | Встроенная |

## ⚠️ Важные замечания

### Безопасность:
- **Используйте service_role ключ** только на сервере
- **anon ключ** можно использовать в клиенте (если понадобится)
- **RLS политики** защищают данные

### Ограничения бесплатного плана:
- **500MB** базы данных
- **2GB** bandwidth в месяц
- **50MB** файлового хранилища

### Миграция данных:
- **Экспортируйте данные** из старой БД
- **Импортируйте в Supabase** через SQL Editor
- **Или создайте скрипт миграции**

## 🎯 Преимущества для вашего проекта

1. **Бесплатно** - не нужно платить за БД
2. **Простота** - веб-интерфейс для управления
3. **Надежность** - автоматические бэкапы
4. **Масштабируемость** - легко увеличить план
5. **Совместимость** - PostgreSQL совместимость

## 🚀 Следующие шаги

1. **Создайте проект Supabase**
2. **Выполните SQL схему**
3. **Настройте Render.com**
4. **Запустите деплой**
5. **Проверьте работу**

**Миграция на Supabase займет 15-30 минут!** 🎉
