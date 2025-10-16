# Исправление ошибки с двойным authData

## Проблема
В коде DashboardPage.tsx использовался неправильный путь к sessionId:
```javascript
authData?.authData?.sessionId  // ❌ Неправильно - двойной authData
```

Вместо:
```javascript
authData?.sessionId  // ✅ Правильно
```

## Исправленные места

### 1. generateMascotMessage функция
**Было:**
```javascript
if (!authData?.authData?.sessionId || authData?.sessionId.trim() === '') {
```

**Стало:**
```javascript
if (!authData?.sessionId || authData?.sessionId.trim() === '') {
```

### 2. useEffect для загрузки результатов тестов
**Было:**
```javascript
if (recommendedTests.length > 0 && authData?.authData?.sessionId && authData?.personalPlanUnlocked === false) {
```

**Стало:**
```javascript
if (recommendedTests.length > 0 && authData?.sessionId && authData?.personalPlanUnlocked === false) {
```

### 3. useEffect для проверки завершенности тестов
**Было:**
```javascript
if (recommendedTests.length > 0 && authData?.authData?.personalPlanUnlocked === false) {
```

**Стало:**
```javascript
if (recommendedTests.length > 0 && authData?.personalPlanUnlocked === false) {
```

### 4. useEffect для автоматического скролла
**Было:**
```javascript
if (allTestsCompleted && completionButtonRef.current && authData?.authData?.personalPlanUnlocked === false) {
```

**Стало:**
```javascript
if (allTestsCompleted && completionButtonRef.current && authData?.personalPlanUnlocked === false) {
```

### 5. Логирование
**Было:**
```javascript
sessionId: !!authData?.sessionId,  // Показывало true/false
```

**Стало:**
```javascript
sessionId: authData?.sessionId,  // Показывает реальное значение
```

## Результат

Теперь:
- ✅ **SessionId правильно читается** из authData
- ✅ **Генерация сообщения маскота работает** корректно
- ✅ **Логирование показывает** реальные значения
- ✅ **Все проверки sessionId** работают правильно

## Тестирование

После применения исправлений:
1. Перезапустите сервер
2. Войдите в ЛК
3. Проверьте логи - больше не должно быть ошибки "SessionId пустой"
4. Генерация сообщения маскота должна работать
