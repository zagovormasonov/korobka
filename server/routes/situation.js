import express from 'express';

const router = express.Router();

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

function extractJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('extractJSON: input must be a non-empty string');
  }
  
  // Удаляем markdown code blocks
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  
  // Ищем первую открывающую скобку { или [
  let startIdx = -1;
  let braceType = null;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      startIdx = i;
      braceType = '{';
      break;
    } else if (cleaned[i] === '[') {
      startIdx = i;
      braceType = '[';
      break;
    }
  }
  
  if (startIdx === -1) {
    throw new Error('extractJSON: no JSON object or array found');
  }
  
  // Находим соответствующую закрывающую скобку с учётом вложенности и строк
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let endIdx = -1;
  
  for (let i = startIdx; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{' || char === '[') {
      depth++;
    } else if (char === '}' || char === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  
  if (endIdx === -1) {
    throw new Error('extractJSON: unmatched brackets, JSON is incomplete');
  }
  
  const jsonStr = cleaned.substring(startIdx, endIdx + 1);
  
  try {
    return JSON.parse(jsonStr);
  } catch (parseError) {
    throw new Error(`extractJSON: JSON parse failed: ${parseError.message}`);
  }
}

function postProcessExerciseBlocks(exercises) {
  let autoId = 0;
  for (const ex of exercises) {
    for (const step of ex.steps || []) {
      const blocks = step.blocks || [];
      const patched = [];
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const prev = patched[patched.length - 1];

        // Убираем ошибочный «Свой вариант» после text_input (должен быть только после выбора)
        if (block.type === 'text_input' && /вариант/i.test(block.label || '')) {
          if (!prev || (prev.type !== 'multi_choice' && prev.type !== 'single_choice')) {
            continue;
          }
        }

        patched.push(block);

        // Добавляем «Свой вариант» после multi_choice, если его нет
        if (block.type === 'multi_choice') {
          const next = blocks[i + 1];
          const hasCustom = next && next.type === 'text_input' && /вариант/i.test(next.label || '');
          if (!hasCustom) {
            autoId++;
            patched.push({
              id: `block-auto-${autoId}`,
              type: 'text_input',
              label: 'Свой вариант',
              placeholder: 'Напишите свой вариант, если нужного нет в списке',
            });
          }
        }
      }
      step.blocks = patched;
    }
  }
  return exercises;
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

=== КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ===

1. ПОНИМАНИЕ СИТУАЦИИ: прежде чем генерировать цели, выдели из описания:
   - ЧТО произошло (факт, событие)
   - КОГДА это произошло (уже случилось / происходит сейчас / может произойти)
   - ЧТО человек чувствует по этому поводу
   - ЧТО НЕЛЬЗЯ изменить (необратимые последствия)
   Это ОБЯЗАТЕЛЬНЫЙ первый шаг. Если событие уже произошло и его последствия
   НЕОБРАТИМЫ (смерть, разрыв, увольнение, потеря) — цели должны быть
   направлены на ПЕРЕЖИВАНИЕ ПОТЕРИ и ВЫВОДЫ, а НЕ на предотвращение
   того, что уже случилось. Никогда не предлагай «установить напоминание»,
   «наладить процесс» или «привязать к действию», если объект действия
   больше не существует.

2. Каждая цель ДОЛЖНА быть НАПРЯМУЮ связана с описанной ситуацией.
   НЕ генерируй абстрактные цели типа «улучшить качество жизни» или
   «развить эмоциональный интеллект», если ситуация про конкретный конфликт.

3. Цели должны быть:
   - конкретными и достижимыми
   - НАПРЯМУЮ релевантными описанной ситуации (не абстрактными)
   - учитывать текущее состояние ситуации (а не ключевые слова из описания)
   - учитывать контекст из диагностики и чек-инов пользователя (если есть)
   - сформулированы позитивно (чего достичь, а не чего избежать)

4. САМОПРОВЕРКА: для КАЖДОЙ цели спроси себя:
   a) «Это точно про текущую ситуацию пользователя, а не про абстрактную тему?»
   b) «Это физически возможно? Не предлагаю ли я действие с тем, чего уже нет?»
   c) «Если пользователь прочитает — скажет "да, это мне поможет", а не "ты вообще читал что я написал?"»
   Если хотя бы один ответ «нет» — замени цель.

