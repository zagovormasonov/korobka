# Диагностика проблемы с SessionId

## Проблема
При первом входе в личный кабинет возникает ошибка:
```
SessionId пустой, пропускаем генерацию сообщения маскота
```

И в логах видно:
```
sessionId: true
```

## Возможные причины

1. **SessionId в БД равен `true` вместо UUID**
2. **Проблема с API endpoint `/verify-token`**
3. **Неправильная обработка данных в useAuth хуке**

## Диагностика

### 1. Проверьте базу данных
```bash
cd server
node scripts/debug_session_id.js
```

Этот скрипт покажет:
- Все session_id в базе данных
- Их типы и значения
- Записи с невалидными session_id

### 2. Проверьте логи сервера
При входе в ЛК должны появиться логи:
```
✅ [DASHBOARD] Токен валиден, sessionId: [UUID]
🔓 [DASHBOARD] personal_plan_unlocked из БД: [true/false]
```

### 3. Проверьте логи фронтенда
В консоли браузера должны быть логи:
```
🔄 [DASHBOARD] useEffect загрузки данных: {
  sessionId: true,
  sessionIdValue: "actual-uuid-here",
  sessionIdType: "string",
  ...
}
```

## Решения

### Если sessionId в БД равен `true`

1. **Найдите проблемную запись:**
```sql
SELECT * FROM primary_test_results WHERE session_id = true;
```

2. **Исправьте session_id:**
```sql
UPDATE primary_test_results 
SET session_id = gen_random_uuid() 
WHERE session_id = true;
```

### Если проблема в API

Проверьте, что в `server/routes/dashboard.js` в функции `/verify-token`:
- `user.session_id` возвращается как строка
- Есть проверка на валидность sessionId
- Логи показывают правильные значения

### Если проблема в фронтенде

Проверьте, что в `src/hooks/useAuth.ts`:
- `data.sessionId` правильно обрабатывается
- `setAuthData` получает правильные данные

## Временное решение

Если проблема критическая, можно добавить fallback в DashboardPage:

```typescript
// В DashboardPage.tsx
const validSessionId = authData?.sessionId && 
  authData.sessionId !== true && 
  typeof authData.sessionId === 'string' && 
  authData.sessionId.trim() !== '';

if (!validSessionId) {
  console.error('❌ Невалидный sessionId, перенаправляем на логин');
  navigate('/lk/login');
  return;
}
```

## Проверка после исправления

1. Очистите localStorage: `localStorage.clear()`
2. Перезапустите сервер
3. Войдите в ЛК заново
4. Проверьте логи - sessionId должен быть валидным UUID
