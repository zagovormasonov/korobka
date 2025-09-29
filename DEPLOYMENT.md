# Инструкции по развертыванию

## 1. Подготовка окружения

### Установка зависимостей
```bash
npm install
```

### Настройка переменных окружения
Скопируйте файл `env.example` в `.env` и заполните необходимые значения:

```bash
cp env.example .env
```

Заполните следующие переменные в `.env`:

```env
# База данных PostgreSQL (Timeweb)
POSTGRESQL_HOST=your_host
POSTGRESQL_PORT=5432
POSTGRESQL_USER=your_username
POSTGRESQL_PASSWORD=your_password
POSTGRESQL_DBNAME=your_database_name

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Тинькофф платежи
TINKOFF_TERMINAL_KEY=1758050657542DEMO
TINKOFF_PASSWORD=djg$4uums6S_*UbV

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Порт сервера
PORT=5000
```

## 2. Настройка базы данных

### Создание базы данных в Timeweb
1. Войдите в панель управления Timeweb
2. Создайте новую базу данных PostgreSQL-17
3. Создайте пользователя для базы данных
4. Скопируйте строку подключения в переменную `DATABASE_URL`

### Инициализация схемы базы данных
```bash
npm run init-db
```

## 3. Настройка Google Gemini API

1. Зарегистрируйтесь на https://makersuite.google.com/app/apikey
2. Создайте API ключ
3. Добавьте ключ в переменную `GEMINI_API_KEY`

## 4. Настройка платежей Тинькофф

1. Зарегистрируйтесь в Тинькофф Бизнес
2. Подключите интернет-эквайринг
3. Получите `terminal_key` и `password`
4. Добавьте их в переменные окружения

## 5. Настройка Telegram бота

1. Создайте бота через @BotFather в Telegram
2. Получите токен бота
3. Узнайте ID чата, куда будут приходить уведомления
4. Добавьте токен и ID в переменные окружения

## 6. Запуск приложения

### Режим разработки
```bash
npm run dev
```

### Продакшн режим
```bash
npm run build
npm start
```

## 7. Структура проекта

```
├── src/                    # Frontend код (React + TypeScript)
│   ├── pages/             # Страницы приложения
│   ├── App.tsx            # Главный компонент
│   └── main.tsx           # Точка входа
├── server/                # Backend код (Express + TypeScript)
│   ├── routes/            # API маршруты
│   ├── database/          # Схема базы данных
│   ├── scripts/           # Скрипты инициализации
│   └── index.js           # Главный серверный файл
├── public/                # Статические файлы
│   └── mascot.svg         # Изображение маскота
└── package.json           # Зависимости и скрипты
```

## 8. API Endpoints

### Тесты
- `GET /api/tests/primary/questions` - Получить вопросы первичного теста
- `POST /api/tests/primary/save` - Сохранить результаты первичного теста
- `GET /api/tests/primary/:sessionId` - Получить результаты первичного теста
- `POST /api/tests/additional/save` - Сохранить результаты дополнительного теста
- `GET /api/tests/additional/:sessionId` - Получить результаты дополнительных тестов

### ИИ (Google Gemini)
- `POST /api/ai/mascot-message/payment` - Генерировать сообщение маскота для страницы оплаты
- `POST /api/ai/mascot-message/dashboard` - Генерировать сообщение маскота для личного кабинета
- `POST /api/ai/personal-plan` - Генерировать персональный план
- `POST /api/ai/session-preparation` - Генерировать подготовку к сеансу
- `POST /api/ai/session-feedback` - Анализировать обратную связь по сеансу

### Платежи (Тинькофф)
- `POST /api/payments/create` - Создать платеж
- `GET /api/payments/status/:paymentId` - Проверить статус платежа
- `POST /api/payments/webhook` - Webhook для уведомлений от Тинькофф
- `GET /api/payments/session/:sessionId` - Получить платеж по sessionId

### Telegram
- `POST /api/telegram/psychologist-request` - Отправить заявку на подбор психолога
- `GET /api/telegram/psychologist-requests` - Получить заявки на подбор психолога
- `POST /api/telegram/test-completed` - Уведомить о завершении теста
- `POST /api/telegram/payment-completed` - Уведомить об оплате

### PDF
- `POST /api/pdf/personal-plan` - Скачать персональный план в PDF
- `POST /api/pdf/session-preparation` - Скачать подготовку к сеансу в PDF

## 9. Особенности развертывания

### Timeweb PostgreSQL
- Используйте SSL соединение в продакшне
- Настройте правильные права доступа для пользователя базы данных
- Убедитесь, что база данных доступна извне

### Puppeteer для PDF
- В продакшне может потребоваться установка дополнительных зависимостей для Puppeteer
- Настройте правильные права для запуска браузера

### Переменные окружения
- Никогда не коммитьте файл `.env` в репозиторий
- Используйте разные значения для разработки и продакшна
- Регулярно обновляйте API ключи  