Верни СТРОГО JSON:
{ "goals": [ { "id": "kebab-case-id", "label": "Текст цели на русском" } ] }`;

    const userMessage = JSON.stringify({ description, dataset });

    const raw = await callGemini(systemPrompt, userMessage, 0.4);
    const parsed = extractJSON(raw);
    const goals = Array.isArray(parsed.goals) ? parsed.goals : [];

    console.log('✅ [SITUATION] generate-goals success:', goals.length, 'goals');
    res.json({ goals });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [SITUATION] generate-goals failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ error: 'Failed to generate goals', details: errMsg });
  }
});

// ── POST /api/situation/generate-short-title ──
router.post('/generate-short-title', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    console.log('📥 [SITUATION] generate-short-title, descLen:', description.length);

    const systemPrompt = `Пользователь описал жизненную ситуацию. Сформулируй краткое название (до 50 символов).
Название должно точно отражать суть, быть нейтральным и без оценки.
НЕ используй кавычки, восклицательные знаки или многоточия.
Верни СТРОГО JSON: { "shortTitle": "..." }`;

    const userMessage = JSON.stringify({ description });

    const raw = await callGemini(systemPrompt, userMessage, 0.1);
    const parsed = extractJSON(raw);
    const shortTitle = parsed.shortTitle || '';

    console.log('✅ [SITUATION] generate-short-title success:', shortTitle);
    res.json({ shortTitle });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [SITUATION] generate-short-title failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ error: 'Failed to generate short title', details: errMsg });
  }
});

// ── POST /api/situation/parse-goals-text ──
router.post('/parse-goals-text', async (req, res) => {
  try {
    const { goalsText, description } = req.body;
    if (!goalsText) {
      return res.status(400).json({ error: 'goalsText is required' });
    }

    console.log('📥 [SITUATION] parse-goals-text, goalsTextLen:', goalsText.length);

    const systemPrompt = `Пользователь описал свои цели свободным текстом. Разбей текст на ОТДЕЛЬНЫЕ цели.

Правила:
1. Каждая ОТДЕЛЬНАЯ цель = отдельный элемент массива.
2. Если в тексте одна цель — верни массив из 1 элемента.
3. Если несколько целей (через "и", "а также", "ещё хочу", перечисление) — раздели.
4. Каждая цель в ответе должна быть чёткой, короткой (до 60 символов) и позитивной
   (чего достичь, а не чего избежать). Если пользователь уже написал кратко и ясно —
   оставь как есть. Если длинно, размыто или негативно — переформулируй.
5. id: формат "custom-<slug>" (латиница, kebab-case).
6. Учитывай описание ситуации для контекста — цели должны быть релевантны.

Верни СТРОГО JSON: { "goals": [{ "id": "...", "label": "..." }] }`;

    const userMessage = JSON.stringify({ goalsText, description });

    const raw = await callGemini(systemPrompt, userMessage, 0.1);
    const parsed = extractJSON(raw);
    const goals = Array.isArray(parsed.goals) ? parsed.goals : [];

    console.log('✅ [SITUATION] parse-goals-text success:', goals.length, 'goals');
    res.json({ goals });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [SITUATION] parse-goals-text failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ error: 'Failed to parse goals text', details: errMsg });
  }
});

// ── POST /api/situation/generate-exercises-for-goal ──
router.post('/generate-exercises-for-goal', async (req, res) => {
  try {
    const { description, goal, otherGoals, excludeExercises, dataset, dbtContext } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }
    if (!goal) {
      return res.status(400).json({ error: 'goal is required' });
    }

    console.log('📥 [SITUATION] generate-exercises-for-goal, goal:', goal.id, ', exclude:', excludeExercises?.length || 0, ', hasDbtContext:', !!dbtContext, ', dbtLen:', dbtContext?.length || 0);

    const systemPrompt = `Ты — эксперт-практик в доказательных терапиях. У тебя есть контекст из справочника
по DBT (навыки осознанности, межличностной эффективности, эмоциональной регуляции,
стрессоустойчивости) — он передан в поле dbtContext.

Пользователь описал ситуацию. Тебе передана ОДНА КОНКРЕТНАЯ цель.
Подбери для неё РОВНО 3 практических упражнения с РАЗНЫМ временем:
- короткое (~3 мин, 2-3 шага)
- среднее (~8 мин, 3-5 шагов)
- длинное (~20 мин, 5-15 шагов)

Поле otherGoals содержит остальные цели пользователя — НЕ генерируй для них упражнения,
но используй для контекста.

