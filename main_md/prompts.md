# Фрагмент промптов Bridge API (синхронизация с кодом)

Исполняемый промпт для `POST /api/situation/generate-exercises-for-goal` находится в **`server/routes/situation.js`**. Ниже — зафиксированные правила по полю **`detailedHint`** (как в idenself).

## `POST /api/situation/generate-exercises-for-goal` — правило `detailedHint`

- Поле **`detailedHint`** задаётся на уровне **объекта упражнения** в `exercises[]`, а не отдельным текстом «про каждый шаг».
- Содержание: описание **терапевтического навыка/техники из `dbtContext`** (механизм, нюансы, когда применять), на котором основано **всё** упражнение.
- **Нельзя** пересказывать инструкцию конкретного шага или дублировать `steps[].description`.
- В **`steps[]`** ключ **`detailedHint` не добавлять**. Если схема валидации требует поле на шаге — **та же строка**, что и `exercises[].detailedHint`, во все шаги (идентичный текст).
- Клиент idenself показывает «Подробнее о навыке» по **`exercise.detailedHint`**; fallback на шаг — только для **старых** данных.

### Постобработка на Bridge

После парсинга JSON вызывается **`normalizeExerciseDetailedHints`**: переносит текст с шагов на упражнение при legacy-ответе модели и **удаляет** `detailedHint` с объектов шагов в ответе API.

### Фрагмент ожидаемой структуры JSON (пример)

```json
{
  "exercises": [
    {
      "id": "ex-1710000001",
      "title": "…",
      "shortDescription": "…",
      "therapyType": "DBT",
      "estimatedMinutes": 3,
      "totalSteps": 2,
      "detailedHint": "Один текст на всё упражнение: механизм и нюансы базового навыка DBT из dbtContext (не пересказ шага).",
      "steps": [
        {
          "stepNumber": 1,
          "title": "…",
          "description": "…",
          "blocks": []
        }
      ]
    }
  ]
}
```
