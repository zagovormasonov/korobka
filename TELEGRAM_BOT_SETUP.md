# Инструкция по настройке Telegram бота для уведомлений

## 1. Создание бота в Telegram

1. Откройте Telegram и найдите бота [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям и создайте нового бота
4. Сохраните полученный токен бота (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Добавьте токен в переменные окружения Render как `TG_BOT_TOKEN`

## 2. Создание таблицы в Supabase

1. Откройте Supabase Dashboard → SQL Editor
2. Выполните SQL из файла `supabase/migration_telegram_subscribers.sql`
3. Проверьте, что таблица `telegram_subscribers` создана

## 3. Настройка Webhook (для production)

После деплоя на Render, настройте webhook для получения обновлений от Telegram:

### Вариант 1: Через API endpoint (рекомендуется)

После деплоя выполните POST запрос на:
```
POST https://your-app.onrender.com/api/telegram-notifications/set-webhook
```

Или установите переменную окружения `TELEGRAM_WEBHOOK_URL` в Render:
```
TELEGRAM_WEBHOOK_URL=https://your-app.onrender.com/api/telegram-notifications/webhook
```

Затем вызовите endpoint:
```
POST https://your-app.onrender.com/api/telegram-notifications/set-webhook
```

### Вариант 2: Вручную через Telegram API

Выполните запрос напрямую к Telegram API:
```
curl -X POST "https://api.telegram.org/bot<YOUR_TG_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.onrender.com/api/telegram-notifications/webhook"}'
```

Замените:
- `<YOUR_TG_BOT_TOKEN>` на ваш токен бота
- `https://your-app.onrender.com` на URL вашего приложения

## 4. Проверка работы

1. Откройте Telegram и найдите вашего бота
2. Отправьте команду `/start`
3. Бот должен ответить приветственным сообщением
4. Проверьте в Supabase, что запись появилась в таблице `telegram_subscribers`

## 5. Проверка статуса webhook

Выполните GET запрос:
```
GET https://your-app.onrender.com/api/telegram-notifications/webhook-info
```

## 6. API Endpoints

### Webhook для получения обновлений
- **POST** `/api/telegram-notifications/webhook` - Telegram отправляет сюда обновления

### Управление webhook
- **POST** `/api/telegram-notifications/set-webhook` - Установить webhook URL
- **GET** `/api/telegram-notifications/webhook-info` - Получить информацию о webhook

### Управление подписчиками
- **GET** `/api/telegram-notifications/subscribers` - Получить список всех активных подписчиков
- **POST** `/api/telegram-notifications/broadcast` - Отправить рассылку всем подписчикам
  ```json
  {
    "message": "Текст сообщения для рассылки"
  }
  ```

## 7. Структура таблицы telegram_subscribers

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL | Уникальный ID записи |
| user_id | BIGINT | ID пользователя Telegram |
| chat_id | BIGINT | ID чата (обычно равен user_id для личных чатов) |
| username | VARCHAR(255) | Username пользователя (опционально) |
| first_name | VARCHAR(255) | Имя пользователя |
| last_name | VARCHAR(255) | Фамилия пользователя (опционально) |
| is_active | BOOLEAN | Активен ли подписчик (для отписки) |
| subscribed_at | TIMESTAMP | Дата и время подписки |
| last_message_at | TIMESTAMP | Дата и время последнего сообщения |

## 8. Приветственное сообщение

При команде `/start` бот отправляет следующее сообщение:

```
Привет! Здесь будут приходить уведомления о новых функциях idenself. Подписывайся на дневник создания проекта @idenself_channel и пиши обратную связь об использовании сервиса нам в личку @idenself
```

## 9. Важные замечания

- **Webhook URL должен быть HTTPS** - Telegram не принимает HTTP для webhook
- **Webhook должен быть доступен публично** - Telegram должен иметь возможность отправлять POST запросы
- **Бот должен отвечать быстро** - Webhook endpoint должен отвечать 200 OK в течение нескольких секунд
- **Данные сохраняются в Supabase** - Все подписчики хранятся в таблице `telegram_subscribers`

## 10. Отладка

Если бот не отвечает:

1. Проверьте, что `TG_BOT_TOKEN` установлен в переменных окружения
2. Проверьте логи сервера на наличие ошибок
3. Проверьте статус webhook через `/api/telegram-notifications/webhook-info`
4. Убедитесь, что таблица `telegram_subscribers` создана в Supabase
5. Проверьте, что webhook URL доступен извне (не localhost)