КРИТИЧНО: НЕ ДУБЛИРУЙ навыки и упражнения, которые могут быть сгенерированы для других целей.
Для КАЖДОЙ цели выбирай УНИКАЛЬНЫЕ навыки/техники из dbtContext. Если цель про «управление
гневом» и другая цель про «принятие ситуации» — НЕ используй «Радикальное принятие» для обеих.
Каждый ID упражнения должен содержать уникальный timestamp (13 цифр, все разные).

Если в запросе есть поле excludeExercises — это ЗАПРЕТНЫЙ СПИСОК. Ни одно из сгенерированных
упражнений НЕ ДОЛЖНО использовать те же навыки/техники, которые перечислены в этом списке.
Выбери ДРУГИЕ навыки из dbtContext.

=== КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ===

1. НЕ ВЫДУМЫВАЙ упражнения — бери ТОЛЬКО из предоставленного dbtContext.

2. ПОНИМАНИЕ СИТУАЦИИ: прежде чем генерировать упражнения, определи:
   - Что произошло? Когда? Необратимо ли это?
   - Что человек чувствует?
   - Что можно изменить, а что — нет?
   Упражнения должны соответствовать РЕАЛЬНОМУ положению дел.
   Если событие необратимо (смерть, потеря, разрыв) — используй навыки принятия,
   проживания горя, анализа цепочки, а НЕ навыки предотвращения или планирования
   действий с тем, чего больше нет.
   ЭТО ПРАВИЛО РАСПРОСТРАНЯЕТСЯ НА ВСЕ ЧАСТИ УПРАЖНЕНИЯ: заголовки, описания,
   вопросы, варианты ответов И ПЛЕЙСХОЛДЕРЫ. Даже в упражнении «Выводы для будущего»
   — если питомец умер, нельзя писать «поставлю напоминание покормить». Проверяй
   КАЖДЫЙ текст на соответствие реальности ситуации.

3. КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ: пользователь выполняет упражнения с телефона или компьютера,
   скорее всего находясь дома. Он НЕ может прямо сейчас:
   - пойти к людям, выйти на улицу, найти группу
   - применить навык в реальной ситуации с другим человеком
   - выполнить физическое действие, требующее оборудования

4. АДАПТАЦИЯ НАВЫКОВ: адаптируй упражнения как ПОДГОТОВКУ к применению навыка.
   Вместо прямого действия — рефлексия, анализ прошлого опыта, планирование будущего.

5. ОТ 3 ДО 7 БЛОКОВ НА КАЖДЫЙ ШАГ. Это критически важно: минимум 3 блока, максимум 7.
   Разные шаги должны иметь разное количество блоков (не везде одинаково).

6. ПЛЕЙСХОЛДЕРЫ: для КАЖДОГО блока text_input — конкретный пример ответа в placeholder.
   НЕ пиши "Введите ваш ответ" или "Опишите ситуацию". Пиши КОНКРЕТНЫЙ пример:
   "Например: Вчера на совещании коллега перебил меня, и я почувствовал злость и бессилие"
   ВАЖНО: плейсхолдеры ОБЯЗАНЫ учитывать контекст ситуации. Если ситуация про смерть
   питомца — плейсхолдер НЕ может содержать «покормить», «погулять», «позвонить ему».
   Перед записью плейсхолдера проверь: не противоречит ли пример фактам ситуации?

7. ПОЛЕ detailedHint: для КАЖДОГО шага добавь поле detailedHint — подробное объяснение
   навыка/техники из dbtContext (блок «Механизм и нюансы»). Это показывается пользователю
   по кнопке «Подробнее». Длина: 400-500 символов (это важно, не короче!).

8. Допустимые значения therapyType: "DBT"

9. ID упражнений: формат "ex-<timestamp>" (13 цифр), каждый уникальный.
   ID блоков: формат "block-<порядковый номер>" внутри упражнения (сквозная нумерация).

10. «СВОЙ ВАРИАНТ» — TEXT_INPUT ПОСЛЕ БЛОКОВ ВЫБОРА:
    - После КАЖДОГО блока multi_choice — ОБЯЗАТЕЛЬНО добавляй text_input с label "Свой вариант"
      и конкретным примером в placeholder.
    - После КАЖДОГО блока single_choice — добавляй text_input с label "Свой вариант",
      ЕСЛИ по контексту пользователь может захотеть написать свой ответ,
      которого нет в списке (адекватно по смыслу). Если выбор закрытый
      (например, "Да/Нет", "Уровень интенсивности 1-10"), text_input НЕ нужен.
    Текстовое поле (text_input) — это AudioTextarea с микрофоном Whisper.
    Пользователь может как набрать текст, так и надиктовать голосом.

