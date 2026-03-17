import express from 'express';

const router = express.Router();

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

function parseJsonFromAI(raw) {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  if (firstBracket >= 0 && (firstBrace < 0 || firstBracket < firstBrace)) {
    start = firstBracket;
  } else if (firstBrace >= 0) {
    start = firstBrace;
  }
  if (start > 0) cleaned = cleaned.slice(start);
  return JSON.parse(cleaned);
}

async function callGemini(systemPrompt, userMessage, temperature = 0.5) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY не установлен');

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: systemPrompt + '\n\n' + userMessage }] }],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  };

  console.log(`🤖 [SITUATION] model=${GEMINI_MODEL}, temp=${temperature}, promptLen=${(systemPrompt + userMessage).length}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [SITUATION] Gemini API error ${response.status}:`, errorText.slice(0, 500));
    throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini вернул пустой ответ');
  return text;
}

// ── POST /api/situation/generate-goals ──
router.post('/generate-goals', async (req, res) => {
  try {
    const { description, dataset } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    console.log('📥 [SITUATION] generate-goals, descLen:', description.length, ', hasDataset:', !!dataset);

    const systemPrompt = `Ты — эксперт в доказательных терапиях (DBT, ACT, КПТ, CFT, Схема-терапия).
Пользователь описал жизненную ситуацию. На основе описания и его долгосрочного датасета
сформулируй 5-8 целей, над которыми можно работать в этой ситуации.

Цели должны быть:
- конкретными и достижимыми
- релевантными описанной ситуации
- учитывать контекст из диагностики и чек-инов пользователя (если есть)
- сформулированы позитивно (чего достичь, а не чего избежать)

Верни СТРОГО JSON:
{ "goals": [ { "id": "kebab-case-id", "label": "Текст цели на русском" } ] }`;

    const userMessage = JSON.stringify({ description, dataset });

    const raw = await callGemini(systemPrompt, userMessage, 0.5);
    const parsed = parseJsonFromAI(raw);
    const goals = Array.isArray(parsed.goals) ? parsed.goals : [];

    console.log('✅ [SITUATION] generate-goals success:', goals.length, 'goals');
    res.json({ goals });
  } catch (error) {
    console.error('❌ [SITUATION] generate-goals failed:', error.message);
    res.status(500).json({ error: 'Failed to generate goals', details: error.message });
  }
});

