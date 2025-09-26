# ✅ ИСПРАВЛЕНИЕ: Перенаправление после оплаты

## Проблема
После успешной оплаты Тинькофф перенаправлял пользователя на старый домен `korobka-1.onrender.com` вместо `idenself.com`.

## Причина
В файле `server/routes/payments.js` для SuccessURL и FailURL использовалась логика:
```javascript
// БЫЛО (неправильно):
SuccessURL: `${process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL || 'https://idenself.com'}/payment-success?sessionId=${sessionId}`
```

Переменная `RENDER_EXTERNAL_URL` содержала старый домен и имела приоритет над `FRONTEND_URL`.

## ✅ Решение

Изменена логика в `server/routes/payments.js`:

```javascript
// СТАЛО (правильно):
const baseUrl = process.env.FRONTEND_URL || 'https://idenself.com';
SuccessURL: `${baseUrl}/payment-success?sessionId=${sessionId}`,
FailURL: `${baseUrl}/payment?sessionId=${sessionId}&payment=failed`,
```

### Что изменилось:
- ✅ Убрана зависимость от `RENDER_EXTERNAL_URL`
- ✅ Приоритет отдан `FRONTEND_URL` (который равен `https://idenself.com`)
- ✅ Fallback на `https://idenself.com` если переменная не установлена
- ✅ Добавлено логирование для отладки

## 🚀 Деплой

**Сделайте деплой для применения изменений:**

1. Зайдите в [Render Dashboard](https://dashboard.render.com/)
2. **Manual Deploy** → **Deploy latest commit**
3. Дождитесь завершения сборки

## 🧪 Проверка

После деплоя проверьте весь флоу:

1. Откройте `https://idenself.com`
2. Пройдите тест
3. Нажмите "Оплатить 1 ₽"
4. Завершите оплату в Тинькофф
5. **Должно перенаправить на `https://idenself.com/payment-success`**

В логах Render должно появиться:
```
🌐 Base URL для платежей: https://idenself.com
🌐 SuccessURL: https://idenself.com/payment-success?sessionId=...
```

## ✅ Результат
Теперь после успешной оплаты пользователя будет перенаправлять на правильный домен `idenself.com`!