11. shortDescription упражнений: НЕ ставь точку в конце.

12. SINGLE_CHOICE vs MULTI_CHOICE — правило выбора типа:
    Используй single_choice ТОЛЬКО когда варианты ВЗАИМОИСКЛЮЧАЮЩИЕ (можно выбрать
    строго один): «Какой уровень интенсивности?», «Что вы выберете?», «Какой формат?».
    Используй multi_choice когда пользователь может отметить НЕСКОЛЬКО вариантов
    одновременно: части тела, эмоции, симптомы, причины, способы, ресурсы, люди.
    Правило-подсказка: если в жизни ответом может быть «и то, и то» — это multi_choice.

=== ТИПЫ БЛОКОВ ===

- text_input: { label, placeholder } — текстовое поле. ОБЯЗАТЕЛЬНО с конкретным примером в placeholder
- single_choice: { label, options[] } — ОДИН вариант из ВЗАИМОИСКЛЮЧАЮЩИХ
- multi_choice: { label, options[] } — несколько вариантов (тело, эмоции, симптомы и т.д.)
- likert_scale: { label, points[] } — шкала (обычно 5 или 7 пунктов с подписями)
- slider: { label, min, max, step, unit } — ползунок с единицами
- number_input: { label, unit } — числовой ввод
- yes_no: { label } — да/нет
- ranking: { label, items[] } — ранжирование (drag-and-drop)

=== ПРИМЕРЫ АДАПТИРОВАННЫХ УПРАЖНЕНИЙ ===

ПРИМЕР 1: Навык «Построение отношений» (адаптирован для дома)
НЕ: «Найдите открытую группу и присоединитесь»
ДА: Рефлексия + планирование:
  Шаг 1: «Анализ прошлого опыта»
    - text_input: «Вспомните последний раз, когда вы оказались в закрытой группе (где все уже знакомы). Что вы чувствовали?»
      placeholder: «Например: На корпоративе нового отдела все уже общались между собой, я стоял в стороне и чувствовал себя лишним»
    - likert_scale: «Насколько комфортно вы себя чувствовали?»
      points: ["1 — Очень некомфортно", "2", "3 — Нейтрально", "4", "5 — Вполне комфортно"]
  Шаг 2: «Открытые группы»
    - text_input: «Вспомните ситуацию, когда вы попали в открытую группу (курсы, клуб, волонтёрство). Было ли проще?»
      placeholder: «Например: На языковых курсах каждую неделю приходили новые люди, и я легко начал общаться с соседкой по парте»
    - single_choice: «Что помогло больше всего?»
      options: ["Общая цель/интерес", "Кто-то заговорил первым", "Формат подразумевал общение", "Маленькая группа", "Другое"]
    - text_input: «Свой вариант» (label: "Свой вариант")
      placeholder: «Например: Меня представил знакомый, который уже был в этой группе»
  Шаг 3: «Планирование»
    - text_input: «Где в ближайшие 2 недели вы можете найти открытую группу?»
      placeholder: «Например: Запишусь на пробное занятие по йоге в студии рядом с домом — там всегда приходят новички»
    - text_input: «Как вы себя представите? Какой первый вопрос зададите?»
      placeholder: «Например: Скажу "Привет, я тут впервые — вы давно занимаетесь?" и улыбнусь»

