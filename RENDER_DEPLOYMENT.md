# Инструкция по деплою на Render.com

## 1. Подготовка к деплою

### 1.1 Создание базы данных PostgreSQL
1. Войдите в панель Render.com
2. Создайте новый PostgreSQL сервис:
   - Выберите "PostgreSQL"
   - Выберите план (Starter для начала)
   - Запишите данные подключения

### 1.2 Настройка переменных окружения
В панели Render.com в разделе Environment Variables добавьте:

```
POSTGRESQL_HOST=<ваш_postgres_host>
POSTGRESQL_PORT=5432
POSTGRESQL_USER=<ваш_postgres_user>
POSTGRESQL_PASSWORD=<ваш_postgres_password>
POSTGRESQL_DBNAME=<ваш_postgres_database>
GEMINI_API_KEY=<ваш_gemini_api_key>
TINKOFF_TERMINAL_KEY=<ваш_terminal_key>
TINKOFF_PASSWORD=<ваш_password>
TELEGRAM_BOT_TOKEN=<ваш_bot_token>
TELEGRAM_CHAT_ID=<ваш_chat_id>
EMAILJS_PUBLIC_KEY=<ваш_emailjs_public_key>
EMAILJS_SERVICE_ID=<ваш_emailjs_service_id>
EMAILJS_TEMPLATE_ID=<ваш_emailjs_template_id>
DISABLE_PROXY=true
NODE_ENV=production
```

## 2. Деплой приложения

### 2.1 Создание Web Service
1. В панели Render.com нажмите "New +"
2. Выберите "Web Service"
3. Подключите ваш GitHub репозиторий
4. Настройте параметры:
   - **Name**: mental-health-test
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter (или выше)

### 2.2 Настройка переменных окружения
Добавьте все переменные из раздела 1.2

## 3. Инициализация базы данных

После успешного деплоя выполните инициализацию БД:

1. Подключитесь к вашему сервису через SSH или используйте Render Shell
2. Выполните команду:
```bash
npm run init-db
```

## 4. Проверка работы

### 4.1 Health Check
Проверьте доступность API:
- `https://your-app-name.onrender.com/api/health`
- `https://your-app-name.onrender.com/api/health/database`

### 4.2 Тестирование функций
1. Откройте главную страницу приложения
2. Пройдите тест
3. Проверьте генерацию сообщений маскота
4. Проверьте создание платежей

## 5. Особенности для Render.com

### 5.1 Статическая раздача
- Фронтенд автоматически собирается в папку `dist/`
- Express сервер раздает статические файлы в продакшне
- Все маршруты SPA перенаправляются на `index.html`

### 5.2 CORS настройки
- Разрешены запросы с `*.render.com` доменов
- Настроена поддержка credentials

### 5.3 Переменные окружения
- `DISABLE_PROXY=true` - отключает прокси для Gemini API
- `NODE_ENV=production` - включает продакшн режим
- `PORT` - Render автоматически устанавливает порт

## 6. Мониторинг и логи

### 6.1 Просмотр логов
В панели Render.com перейдите в раздел "Logs" для просмотра логов приложения

### 6.2 Мониторинг производительности
- Используйте встроенные метрики Render.com
- Настройте алерты при ошибках

## 7. Обновление приложения

Для обновления приложения:
1. Запушьте изменения в GitHub
2. Render.com автоматически пересоберет и перезапустит приложение
3. Проверьте логи на наличие ошибок

## 8. Troubleshooting

### 8.1 Ошибки сборки
- Проверьте логи сборки в панели Render.com
- Убедитесь, что все зависимости установлены

### 8.2 Ошибки базы данных
- Проверьте переменные окружения для БД
- Убедитесь, что БД доступна из Render.com

### 8.3 Ошибки Gemini API
- Проверьте `GEMINI_API_KEY`
- Убедитесь, что `DISABLE_PROXY=true`

## 9. Безопасность

### 9.1 Переменные окружения
- Никогда не коммитьте `.env` файлы
- Используйте только Environment Variables в Render.com

### 9.2 API ключи
- Регулярно обновляйте API ключи
- Используйте разные ключи для dev/prod

## 10. Масштабирование

### 10.1 Увеличение ресурсов
- Перейдите на более высокий план в Render.com
- Настройте автомасштабирование

### 10.2 Оптимизация
- Используйте CDN для статических файлов
- Настройте кэширование
