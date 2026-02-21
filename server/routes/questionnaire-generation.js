import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * Парсинг JSON из ответа OpenAI (может вернуть JSON в markdown-блоке)
 */
function parseJSONFromResponse(text) {
  let cleaned = text;
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  }

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  if (firstBracket >= 0 && (firstBrace < 0 || firstBracket < firstBrace)) {
    cleaned = cleaned.substring(firstBracket);
  } else if (firstBrace >= 0) {
    cleaned = cleaned.substring(firstBrace);
  }

  return JSON.parse(cleaned);
}

/**
 * Вызов OpenAI Chat Completions API
 */
async function callOpenAI(systemPrompt, userMessage, temperature = 0.5) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY не установлен в переменных окружения');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  console.log('🚀 [QUESTIONNAIRE] Отправляем запрос к OpenAI API...');
  console.log('📋 [QUESTIONNAIRE] Model:', model);
  const startTime = Date.now();

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [QUESTIONNAIRE] Время ответа OpenAI API: ${(elapsed / 1000).toFixed(2)}с`);

    const content = response.data.choices[0].message.content;
    console.log(`✅ [QUESTIONNAIRE] Ответ получен, длина: ${content.length} символов`);
    return content;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [QUESTIONNAIRE] OpenAI API ошибка через ${(elapsed / 1000).toFixed(2)}с`);
    if (err.response) {
      console.error('❌ [QUESTIONNAIRE] Статус:', err.response.status);
      console.error('❌ [QUESTIONNAIRE] Тело ответа:', JSON.stringify(err.response.data, null, 2));
      const message = err.response.data?.error?.message || JSON.stringify(err.response.data);
      throw new Error(`OpenAI API error (${err.response.status}): ${message}`);
    }
    throw err;
  }
}

/**
 * Формирует строку с контекстом пользователя из тела запроса
 */
function buildUserContext(body) {
  const formatValue = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object') {
      return Object.entries(val).map(([k, v]) => `Вопрос ${k}: ${v}`).join('\n');
    }
    return String(val);
  };

  const parts = [];

  const symptoms = body.selectedSymptoms || body.symptoms;
  if (symptoms) {
    parts.push(`Выбранные симптомы: ${formatValue(symptoms)}`);
  } else {
    parts.push(`Выбранные симптомы: не указаны`);
  }

  if (body.generalDescription) {
    parts.push(`Жалоба пациента: ${formatValue(body.generalDescription)}`);
  }

  if (body.answersFinalFormal && Object.keys(body.answersFinalFormal).length > 0) {
    parts.push(`Ответы на формальные вопросы:\n${formatValue(body.answersFinalFormal)}`);
  }

  if (body.answersMiniTest && Object.keys(body.answersMiniTest).length > 0) {
    parts.push(`Ответы на мини-тест:\n${formatValue(body.answersMiniTest)}`);
  }

  if (body.answersPart1 && Object.keys(body.answersPart1).length > 0) {
    parts.push(`Ответы на уточняющие вопросы (часть 1):\n${formatValue(body.answersPart1)}`);
  }

  if (body.answersPart2 && Object.keys(body.answersPart2).length > 0) {
    parts.push(`Ответы на уточняющие вопросы (часть 2):\n${formatValue(body.answersPart2)}`);
  }

  if (body.answersPart3 && Object.keys(body.answersPart3).length > 0) {
    parts.push(`Ответы на уточняющие вопросы (часть 3):\n${formatValue(body.answersPart3)}`);
  }

  return parts.join('\n\n');
}

/**
 * POST /api/generate-part1
 */