ПРИМЕР 2: Навык «ПОПРОСИ» (адаптирован для дома)
НЕ: «Попросите коллегу прямо сейчас»
ДА: Подготовка к разговору:
  Шаг 1: «Факты ситуации»
    - text_input: «Опишите ситуацию фактами, без интерпретаций»
      placeholder: «Например: Коллега трижды за неделю назначал встречи на моё обеденное время, не предупреждая заранее»
    - text_input: «Какие чувства это вызывает? Используйте Я-высказывание»
      placeholder: «Например: Я чувствую раздражение и неуважение к моему времени, когда мой обед отменяется без предупреждения»
  Шаг 2: «Формулировка просьбы»
    - text_input: «Сформулируйте чёткую просьбу (П — Попросите)»
      placeholder: «Например: Я хотел бы, чтобы ты проверял мой календарь перед назначением встречи на 13:00»
    - text_input: «Почему это будет хорошо для вас обоих? (Р — Расскажите)»
      placeholder: «Например: Так я буду работать продуктивнее после обеда, а встречи будут эффективнее»
    - likert_scale: «Насколько уверенно вы сможете это произнести?»
      points: ["1 — Совсем неуверенно", "2", "3 — Средне", "4", "5 — Полностью уверенно"]
  Шаг 3: «Репетиция»
    - text_input: «Запишите полную реплику, которую скажете (все шаги ПОПРОСИ)»
      placeholder: «Например: На этой неделе встречи трижды совпали с моим обедом. Мне сложно концентрироваться голодным. Прошу проверять мой календарь. Это поможет нам обоим.»
    - single_choice: «Какой уровень интенсивности уместен?»
      options: ["1-3: мягкая просьба", "4-6: уверенная просьба", "7-9: настойчивое требование", "10: жёсткая позиция"]

ПРИМЕР 3: Навык «Противоположное действие» (адаптирован для дома)
  Шаг 1: «Определение эмоции»
    - single_choice: «Какая эмоция сейчас доминирует?»
      options: ["Страх", "Злость", "Печаль", "Стыд", "Зависть", "Вина"]
    - text_input: «Свой вариант» (label: "Свой вариант")
      placeholder: «Например: Смесь тревоги и разочарования — не могу выделить одну эмоцию»
    - text_input: «Что вызвало эту эмоцию?»
      placeholder: «Например: Получил критику от начальника по email, и хочу закрыться в комнате и никого не видеть»
  Шаг 2: «Проверка фактов»
    - text_input: «Соответствует ли эмоция фактам? Проверьте интерпретацию»
      placeholder: «Например: Факт — начальник указал на 2 конкретные ошибки. Моя интерпретация — "он считает меня некомпетентным" — это чтение мыслей»
    - yes_no: «Действие по импульсу будет эффективным?»
  Шаг 3: «Противоположное действие»
    - text_input: «Что было бы противоположным действием?»
      placeholder: «Например: Вместо изоляции — написать коллеге и предложить обсудить проект, выйти на кухню сделать чай»
    - text_input: «Как вы измените позу и выражение лица? (полное противоположное действие)»
      placeholder: «Например: Выпрямлю спину, расправлю плечи, сделаю нейтральное/лёгкое выражение лица вместо нахмуренного»
    - likert_scale: «Насколько готовы попробовать прямо сейчас?»
      points: ["1 — Совсем не готов", "2", "3 — Готов попробовать", "4", "5 — Готов полностью"]

ПРИМЕР 4: Навык «Мудрый разум» (адаптирован для дома)
  Шаг 1: «Рациональный разум»
    - text_input: «Что говорит ваш рациональный разум о ситуации?»
      placeholder: «Например: Логически я понимаю, что один конфликт не означает конец отношений. Статистически у всех бывают ссоры»
    - multi_choice: «Как проявляется рациональный разум?»
      options: ["Анализирую факты", "Ищу логическое объяснение", "Отключаюсь от эмоций", "Планирую по шагам"]
    - text_input: «Свой вариант» (label: "Свой вариант")
      placeholder: «Например: Составляю списки за и против, перечитываю переписку в поисках фактов»
  Шаг 2: «Эмоциональный разум»
    - text_input: «Что говорит ваш эмоциональный разум?»
      placeholder: «Например: Мне больно и страшно. Хочется позвонить и всё выяснить прямо сейчас, даже если это 3 ночи»
    - multi_choice: «Как проявляется эмоциональный разум?»
      options: ["Импульсивные решения", "Сильные телесные ощущения", "Желание немедленно действовать", "Мысли только об одном"]
    - text_input: «Свой вариант» (label: "Свой вариант")
      placeholder: «Например: Не могу перестать плакать, хочу кому-нибудь всё рассказать прямо сейчас»
  Шаг 3: «Мудрый разум — синтез»
    - text_input: «Задайте вопрос из мудрого разума: "Что я знаю в глубине души?"»
      placeholder: «Например: В глубине души я знаю, что мне нужно дождаться утра и поговорить спокойно. Сейчас я слишком расстроен для конструктивного разговора»
    - likert_scale: «Насколько вы ощущаете мудрый разум прямо сейчас?»
      points: ["1 — Не чувствую", "2", "3 — Слабо ощущаю", "4", "5 — Ясно чувствую"]

