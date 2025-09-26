# Исправление CORS ошибки для домена idenself.com

## 🔍 Проблема
```
Error: Not allowed by CORS
```

Сервер блокировал запросы с домена `idenself.com`, потому что CORS был настроен только для `render.com` доменов.

## ✅ Исправление выполнено

### Обновлена конфигурация CORS в `server/index.js`:

1. **Добавлен домен idenself.com** в список разрешенных
2. **Добавлена поддержка поддоменов** (www.idenself.com, etc.)
3. **Добавлено логирование** заблокированных origins для отладки
4. **Добавлена переменная окружения** FRONTEND_URL

### Разрешенные домены:
- `https://idenself.com`
- `http://idenself.com` 
- `https://www.idenself.com`
- `http://www.idenself.com`
- Любые поддомены `*.idenself.com`
- Все домены `*.render.com`

### Обновлены конфигурации Render:
- `render.yaml`: добавлена переменная `FRONTEND_URL=https://idenself.com`
- `render-fast.yaml`: добавлена переменная `FRONTEND_URL=https://idenself.com`

## 🚀 Применение исправления

### Автоматическое исправление:
1. Код уже обновлен
2. При следующем деплое CORS заработает корректно
3. Белый экран исчезнет

### Проверка после деплоя:
1. Откройте https://idenself.com
2. Откройте DevTools (F12) → Console
3. Не должно быть ошибок CORS
4. Приложение должно загрузиться корректно

## 🔧 Дополнительная диагностика

### Если проблема остается:
1. Проверьте логи Render на наличие сообщений `❌ CORS blocked origin:`
2. Убедитесь, что переменная `FRONTEND_URL` установлена в настройках Render
3. Попробуйте очистить кэш браузера

### Тест CORS:
```bash
curl -H "Origin: https://idenself.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-render-url.com/api/health
```

## 📋 Что было изменено:

1. **server/index.js**: Обновлена логика CORS
2. **render.yaml**: Добавлена переменная FRONTEND_URL
3. **render-fast.yaml**: Добавлена переменная FRONTEND_URL

После деплоя домен `idenself.com` будет работать корректно без CORS ошибок!
