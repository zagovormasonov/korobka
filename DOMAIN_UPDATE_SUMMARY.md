# 🌐 Обновление домена с korobka-1.onrender.com на idenself.com

## ✅ Выполненные изменения:

### 1. **Обновлены fallback URL в платежах**
📁 `server/routes/payments.js`
- SuccessURL: `korobka-1.onrender.com` → `idenself.com`
- FailURL: `korobka-1.onrender.com` → `idenself.com`

### 2. **Исправлены ссылки в письмах с доступом к ЛК**
📁 `src/pages/PaymentSuccessPage.tsx`
- Добавлена поддержка переменной `REACT_APP_FRONTEND_URL`
- Теперь ссылки формируются правильно: `https://idenself.com/lk/token`

### 3. **Обновлены файлы конфигурации**

#### Переменные окружения:
- `env.example` - добавлена `REACT_APP_FRONTEND_URL=https://idenself.com`
- `env.render.example` - добавлена `REACT_APP_FRONTEND_URL=https://idenself.com` 
- `env.supabase.example` - добавлена `REACT_APP_FRONTEND_URL=https://idenself.com`

#### Render конфигурация:
- `render.yaml` - добавлена переменная `REACT_APP_FRONTEND_URL: https://idenself.com`
- `render-fast.yaml` - добавлена переменная `REACT_APP_FRONTEND_URL: https://idenself.com`

### 4. **Обновлена документация**
📁 `PAYMENT_DEBUG_GUIDE.md`
- Исправлены примеры с новым доменом

## 🔧 Как работает новая логика:

### Платежи (Тинькофф):
```javascript
// Приоритет URL для редиректов:
// 1. process.env.RENDER_EXTERNAL_URL (автоматически от Render)
// 2. process.env.FRONTEND_URL (установлен в render.yaml)
// 3. 'https://idenself.com' (fallback)

SuccessURL: `${process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL || 'https://idenself.com'}/payment-success?sessionId=${sessionId}`
```

### Ссылки в письмах:
```javascript
// Приоритет URL для писем:
// 1. process.env.REACT_APP_FRONTEND_URL (установлен в render.yaml)
// 2. window.location.origin (текущий домен)

const baseUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
const dashboardUrl = `${baseUrl}/lk/${token}`;
```

## 📧 Результат для пользователей:

### До изменений:
- Письма могли содержать ссылки на `korobka-1.onrender.com`
- Fallback URL в платежах указывал на старый домен

### После изменений:
- ✅ Все письма содержат ссылки на `https://idenself.com/lk/token`
- ✅ Fallback URL в платежах указывает на `https://idenself.com`
- ✅ Пользователи всегда получают правильные ссылки

## 🚀 Деплой:

После деплоя на Render переменная `REACT_APP_FRONTEND_URL=https://idenself.com` будет автоматически установлена, и все ссылки будут работать корректно.

## 🔍 Проверка:

1. **Проверить письма:** После оплаты ссылка должна быть `https://idenself.com/lk/...`
2. **Проверить платежи:** SuccessURL и FailURL должны указывать на `idenself.com`
3. **Проверить переменные:** В Render Dashboard должна быть `REACT_APP_FRONTEND_URL`

Теперь все компоненты системы используют правильный домен `idenself.com`!