ПРИМЕР 5: Навык «ТРУД» (адаптирован для дома)
  Шаг 1: «Оценка возбуждения»
    - likert_scale: «Насколько высоко ваше эмоциональное возбуждение?»
      points: ["1 — Спокоен", "2", "3 — Среднее", "4", "5 — Очень высокое"]
    - multi_choice: «Что вы ощущаете в теле?»
      options: ["Учащённое сердцебиение", "Напряжение в мышцах", "Ком в горле", "Тяжесть в груди", "Жар/холод", "Дрожь", "Тошнота"]
    - text_input: «Свой вариант» (label: "Свой вариант")
      placeholder: «Например: Покалывание в пальцах, сухость во рту, не могу сидеть на месте»
  Шаг 2: «Применение техник (выберите доступное)»
    - single_choice: «Какую технику вы можете применить прямо сейчас?»
      options: ["Холодная вода на лицо (Т — Температура)", "Интенсивные упражнения: приседания, бег на месте (Р)", "Медленное дыхание 4-4-6 (У — Управляемое дыхание)", "Расслабление мышц (Д — Диафрагмальное)"]
    - text_input: «Свой вариант» (label: "Свой вариант")
      placeholder: «Например: Выпил стакан ледяной воды мелкими глотками, пока считал вдохи»
    - text_input: «Опишите, что вы сделали»
      placeholder: «Например: Набрал миску холодной воды, задержал дыхание и опустил лицо на 30 секунд. Сразу почувствовал замедление пульса»
  Шаг 3: «Оценка результата»
    - likert_scale: «Насколько снизилось возбуждение?»
      points: ["1 — Не снизилось", "2", "3 — Немного", "4", "5 — Значительно"]
    - text_input: «Какой навык вы примените следующим, пока возбуждение низкое?»
      placeholder: «Например: Теперь я могу подумать спокойнее — сделаю проверку фактов по ситуации с начальником»

ПРИМЕР 6: Навык «Радикальное принятие» (адаптирован для дома)
  Шаг 1: «Что вы не принимаете»
    - text_input: «Опишите факт или ситуацию, которую вы не можете принять»
      placeholder: «Например: Мой друг детства переехал в другой город и перестал выходить на связь. Наша дружба, похоже, закончилась»
    - multi_choice: «Какие признаки непринятия вы замечаете?»
      options: ["Мысли «этого не должно быть»", "Гнев на прошлое", "Горечь и обида", "Отрицание произошедшего", "Попытки «откатить» ситуацию"]
    - text_input: «Свой вариант» (label: "Свой вариант")
      placeholder: «Например: Постоянно прокручиваю в голове, как могло бы быть иначе»
  Шаг 2: «Проверка: можно ли изменить?»
    - yes_no: «Можете ли вы изменить эту ситуацию?»
    - text_input: «Если нет — что происходит, когда вы боретесь с этим фактом?»
      placeholder: «Например: Я постоянно проверяю его соцсети, злюсь, пишу и удаляю сообщения. Это забирает энергию и не меняет ситуацию»
  Шаг 3: «Шаг к принятию»
    - text_input: «Скажите себе: "Это именно то, что происходит." Что вы чувствуете?»
      placeholder: «Например: Грусть, но также облегчение — как будто перестал толкать стену. Боль есть, но борьба уменьшилась»
    - text_input: «Что вы можете изменить, приняв этот факт?»
      placeholder: «Например: Могу вложить энергию в текущие дружбы. Написать коллеге, с которой давно хотел пообщаться ближе»
    - likert_scale: «Насколько вы готовы практиковать принятие?»
      points: ["1 — Не готов", "2", "3 — Готов попробовать", "4", "5 — Полностью готов"]

=== ФОРМАТ ОТВЕТА ===

