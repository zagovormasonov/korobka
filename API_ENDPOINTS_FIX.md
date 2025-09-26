# ✅ Исправление API Endpoints

## Проблема
Фронтенд на домене `idenself.com` пытался обращаться к API на том же домене (`https://idenself.com/api/...`), но API находится на `https://korobka-1.onrender.com/api/...`.

## Решение

### 1. Создана конфигурация API
- **Файл**: `src/config/api.ts`
- **Функции**:
  - `getApiBaseUrl()` - определяет базовый URL для API
  - `createApiUrl()` - создает полный URL для запроса
  - `apiRequest()` - обертка для fetch с правильным URL

### 2. Обновлены все компоненты
Заменены все `fetch('/api/...')` на `apiRequest('api/...')` в:
- ✅ `src/pages/DashboardPage.tsx`
- ✅ `src/pages/TestPage.tsx`
- ✅ `src/pages/PaymentPage.tsx`
- ✅ `src/pages/DashboardTokenPage.tsx`
- ✅ `src/pages/PaymentSuccessPage.tsx`

### 3. Добавлена переменная окружения
- **Переменная**: `VITE_API_BASE_URL=https://korobka-1.onrender.com`
- **Файлы конфигурации**:
  - ✅ `render.yaml`
  - ✅ `render-fast.yaml`
  - ✅ `env.example`
  - ✅ `env.render.example`
  - ✅ `env.supabase.example`

## Как это работает

### Development (localhost)
```typescript
// VITE_API_BASE_URL не установлен или import.meta.env.DEV = true
// Запросы идут через прокси Vite: localhost:3000/api -> localhost:5000/api
const url = '/api/tests/primary/submit'
```

### Production (idenself.com)
```typescript
// VITE_API_BASE_URL = 'https://korobka-1.onrender.com'
// Запросы идут напрямую на сервер API
const url = 'https://korobka-1.onrender.com/api/tests/primary/submit'
```

## Деплой изменений

**Обязательно сделайте деплой** чтобы изменения вступили в силу:

1. Зайдите в [Render Dashboard](https://dashboard.render.com/)
2. Найдите ваш сервис
3. **Manual Deploy** → **Deploy latest commit**
4. Дождитесь завершения сборки

## Проверка работы
После деплоя API запросы с `idenself.com` будут корректно направляться на `korobka-1.onrender.com` и ошибка 500 исчезнет.
