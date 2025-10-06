# Примеры логов для диагностики

## ✅ Успешная генерация плана

При нажатии кнопки "Скачать персональный план" вы должны увидеть:

```
📥 POST /api/pdf/personal-plan from origin: https://idenself.com
🎯 [PDF-PERSONAL-PLAN] Начало обработки запроса
🎯 [PDF-PERSONAL-PLAN] SessionId: 1234567890
🔗 [PDF-PERSONAL-PLAN] Вызываем AI API: http://127.0.0.1:5000/api/ai/personal-plan

📥 POST /api/ai/personal-plan from origin: no-origin
🎯 [PERSONAL-PLAN] Начало обработки запроса
🎯 [PERSONAL-PLAN] SessionId: 1234567890
🔍 [PERSONAL-PLAN] Получаем данные из БД...
📊 [PERSONAL-PLAN] Результат запроса к БД: { hasData: true, hasError: false }
✨ [PERSONAL-PLAN] Генерируем новый персональный план
🔑 [PERSONAL-PLAN] GEMINI_API_KEY установлен: ДА
📧 [PERSONAL-PLAN] Email пользователя: user@example.com
🔍 [PERSONAL-PLAN] Получаем дополнительные тесты из БД...
📊 [PERSONAL-PLAN] Дополнительные тесты: { hasTests: true, count: 5 }
👤 [PERSONAL-PLAN] Пол пользователя: мужской
📋 [PERSONAL-PLAN] Результаты доп. тестов: Тест на депрессию: 45 баллов...
📝 [PERSONAL-PLAN] Читаем шаблон промпта...
📝 [PERSONAL-PLAN] Путь к промпту: /path/to/prompt.txt
✅ [PERSONAL-PLAN] Промпт успешно прочитан, длина: 4523
📝 [PERSONAL-PLAN] Финальный промпт сформирован, длина: 6834
🚀 [PERSONAL-PLAN] Вызываем Gemini API...

🔬 Вызываем Gemini API через официальный SDK...
📝 Длина промпта: 6834 символов
🔑 API Key установлен: да
🔑 API Key первые 10 символов: AIzaSyCxYZ...
🌐 Прокси отключен, используем прямое подключение
🔧 Создаем клиент Google AI...
🤖 Получаем модель gemini-1.5-pro...
🚀 Отправляем запрос к Gemini через SDK...
⏱️ Время начала: 2025-10-06T12:34:56.789Z

... (подождите 20-60 секунд) ...

📦 Результат получен, обрабатываем ответ...
📝 Извлекаем текст из ответа...
✅ Gemini API ответ получен через SDK, длина: 8542 символов
⏱️ Время окончания: 2025-10-06T12:35:23.456Z

✅ [PERSONAL-PLAN] План получен от Gemini, длина: 8542
💾 [PERSONAL-PLAN] Сохраняем план в БД...
✅ [PERSONAL-PLAN] Персональный план сохранён в БД
🎉 [PERSONAL-PLAN] Отправляем успешный ответ клиенту

📥 [PDF-PERSONAL-PLAN] Ответ от AI API: 200 OK
📊 [PDF-PERSONAL-PLAN] Данные от AI API: { success: true, hasPlan: true, planLength: 8542, cached: false }
✅ [PDF-PERSONAL-PLAN] План получен, генерируем HTML...
📤 [PDF-PERSONAL-PLAN] Отправляем HTML клиенту, размер: 12345
✅ [PDF-PERSONAL-PLAN] HTML успешно отправлен клиенту
```

---

## ❌ Проблема: GEMINI_API_KEY не установлен

```
📥 POST /api/pdf/personal-plan from origin: https://idenself.com
🎯 [PDF-PERSONAL-PLAN] Начало обработки запроса
🎯 [PDF-PERSONAL-PLAN] SessionId: 1234567890
🔗 [PDF-PERSONAL-PLAN] Вызываем AI API: http://127.0.0.1:5000/api/ai/personal-plan

📥 POST /api/ai/personal-plan from origin: no-origin
🎯 [PERSONAL-PLAN] Начало обработки запроса
🎯 [PERSONAL-PLAN] SessionId: 1234567890
...
🔑 [PERSONAL-PLAN] GEMINI_API_KEY установлен: НЕТ
🚀 [PERSONAL-PLAN] Вызываем Gemini API...
🔬 Вызываем Gemini API через официальный SDK...
❌ Ошибка Gemini API через SDK: {
  message: 'GEMINI_API_KEY не установлен в переменных окружения',
  name: 'Error',
  ...
}
⚠️ Все попытки не удались, возвращаем заглушку
✅ [PERSONAL-PLAN] План получен от Gemini, длина: 79

❌ [PDF-PERSONAL-PLAN] Ошибка от AI API: ...
```

