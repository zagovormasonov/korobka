# Bridge API — фрагмент `prompts.md` (синхрон с кодом в этом репозитории)

## Отдельный репозиторий Bridge (без idenself)

- У разработчиков Bridge **нет** монорепозитория idenself и файла `bridge/index.js` на диске idenself — ориентир по путям **`POST /api/...`** в **этом** проекте (`server/index.js`, `server/routes/*.js`).
- Полный эталонный текст промптов передаётся отдельным документом; здесь зафиксированы ключевые дельты, реализованные в коде.

---

## `POST /api/situation/generate-exercises-for-goal`

См. **`server/routes/situation.js`**.

- **`detailedHint`** — только на уровне объекта в `exercises[]` (теория навыка из `dbtContext`), не пересказ шагов.
- В **`steps[]`** поле `detailedHint` в ответе API убирается постобработкой **`normalizeExerciseDetailedHints`** (legacy: перенос с шага на упражнение).

---

## `POST /api/situation/generate-feedback`

Исполняемый промпт — в **`server/routes/situation.js`**. Сводка по обновлению контракта:

1. Пункт 1: начало с **наблюдения или инсайта**, не с вопроса.
2. Пункт 4: **никаких вопросов** в тексте (экран односторонний).
3. Форматы обратной связи: **только A–D** (инсайт, прогресс, точка роста, мост к жизни). Формат E «вопрос-провокация» **удалён**.
4. Температура: **0.7**, ответ: `{ "feedback": "..." }`.
5. Тело запроса в user message: `situationDescription`, `exerciseTitle`, `exerciseTherapyType`, `goalLabel`, `answers`, `steps`, при наличии `dataset`, `exerciseHistory`, `situationHistory` (с дефолтами как в коде).

---

## Прочие эндпоинты

- Опросник / specialist / diagnostic / plan / tools / prep / lumi / transcribe — **`server/routes/questionnaire-generation.js`**.
- Трекеры / reminder / CMS lumi — **`server/index.js`**.
- Медитация — роут в **`server/routes/situation.js`** (если подключён).

Полные тексты system/user промптов для всех путей — в переданном заказчиком **`prompts.md`** (целиком).
