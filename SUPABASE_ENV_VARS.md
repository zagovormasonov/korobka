# Переменные окружения для Supabase (без PostgreSQL)

## 🚀 Обязательные переменные для Render.com

### 1. Supabase (обязательные):

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Остальные переменные:

```bash
NODE_ENV=production
NODE_VERSION=18
PORT=10000
GEMINI_API_KEY=your_gemini_api_key
TINKOFF_TERMINAL_KEY=1758050657542DEMO
TINKOFF_PASSWORD=djg$4uums6S_*UbV
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
DISABLE_PROXY=true
DISABLE_PDF=true
```

## 📍 Где найти данные Supabase:

### 1. **SUPABASE_URL** и **SUPABASE_ANON_KEY**:
- Зайдите в панель Supabase
- Перейдите в **Settings → API**
- Скопируйте:
  - **Project URL** → `SUPABASE_URL`
  - **anon public** → `SUPABASE_ANON_KEY`

### 2. **SUPABASE_SERVICE_ROLE_KEY**:
- В том же разделе **Settings → API**
- Скопируйте **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Важно:

- **SUPABASE_SERVICE_ROLE_KEY** - используйте только на сервере (не в клиенте)
- **SUPABASE_ANON_KEY** - можно использовать в клиенте
- **Больше НЕ нужны** PostgreSQL переменные!

## 🎯 Пример заполнения:

```bash
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2MjQwMCwiZXhwIjoyMDE0MzM4NDAwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk4NzYyNDAwLCJleHAiOjIwMTQzMzg0MDB9.example
GEMINI_API_KEY=your_gemini_api_key
TINKOFF_TERMINAL_KEY=1758050657542DEMO
TINKOFF_PASSWORD=djg$4uums6S_*UbV
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
DISABLE_PROXY=true
DISABLE_PDF=true
NODE_ENV=production
NODE_VERSION=18
PORT=10000
```

## 🔧 Настройка в Render.com:

1. **Откройте ваш Web Service** в Render.com
2. **Перейдите в раздел "Environment"**
3. **Добавьте все переменные** из списка выше
4. **Сохраните изменения**
5. **Перезапустите сервис**

## ✅ Преимущества:

- **Проще настройка** - только 3 переменные Supabase
- **Нет PostgreSQL** - убраны все сложности
- **Современный подход** - используем только Supabase API
- **Быстрее деплой** - меньше зависимостей

После настройки всех переменных ваш сервис должен успешно подключиться к Supabase! 🎉
