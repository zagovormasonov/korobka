# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ: Письма с неправильным доменом

## 🔍 Проблемы:
1. ✅ **ИСПРАВЛЕНО:** В письмах приходили ссылки на `korobka-1.onrender.com`
2. 🔧 **В РАБОТЕ:** На странице после оплаты показывается старая ссылка `korobka-1.onrender.com`

## 🎯 Причина:
Переменная `REACT_APP_FRONTEND_URL` не установлена в Render Dashboard, поэтому используется `window.location.origin`

## ⚡ ОБНОВЛЕНИЕ - ПИСЬМА ИСПРАВЛЕНЫ!

✅ **Письма теперь приходят с правильными ссылками!**  
🔧 **Осталось исправить:** отображение ссылки на странице после оплаты

## 🚀 ФИНАЛЬНОЕ РЕШЕНИЕ:

### Шаг 1: Добавить переменную в Render Dashboard
1. Зайдите в [Render Dashboard](https://dashboard.render.com/)
2. Найдите ваш сервис `mental-health-test` (или `mental-health-test-fast`)
3. Перейдите в **Environment** 
4. Добавьте новую переменную:
   - **Key:** `REACT_APP_FRONTEND_URL`
   - **Value:** `https://idenself.com`
5. Нажмите **Save Changes**

### Шаг 2: Пересобрать приложение
1. В Render Dashboard перейдите на вкладку **Manual Deploy**
2. Нажмите **Deploy latest commit**
3. Дождитесь завершения сборки (~5-10 минут)

### Шаг 3: Проверить исправление
После деплоя:
1. Совершите тестовую оплату
2. Проверьте письмо - ссылка должна быть `https://idenself.com/lk/...`
3. В консоли браузера должны появиться логи:
   ```
   🔧 REACT_APP_FRONTEND_URL: https://idenself.com
   🌐 window.location.origin: https://korobka-1.onrender.com
   📧 Используемый baseUrl для письма: https://idenself.com
   🔗 Финальный URL для письма: https://idenself.com/lk/abc123...
   ```

## 🔧 Техническая информация:

### Текущая логика (НЕ РАБОТАЕТ):
```javascript
// Переменная не установлена в Render
const baseUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
// Результат: https://korobka-1.onrender.com (неправильно!)
```

### После исправления (РАБОТАЕТ):
```javascript
// Используем правильный fallback для всех случаев
const baseUrl = process.env.REACT_APP_FRONTEND_URL || 'https://idenself.com';
// Результат: https://idenself.com (правильно!)
```

## ⚠️ ВАЖНО:
- Переменные `REACT_APP_*` компилируются в код при сборке
- Поэтому **ОБЯЗАТЕЛЬНО** нужен редеплой после добавления переменной
- Без редеплоя изменения не вступят в силу

## 📋 Проверочный список:
- [x] ✅ Письма содержат правильные ссылки на `idenself.com`
- [ ] Переменная `REACT_APP_FRONTEND_URL=https://idenself.com` добавлена в Render
- [ ] Приложение пересобрано (Manual Deploy)  
- [ ] На странице после оплаты показывается правильная ссылка `idenself.com`
- [ ] В консоли видны отладочные логи с правильным URL

## 🎯 Ожидаемый результат:
✅ Письма: `https://idenself.com/lk/token`  
✅ Отображение на странице: `https://idenself.com/lk/token`  
✅ Пользователи попадают на правильный домен
