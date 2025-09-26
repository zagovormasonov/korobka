# Отладка проблемы с перебросом после оплаты

## 🚨 Проблема

После успешной оплаты пользователь не переходит на следующий этап (личный кабинет).

## 🔍 Возможные причины

### 1. Неправильный URL в настройках платежа
- **Проблема**: `FRONTEND_URL` не установлен в Render.com
- **Решение**: Исправлено в коде - теперь используется `RENDER_EXTERNAL_URL` с fallback на `https://idenself.com`

### 2. Отсутствие токена дашборда
- **Проблема**: `dashboard_token` и `dashboard_password` не сохраняются в базе данных
- **Решение**: Добавлено логирование для отслеживания

### 3. Проблемы с Supabase
- **Проблема**: Колонки `dashboard_token` и `dashboard_password` отсутствуют
- **Решение**: Выполните миграцию из `supabase/migration_add_missing_columns.sql`

## 🔧 Шаги для отладки

### 1. Проверьте логи сервера на Render.com

Откройте логи вашего сервиса и найдите:

```
🔍 Запрос данных теста для sessionId: [sessionId]
✅ Данные найдены: {
  session_id: "...",
  email: "...",
  has_dashboard_token: true/false,
  has_dashboard_password: true/false
}
```

### 2. Проверьте логи браузера

Откройте Developer Tools (F12) и найдите:

```
🔍 Загружаем данные дашборда для sessionId: [sessionId]
📥 Ответ от API: {success: true, data: {...}}
✅ Токен дашборда получен: [token]
🚀 Переход в дашборд, токен: [token]
🔗 URL дашборда: /lk/[token]
```

### 3. Проверьте переменные окружения

В Render.com убедитесь, что установлены:
- `RENDER_EXTERNAL_URL` (автоматически устанавливается Render.com)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Проверьте структуру базы данных

Выполните в Supabase SQL Editor:

```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'primary_test_results'
ORDER BY ordinal_position;
```

Убедитесь, что есть колонки:
- `dashboard_token`
- `dashboard_password`

## 🚀 Исправления

### 1. Обновлен URL платежа
```javascript
SuccessURL: `${process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL || 'https://idenself.com'}/payment-success?sessionId=${sessionId}`
```

### 2. Добавлено логирование
- В `PaymentSuccessPage.tsx` - для отслеживания получения токена
- В `server/routes/tests.js` - для отслеживания сохранения и получения данных
- В `server/routes/payments.js` - для отслеживания URL платежа

### 3. Улучшена обработка ошибок
- Добавлены проверки на наличие токена
- Улучшены сообщения об ошибках

## 📋 Чек-лист для проверки

- [ ] Выполнена миграция Supabase (`migration_add_missing_columns.sql`)
- [ ] Переменные окружения установлены в Render.com
- [ ] Логи сервера показывают успешное сохранение токена
- [ ] Логи браузера показывают успешное получение токена
- [ ] Кнопка "Перейти в личный кабинет" активна
- [ ] Переход на `/lk/[token]` работает

## 🆘 Если проблема остается

1. **Проверьте логи** - найдите конкретную ошибку
2. **Проверьте базу данных** - убедитесь, что данные сохраняются
3. **Проверьте сетевые запросы** - убедитесь, что API работает
4. **Проверьте роутинг** - убедитесь, что `/lk/:token` работает

## 📞 Поддержка

Если проблема не решается, предоставьте:
1. Логи сервера с ошибками
2. Логи браузера (Console)
3. Скриншот страницы после оплаты
4. Информацию о том, на каком этапе происходит сбой
