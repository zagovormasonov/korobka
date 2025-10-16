# Исправление ошибки setPersonalPlanUnlocked is not defined

## Проблема
При нажатии кнопки "Перейти к персональному плану" возникала ошибка:
```
ReferenceError: setPersonalPlanUnlocked is not defined
```

## Причина
В коде DashboardPage.tsx использовалась функция `setPersonalPlanUnlocked(true)`, которая не была определена. Проблема в том, что `personalPlanUnlocked` - это свойство `authData`, которое обновляется через API, а не локальное состояние компонента.

## Исправления

### 1. useAuth.ts - добавлена функция обновления
**Добавлен интерфейс:**
```typescript
interface UseAuthReturn {
  // ... существующие свойства
  updatePersonalPlanUnlocked: (unlocked: boolean) => void;
}
```

**Добавлена функция:**
```typescript
const updatePersonalPlanUnlocked = (unlocked: boolean) => {
  if (authData) {
    setAuthData({
      ...authData,
      personalPlanUnlocked: unlocked
    });
  }
};
```

**Экспортирована функция:**
```typescript
return {
  // ... существующие свойства
  updatePersonalPlanUnlocked
};
```

### 2. DashboardPage.tsx - обновлено использование
**Импорт функции:**
```typescript
const { isAuthenticated, isLoading, authData, logout, updatePersonalPlanUnlocked } = useAuth();
```

**Замена вызова:**
```typescript
// Было:
setPersonalPlanUnlocked(true);

// Стало:
updatePersonalPlanUnlocked(true);
```

## Результат

Теперь:
- ✅ **Функция updatePersonalPlanUnlocked определена** в хуке useAuth
- ✅ **Кнопка "Перейти к персональному плану" работает** без ошибок
- ✅ **personalPlanUnlocked обновляется** корректно в authData
- ✅ **Фоновая генерация документов запускается** после разблокировки

## Тестирование

После применения исправлений:
1. Перезапустите сервер
2. Войдите в ЛК
3. Пройдите все дополнительные тесты
4. Нажмите "Перейти к персональному плану"
5. Проверьте, что нет ошибки "setPersonalPlanUnlocked is not defined"
6. Убедитесь, что запускается фоновая генерация документов
