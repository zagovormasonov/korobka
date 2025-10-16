# Исправление проблемы с SessionId

## Проблема
При первом входе в личный кабинет возникала ошибка:
```
SessionId пустой, пропускаем генерацию сообщения маскота
```

И в логах отображалось:
```
sessionId: true
```

## Причина
SessionId передавался как `true` вместо валидного UUID, что приводило к ошибкам в API запросах.

## Исправления

### 1. DashboardPage.tsx
Добавлены проверки валидности sessionId во всех критических местах:

- **В useEffect загрузки данных** - проверка на `true` и валидность UUID
- **В fetchAdditionalTestResults** - дополнительная проверка формата UUID
- **В startBackgroundGeneration** - проверка перед запуском фоновой генерации
- **В monitorGenerationStatus** - проверка перед мониторингом статуса

### 2. server/routes/dashboard.js
Добавлена проверка валидности sessionId в API endpoint `/verify-token`:

```javascript
// Проверяем валидность sessionId
if (!user.session_id || user.session_id === true || typeof user.session_id !== 'string') {
  console.error('❌ [DASHBOARD] Невалидный sessionId:', user.session_id);
  return res.status(500).json({ success: false, error: 'Invalid session ID' });
}
```

### 3. Логирование
Добавлено подробное логирование для диагностики:
- Тип sessionId
- Значение sessionId
- Проверка валидности UUID

## Результат

Теперь система:
1. ✅ **Проверяет валидность sessionId** на всех уровнях
2. ✅ **Автоматически перенаправляет** на логин при невалидном sessionId
3. ✅ **Показывает понятные ошибки** пользователю
4. ✅ **Логирует подробную информацию** для диагностики

## Тестирование

После применения исправлений:
1. Очистите localStorage: `localStorage.clear()`
2. Перезапустите сервер
3. Войдите в ЛК заново
4. Проверьте логи - sessionId должен быть валидным UUID

Если проблема сохраняется, проверьте базу данных на наличие записей с `session_id = true`.