// ── POST /api/situation/generate-exercises ──
router.post('/generate-exercises', async (req, res) => {
  try {
    const { description, goals, goalsText, dataset, dbtContext } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ error: 'goals array is required' });
    }

    console.log('📥 [SITUATION] generate-exercises, goals:', goals.length, ', hasDbtContext:', !!dbtContext, ', dbtLen:', dbtContext?.length || 0);

    const systemPrompt = `Ты — эксперт-практик в доказательных терапиях. У тебя есть контекст из справочника
по DBT (навыки осознанности, межличностной эффективности, эмоциональной регуляции,
стрессоустойчивости) — он передан в поле dbtContext.

Пользователь описал ситуацию и выбрал цели. Подбери для каждой цели РОВНО 3 практических
упражнения из предоставленного контекста с РАЗНЫМ временем на выполнение:
- короткое (~3 мин, 2-3 шага)
- среднее (~8 мин, 3-5 шагов)
- длинное (~20 мин, 5-15 шагов)

=== КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ===

1. НЕ ВЫДУМЫВАЙ упражнения — бери ТОЛЬКО из предоставленного dbtContext.

2. КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ: пользователь выполняет упражнения с телефона или компьютера,
   скорее всего находясь дома. Он НЕ может прямо сейчас:
   - пойти к людям, выйти на улицу, найти группу
   - применить навык в реальной ситуации с другим человеком
   - выполнить физическое действие, требующее оборудования

3. АДАПТАЦИЯ НАВЫКОВ: адаптируй упражнения как ПОДГОТОВКУ к применению навыка.
   Вместо прямого действия — рефлексия, анализ прошлого опыта, планирование будущего.

4. МИНИМУМ 2 БЛОКА НА КАЖДЫЙ ШАГ. Нет ограничений сверху — может быть 5-6 блоков на шаг.

5. ПЛЕЙСХОЛДЕРЫ: для КАЖДОГО блока text_input — конкретный пример ответа в placeholder.
   НЕ пиши "Введите ваш ответ" или "Опишите ситуацию". Пиши КОНКРЕТНЫЙ пример:
   "Например: Вчера на совещании коллега перебил меня, и я почувствовал злость и бессилие"

6. ПОЛЕ detailedHint: для КАЖДОГО шага добавь поле detailedHint — подробное объяснение
   навыка/техники из dbtContext (блок «Механизм и нюансы»). Это показывается пользователю
   по кнопке «Подробнее». Длина: 2-5 предложений.

7. Допустимые значения therapyType: "DBT"

8. ID упражнений: формат "ex-<timestamp>" (13 цифр), каждый уникальный.
   ID блоков: формат "block-<порядковый номер>" внутри упражнения (сквозная нумерация).

=== ТИПЫ БЛОКОВ ===

- text_input: { label, placeholder } — текстовое поле. ОБЯЗАТЕЛЬНО с конкретным примером в placeholder
- single_choice: { label, options[] } — один вариант из списка
- multi_choice: { label, options[] } — несколько вариантов
- likert_scale: { label, points[] } — шкала (обычно 5 или 7 пунктов с подписями)
- slider: { label, min, max, step, unit } — ползунок с единицами
- number_input: { label, unit } — числовой ввод
- yes_no: { label } — да/нет
- ranking: { label, items[] } — ранжирование (drag-and-drop)

=== ФОРМАТ ОТВЕТА ===

Верни СТРОГО JSON по структуре:
{
  "shortTitle": "краткое название ситуации (до 50 символов)",
  "goalGroups": [
    {
      "goalId": "id цели",
      "goalLabel": "текст цели",
      "isCustom": false,
      "exercises": [
        {
          "id": "ex-<13 цифр timestamp>",
          "title": "название упражнения",
          "shortDescription": "краткое описание (до 120 символов)",
          "therapyType": "DBT",
          "estimatedMinutes": 3,
          "totalSteps": 2,
          "steps": [
            {
              "stepNumber": 1,
              "title": "название шага",
              "description": "описание шага",
              "detailedHint": "подробное объяснение навыка/техники (2-5 предложений из dbtContext)",
              "blocks": [ { "id": "block-1", "type": "...", ... } ]
            }
          ]
        },
        { "estimatedMinutes": 8, "...": "..." },
        { "estimatedMinutes": 20, "...": "..." }
      ]
    }
  ]
}`;

    const userMessage = JSON.stringify({ description, goals, goalsText, dataset })
      + (dbtContext ? '\n\n--- DBT CONTEXT ---\n' + dbtContext : '');

    console.log('📝 [SITUATION] generate-exercises userMessage len:', userMessage.length);

    const raw = await callGemini(systemPrompt, userMessage, 0.5);
    const parsed = parseJsonFromAI(raw);

    console.log('✅ [SITUATION] generate-exercises success, goalGroups:', parsed.goalGroups?.length ?? 0);
    res.json({ shortTitle: parsed.shortTitle || '', goalGroups: parsed.goalGroups || [] });
  } catch (error) {
    console.error('❌ [SITUATION] generate-exercises failed:', error.message);
    res.status(500).json({ error: 'Failed to generate exercises', details: error.message });
  }
});

// ── POST /api/situation/generate-feedback ──
router.post('/generate-feedback', async (req, res) => {
  try {
    const { situationDescription, exerciseTitle, exerciseTherapyType, goalLabel, answers, steps, dataset } = req.body;
    if (!situationDescription) {
      return res.status(400).json({ error: 'situationDescription is required' });
    }

    console.log('📥 [SITUATION] generate-feedback, exercise:', exerciseTitle, ', goal:', goalLabel);

    const systemPrompt = `Ты — Луми, заботливый AI-психолог. Пользователь только что завершил
терапевтическое упражнение в рамках работы с конкретной ситуацией.

На основе:
- описания ситуации
- цели, для которой было упражнение
- названия и типа упражнения
- ответов пользователя на шаги упражнения
- долгосрочного датасета пользователя

Напиши обратную связь (до 900 символов):
1. Отметь конкретные сильные стороны в ответах пользователя (цитируй)
2. Свяжи выполненное упражнение с его ситуацией и целью
3. Дай 1 практический совет по закреплению результата в повседневной жизни
4. Если это уместно — предложи, какое упражнение выполнить следующим

Тон: тёплый, профессиональный, без менторства. Обращение на «вы».
Не повторяй формулировки из предыдущих фидбеков (см. dataset.feedbacks).

Верни СТРОГО JSON:
{ "feedback": "текст обратной связи" }`;

    const userMessage = JSON.stringify({ situationDescription, exerciseTitle, exerciseTherapyType, goalLabel, answers, steps, dataset });

    const raw = await callGemini(systemPrompt, userMessage, 0.6);
    const parsed = parseJsonFromAI(raw);
    const feedback = parsed.feedback || '';

    console.log('✅ [SITUATION] generate-feedback success, len:', feedback.length);
    res.json({ feedback });
  } catch (error) {
    console.error('❌ [SITUATION] generate-feedback failed:', error.message);
    res.status(500).json({ error: 'Failed to generate feedback', details: error.message });
  }
});

export default router;