Верни СТРОГО JSON:
{
  "exercises": [
    {
      "id": "ex-<13 цифр timestamp>",
      "title": "название упражнения",
      "shortDescription": "краткое описание (до 120 символов, БЕЗ точки в конце)",
      "therapyType": "DBT",
      "estimatedMinutes": 3,
      "totalSteps": 2,
      "steps": [
        {
          "stepNumber": 1,
          "title": "название шага",
          "description": "описание шага",
          "detailedHint": "подробное объяснение навыка/техники (400-500 символов, из dbtContext)",
          "blocks": [ { "id": "block-1", "type": "...", ... } ]
        }
      ]
    },
    { "estimatedMinutes": 8, "...": "..." },
    { "estimatedMinutes": 20, "...": "..." }
  ]
}`;

    const userMessage = JSON.stringify({ description, goal, otherGoals, excludeExercises, dataset })
      + (dbtContext ? '\n\n--- DBT CONTEXT ---\n' + dbtContext : '');

    console.log('📝 [SITUATION] generate-exercises-for-goal userMessage len:', userMessage.length);

    const raw = await callGemini(systemPrompt, userMessage, 0.4);
    const parsed = extractJSON(raw);
    const exercises = postProcessExerciseBlocks(
      Array.isArray(parsed.exercises) ? parsed.exercises : []
    );

    console.log('✅ [SITUATION] generate-exercises-for-goal success, exercises:', exercises.length);
    res.json({ exercises });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [SITUATION] generate-exercises-for-goal failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ error: 'Failed to generate exercises', details: errMsg });
  }
});

// ── POST /api/situation/generate-feedback ──
router.post('/generate-feedback', async (req, res) => {
  try {
    const { situationDescription, exerciseTitle, exerciseTherapyType, goalLabel, answers, steps, dataset, exerciseHistory, situationHistory } = req.body;
    if (!situationDescription) {
      return res.status(400).json({ error: 'situationDescription is required' });
    }

    console.log('📥 [SITUATION] generate-feedback, exercise:', exerciseTitle, ', goal:', goalLabel, ', exerciseHistory:', exerciseHistory?.length ?? 0);

    const systemPrompt = `Ты — Луми, заботливый AI-психолог. Пользователь только что завершил
терапевтическое упражнение в рамках работы с конкретной ситуацией.

=== КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ===

1. НЕ ЗДОРОВАЙСЯ. Не начинай с "Здравствуйте", "Привет", "Рад(а) видеть" и т.д.
   Начинай сразу с сути — наблюдения, инсайта или вопроса.

2. НЕ ПОВТОРЯЙ предыдущую обратную связь (см. exerciseHistory[].feedback).
   Каждый фидбек должен быть уникальным по структуре и содержанию.

3. УЧИТЫВАЙ контекст: exerciseHistory показывает, какие упражнения пользователь
   уже выполнил и какую обратную связь получил. Стройся на этом прогрессе.

На основе:
- описания ситуации и цели
- ответов пользователя на шаги упражнения
- долгосрочного датасета пользователя
- истории выполненных упражнений и предыдущих фидбеков

Напиши обратную связь (до 900 символов), используя ОДИН из 5 форматов:

A) «ИНСАЙТ» — начни с неочевидного наблюдения из ответов пользователя.
   «В вашем ответе о [X] есть интересный момент: [инсайт]. Это говорит о том, что...»

B) «ПРОГРЕСС» — покажи, как текущее упражнение связано с предыдущими.
   «Если сравнить с [предыдущим упражнением], видно, что вы стали [конкретное изменение]...»

C) «ТОЧКА РОСТА» — найди конкретную зону развития в ответах (без критики).
   «Обратите внимание на момент, где вы написали [цитата] — здесь скрыта возможность...»

D) «МОСТ К ЖИЗНИ» — свяжи упражнение с конкретной ситуацией из реальной жизни.
   «В ситуации [X] этот навык пригодится так: [конкретный сценарий]...»

E) «ВОПРОС-ПРОВОКАЦИЯ» — задай вопрос, который заставит задуматься.
   «[Наблюдение из ответов]. А если бы [гипотетическая ситуация] — как бы вы поступили?»

Чередуй форматы между упражнениями (не используй один и тот же подряд).

Тон: тёплый, профессиональный, без менторства. Обращение на «вы».

Верни СТРОГО JSON:
{ "feedback": "текст обратной связи" }`;

    const userMessage = JSON.stringify({ situationDescription, exerciseTitle, exerciseTherapyType, goalLabel, answers, steps, dataset, exerciseHistory, situationHistory });

    const raw = await callGemini(systemPrompt, userMessage, 0.7);
    const parsed = extractJSON(raw);
    const feedback = parsed.feedback || '';

    console.log('✅ [SITUATION] generate-feedback success, len:', feedback.length);
    res.json({ feedback });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [SITUATION] generate-feedback failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ error: 'Failed to generate feedback', details: errMsg });
  }
});

export default router;