router.post('/generate-part1', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию первой части опросника');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const systemPrompt = `Ты — профессиональный клинический психолог. На основе данных пациента сгенерируй 4-6 уточняющих вопросов.
Каждый вопрос должен быть направлен на понимание глубины проблемы.
Верни ТОЛЬКО JSON-массив объектов формата:
[
  { "id": "q1", "text": "Текст вопроса?", "type": "text", "options": ["Пример ответа 1", "Пример ответа 2", "Пример ответа 3", "Пример ответа 4"] }
]
type всегда "text". В options — 4 примера ответов, которые помогут пользователю сориентироваться.`;

    const userMessage = buildUserContext(req.body);

    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    console.log('📥 [QUESTIONNAIRE] Ответ от OpenAI (Part 1):', content.substring(0, 500));

    const questions = parseJSONFromResponse(content);

    console.log('✅ [QUESTIONNAIRE] Сгенерировано вопросов (Part 1):', Array.isArray(questions) ? questions.length : 0);

    res.json({
      success: true,
      questions: Array.isArray(questions) ? questions : (questions.questions || [])
    });

  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка генерации первой части:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка генерации опросника',
      questions: []
    });
  }
});

/**
 * POST /api/generate-part2
 */
router.post('/generate-part2', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию второй части опросника');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const systemPrompt = `Ты — профессиональный клинический психолог. На основе всех собранных данных пациента сгенерируй 3-5 финальных уточняющих вопросов. Это последний этап сбора информации перед формированием результатов.
Верни ТОЛЬКО JSON-массив объектов формата:
[
  { "id": "q1", "text": "Текст вопроса?", "type": "text", "options": ["Пример ответа 1", "Пример ответа 2", "Пример ответа 3", "Пример ответа 4"] }
]
type всегда "text". В options — 4 примера ответов.`;

    const userMessage = buildUserContext(req.body);

    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    console.log('📥 [QUESTIONNAIRE] Ответ от OpenAI (Part 2):', content.substring(0, 500));

    const questions = parseJSONFromResponse(content);

    console.log('✅ [QUESTIONNAIRE] Сгенерировано вопросов (Part 2):', Array.isArray(questions) ? questions.length : 0);

    res.json({
      success: true,
      questions: Array.isArray(questions) ? questions : (questions.questions || [])
    });

  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка генерации второй части:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка генерации опросника',
      questions: []
    });
  }
});

/**
 * POST /api/generate-part3
 */
router.post('/generate-part3', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию третьей части опросника');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const systemPrompt = `Ты — профессиональный клинический психолог. На основе всех собранных данных пациента сгенерируй 3-5 дополнительных уточняющих вопросов для более глубокой диагностики.
Верни ТОЛЬКО JSON-массив объектов формата:
[
  { "id": "q1", "text": "Текст вопроса?", "type": "text", "options": ["Пример ответа 1", "Пример ответа 2", "Пример ответа 3", "Пример ответа 4"] }
]
type всегда "text". В options — 4 примера ответов.`;

    const userMessage = buildUserContext(req.body);

    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    console.log('📥 [QUESTIONNAIRE] Ответ от OpenAI (Part 3):', content.substring(0, 500));

    const questions = parseJSONFromResponse(content);

    console.log('✅ [QUESTIONNAIRE] Сгенерировано вопросов (Part 3):', Array.isArray(questions) ? questions.length : 0);

    res.json({
      success: true,
      questions: Array.isArray(questions) ? questions : (questions.questions || [])
    });

  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка генерации третьей части:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка генерации опросника',
      questions: []
    });
  }
});

/**
 * POST /api/generate-results
 */
router.post('/generate-results', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию финальных результатов');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const { symptoms = [], generalDescription = '', answersPart1 = {}, answersPart2 = {}, answersPart3 = {} } = req.body;

    const systemPrompt = `Ты — профессиональный клинический психолог. На основе ВСЕХ собранных данных пациента сформируй комплексные результаты диагностики.

Верни ТОЛЬКО JSON-объект с полями: personalPlan, psychPrep, specialistDoc, selfHelpTools и diagnosticResults.

ОБРАТИ ВНИМАНИЕ НА ПОЛЕ "diagnosticResults" (Результаты диагностики). Это поле должно содержать огромный, терапевтичный текст в формате Markdown со следующей строгой структурой:

1. КРАСНЫЕ ФЛАГИ (ОПЦИОНАЛЬНО). 
   Если в ответах есть суицидальные мысли, селфхарм или тяжелая зависимость — выведи этот блок, ОБЕРНУВ ЕГО В ЦИТАТУ (знак > в начале каждой строки). Текст блока ДОЛЖЕН БЫТЬ ТОЧНО ТАКИМ (без изменений):
   > ## 🚨 Если тебе очень плохо прямо сейчас
   > Если появились мысли навредить себе, исчезнуть или вы уже начали это делать — не оставайтесь одни. Позвоните немедленно:
   > • 8-800-2000-122 (или 124 с мобильного) — главный федеральный телефон доверия. Анонимно, бесплатно, круглосуточно.
   > • +7 (495) 989-50-50 — экстренная линия МЧС (острый кризис).
   > • 112 — если опасность для жизни прямо сейчас.
   > Звонок спасает жизнь. Это не слабость, это действие.
   Если маркеров риска нет — ПРОПУСТИ этот блок полностью.

2. ПРИВЕТСТВИЕ И ДИСКЛЕЙМЕР (Без заголовка).
   Напиши приветствие с эмпатией. Укажи, что это не диагнозы, а предварительная оценка, и для точной картины нужен специалист.

3. ПОРТРЕТ ЛИЧНОСТИ
   ## Портрет личности
   Целостный портрет состояния на данный момент (1 абзац).

4. МЕТАФОРА СОСТОЯНИЯ
   ## Метафора состояния
   Объясни состояние через понятную метафору (например: "Ваша нервная система сейчас как смартфон, у которого открыто 100 тяжелых приложений...").

5. ПОЧЕМУ ЭТО ПРОИСХОДИТ
   ## Почему это происходит
   Мощная валидация и поддержка. Раскрой мысль: "Учитывая ваш стресс, такая реакция абсолютно нормальна и закономерна. Вы не сломаны, это защитный механизм".

6. ГЛАВНЫЕ ОТКРЫТИЯ
   ## Главные открытия
   3-5 главных инсайтов списком.

7. ГИПОТЕЗЫ
   ## Гипотезы (Что обсудить с врачом)
   Для каждой гипотезы укажи: 
   - Название (потенциальный синдром/диагноз)
   - Степень уверенности (высокая/средняя/низкая)
   - Объяснение простым эмпатичным языком
   - Критерии "За" (из ответов пользователя)
   - Каких данных не хватает для проверки гипотезы: (вместо "Чего не хватило")

8. СЛЕПЫЕ ЗОНЫ
   ## Неочевидные моменты и потенциальные слепые зоны
   Списком.

9. КЛЮЧЕВЫЕ МЕХАНИЗМЫ
   ## Ключевые механизмы
   Списком.

10. ЧТО МОЖЕТ УХУДШАТЬ СОСТОЯНИЕ
    ## Что может ухудшать состояние
    Списком (триггеры, привычки).

11. СИЛЬНЫЕ СТОРОНЫ
    ## Сильные стороны
    Списком.

12. ВЛИЯНИЕ НА СФЕРЫ ЖИЗНИ
    ## Как это может влиять на сферы жизни
    Опиши только актуальное (с подзаголовками ### Работа, ### Отношения, ### Сон и т.д.).

13. МАЯЧКИ УЛУЧШЕНИЯ
    ## Маячки улучшения (Как вы поймете, что терапия работает)
    Дай 3-4 конкретных маячка (например: "Сможете засыпать быстрее 30 минут").

14. СЛЕДУЮЩИЙ ШАГ
    ## Следующий шаг
    Напиши точно этот текст: "Узнали себя? Не пугайтесь. Мы уже подготовили конкретные действия для работы с этим состоянием. Перейдите во вкладку «Пошаговый план», чтобы узнать, с чего начать прямо сегодня."

Обязательно используй заголовки (## и ###), жирный текст (**) и маркированные списки (-). Текст должен быть на русском языке.`;

    const userMessage = buildUserContext(req.body);

    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    console.log('📥 [QUESTIONNAIRE] Ответ от OpenAI (Results):', content.substring(0, 500));

    const generatedData = parseJSONFromResponse(content);

    console.log('✅ [QUESTIONNAIRE] Результаты успешно сгенерированы');

    res.json({
      success: true,
      personalPlan: generatedData.personalPlan || '',
      psychPrep: generatedData.psychPrep || '',
      specialistDoc: generatedData.specialistDoc || '',
      selfHelpTools: generatedData.selfHelpTools || '',
      diagnosticResults: generatedData.diagnosticResults || '',
      recommendedTests: generatedData.recommendedTests || []
    });

  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка генерации результатов:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка генерации результатов',
      personalPlan: '',
      psychPrep: '',
      specialistDoc: '',
      selfHelpTools: '',
      diagnosticResults: '',
      recommendedTests: []
    });
  }
});

export default router;
