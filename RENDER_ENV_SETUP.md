# Настройка переменных окружения на Render

## ⚠️ ВАЖНО: Все секретные ключи должны быть в переменных окружения!

GitHub автоматически сканирует код на наличие секретных ключей и блокирует их при обнаружении. Все API ключи, пароли и токены должны храниться **только** в переменных окружения на сервере.

## 📋 Обязательные переменные окружения

### 1. База данных Supabase
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Google Gemini AI API
```
GEMINI_API_KEY=your_gemini_api_key
```
**⚠️ ВНИМАНИЕ**: Если старый ключ был заблокирован GitHub, создайте новый на https://makersuite.google.com/app/apikey

### 3. Тинькофф Платежи (БОЕВЫЕ данные)
```
TINKOFF_TERMINAL_KEY=1758050657600
TINKOFF_PASSWORD=$Khw7TJ#U*Rv_EDq
```

### 4. Telegram Bot
```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 5. EmailJS (для отправки писем с данными доступа)
```
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
```

### 6. Прокси для Gemini API (если используется в РФ)
```
PROXY_HOST=your_proxy_host
PROXY_PORT=9999
PROXY_PROTOCOL=socks5
PROXY_TYPE=socks5
PROXY_USERNAME=your_proxy_username
PROXY_PASSWORD=your_proxy_password
DISABLE_PROXY=false
```

### 7. URL-адреса
```
FRONTEND_URL=https://idenself.com
BACKEND_URL=https://idenself.com
REACT_APP_FRONTEND_URL=https://idenself.com
VITE_API_BASE_URL=https://idenself.com
```

### 8. Дополнительные настройки
```
NODE_ENV=production
PORT=5000
```

## 🚀 Как настроить на Render.com

1. **Зайдите в Dashboard Render**
   - Откройте https://dashboard.render.com
   - Выберите ваш Web Service

2. **Перейдите в Environment**
   - В левом меню выберите **Environment**
   - Нажмите **Add Environment Variable**

3. **Добавьте переменные**
   - Для каждой переменной из списка выше:
     - **Key**: имя переменной (например, `GEMINI_API_KEY`)
     - **Value**: значение переменной
   - Нажмите **Save Changes**

4. **Перезапуск сервиса**
   - Render автоматически перезапустит сервис после сохранения
   - Проверьте логи, чтобы убедиться, что все работает

## 🔍 Проверка конфигурации

После настройки переменных окружения проверьте логи сервера:

```
✅ Должны быть сообщения:
- "🔑 Gemini API Key: установлен"
- "🔑 Terminal Key: установлен"
- "🔑 Password: установлен"

❌ НЕ должно быть:
- "❌ Отсутствуют обязательные переменные окружения"
- "❌ Отсутствуют настройки платежей"
```

## 📝 Примечания

1. **Никогда не коммитьте файл `.env`** - он должен быть в `.gitignore`
2. **Используйте файлы `env.example`** как шаблоны
3. **Создавайте новые API ключи** если старые были скомпрометированы
4. **Проверяйте логи** после каждого изменения переменных

## 🆘 Решение проблем

### GitHub заблокировал API ключ
1. Создайте новый ключ в соответствующем сервисе
2. Обновите переменную окружения на Render
3. **НЕ** добавляйте ключ в код напрямую

### Gemini API не работает
1. Проверьте, что `GEMINI_API_KEY` установлен
2. Проверьте, что ключ действителен
3. Если в РФ, настройте прокси (см. раздел 6)

### Платежи не работают
1. Проверьте `TINKOFF_TERMINAL_KEY` и `TINKOFF_PASSWORD`
2. Убедитесь, что используете боевые данные (не DEMO)
3. Проверьте логи на ошибки от API Тинькофф
