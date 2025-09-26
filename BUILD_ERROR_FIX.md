# Исправление ошибки сборки: terser not found

## 🔍 Проблема
```
error during build:
Error: terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.
```

## ✅ Решение реализовано

### Вариант 1: Добавлена зависимость terser
- Добавлен `terser` в devDependencies в `package.json`
- Теперь минификация будет работать с terser (лучше сжимает код)

### Вариант 2: Альтернативная конфигурация (рекомендуется для Render)
- Создан файл `vite.config.render.ts` с использованием esbuild вместо terser
- esbuild быстрее и не требует дополнительных зависимостей
- Добавлена команда `npm run build:render`

### Обновлены конфигурации Render:
- `render.yaml`: использует `npm run build:render`
- `render-fast.yaml`: использует `npm run build:render`

## 🚀 Применение исправления

### Автоматическое исправление:
Все изменения уже внесены в код. При следующем деплое на Render ошибка исчезнет.

### Ручное исправление (если нужно):
В настройках Render измените Build Command на:
```bash
npm ci && npm run build:render
```

## 📋 Что изменилось:

1. **package.json**: 
   - Добавлена зависимость `terser`
   - Добавлена команда `build:render`

2. **vite.config.render.ts**: 
   - Новая конфигурация с esbuild
   - Оптимизация для production

3. **render.yaml** и **render-fast.yaml**:
   - Обновлена команда сборки

## ⚡ Преимущества нового подхода:
- Быстрее сборка (esbuild)
- Меньше зависимостей
- Более стабильная работа на Render
- Разделение vendor и app кода для лучшего кэширования