**Решение:**
1. Добавьте `GEMINI_API_KEY` в файл `.env`
2. Перезапустите сервер

---

## ❌ Проблема: Неверная модель

```
...
🤖 Получаем модель gemini-1.5-pro...
🚀 Отправляем запрос к Gemini через SDK...
❌ Ошибка Gemini API через SDK: {
  message: 'model gemini-1.5-pro not found',
  ...
}
⚠️ Возможно, проблема с именем модели. Пробуем gemini-1.5-pro...
🚀 Отправляем запрос к Gemini с моделью gemini-1.5-pro...
✅ Gemini API ответ получен с gemini-1.5-pro, длина: 8542 символов
```

**Решение:** Код автоматически исправляется. Если проблема сохраняется, проверьте API ключ.

---

## ❌ Проблема: SessionId не найден в БД

```
📥 POST /api/pdf/personal-plan from origin: https://idenself.com
🎯 [PDF-PERSONAL-PLAN] Начало обработки запроса
🎯 [PDF-PERSONAL-PLAN] SessionId: 1234567890
🔗 [PDF-PERSONAL-PLAN] Вызываем AI API: http://127.0.0.1:5000/api/ai/personal-plan

📥 POST /api/ai/personal-plan from origin: no-origin
🎯 [PERSONAL-PLAN] Начало обработки запроса
🎯 [PERSONAL-PLAN] SessionId: 1234567890
🔍 [PERSONAL-PLAN] Получаем данные из БД...
📊 [PERSONAL-PLAN] Результат запроса к БД: { hasData: false, hasError: true, errorMessage: 'No rows found' }
❌ [PERSONAL-PLAN] Результаты теста не найдены: { message: 'No rows found' }

❌ [PDF-PERSONAL-PLAN] Ошибка от AI API: Primary test results not found
```

**Решение:**
1. Проверьте, что пользователь прошел первичный тест
2. Проверьте правильность sessionId
3. Проверьте подключение к БД

---

## ❌ Проблема: Файл prompt.txt не найден

```
...
📝 [PERSONAL-PLAN] Читаем шаблон промпта...
📝 [PERSONAL-PLAN] Путь к промпту: /path/to/prompt.txt
❌ [PERSONAL-PLAN] Ошибка при чтении/обработке промпта: {
  message: 'ENOENT: no such file or directory',
  ...
}
❌ [PERSONAL-PLAN] Критическая ошибка: ...
```

**Решение:**
1. Убедитесь, что файл `korobka/prompt.txt` существует
2. Проверьте права доступа к файлу

---

## ❌ Проблема: Сетевые ошибки

```
...
🚀 Отправляем запрос к Gemini через SDK...
❌ Ошибка Gemini API через SDK: {
  message: 'ECONNREFUSED: connection refused',
  ...
}
🔄 Пробуем без прокси через SDK...
🚀 Отправляем fallback запрос к Gemini через SDK...
✅ Gemini API ответ получен без прокси через SDK, длина: 8542 символов
```

**Решение:** Код автоматически пробует без прокси.

Если не помогло:
1. Проверьте интернет-соединение
2. Проверьте, не заблокирован ли Google AI в вашем регионе
3. Попробуйте использовать VPN

---

## 💡 Полезные команды

### Смотреть только ошибки:
```bash
npm start 2>&1 | grep "❌"
```

### Смотреть только логи персонального плана:
```bash
npm start 2>&1 | grep "PERSONAL-PLAN"
```

### Смотреть весь процесс генерации:
```bash
npm start 2>&1 | grep -E "(PERSONAL-PLAN|Gemini)"
```

---

## 📞 Что отправить для помощи

Если проблема не решается, скопируйте и отправьте:

1. **Все логи с момента нажатия кнопки** (начиная с `POST /api/pdf/personal-plan`)
2. **Содержимое .env файла** (без конфиденциальных данных):
   ```
   GEMINI_API_KEY=AIza... (первые 10 символов)
   DISABLE_PROXY=...
   BACKEND_URL=...
   ```
3. **Версия Node.js**: `node --version`
4. **Операционная система**: Windows/Linux/Mac

Это поможет быстро найти и решить проблему!

