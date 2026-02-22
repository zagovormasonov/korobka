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
type всегда "text". В options — 4 примера ответов, которые помогут пользователю сориентироваться. Никакого текста до или после JSON.`;

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
type всегда "text". В options — 4 примера ответов. Никакого текста до или после JSON.`;

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
 * POST /api/generate-results
 */
router.post('/generate-results', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию финальных результатов');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const { symptoms = [], generalDescription = '', answersPart1 = {}, answersPart2 = {}, answersPart3 = {} } = req.body;

    const systemPrompt = `Ты — профессиональный клинический психолог. На основе ВСЕХ собранных данных пациента сформируй комплексные результаты диагностики.

ТЫ ОБЯЗАН ВЕРНУТЬ СТРОГО ВАЛИДНЫЙ JSON-ОБЪЕКТ СЛЕДУЮЩЕГО ФОРМАТА (никакого текста до или после фигурных скобок!):

{
  "diagnosticResults": "Здесь огромный, терапевтичный текст в формате Markdown. Он должен включать: 1. КРАСНЫЕ ФЛАГИ (опционально, в виде цитаты >), 2. ПРИВЕТСТВИЕ И ДИСКЛЕЙМЕР, 3. ПОРТРЕТ ЛИЧНОСТИ (с заголовком ## Портрет личности), 4. МЕТАФОРА СОСТОЯНИЯ (с заголовком ## Метафора состояния), 5. ПОЧЕМУ ЭТО ПРОИСХОДИТ (с заголовком ## Почему это происходит), 6. ГЛАВНЫЕ ОТКРЫТИЯ (с заголовком ## Главные открытия). НЕ включай сюда гипотезы!",
  
  "hypotheses": [
    {
      "name": "Название гипотезы (потенциального диагноза)",
      "confidence": "Степень уверенности (Высокая / Средняя / Низкая)",
      "explanation": "Объяснение самого диагноза простым эмпатичным языком. Что это вообще за зверь такой? (например: 'Это состояние, когда ваша психика...')",
      "reasoning": "Эмпатичное обоснование, почему мы предполагаем именно этот диагноз на основе ответов пациента",
      "criteriaFor": ["Критерий За 1", "Критерий За 2"],
      "missingData": ["Каких данных не хватает для проверки 1", "Каких данных не хватает для проверки 2"]
    }
  ],

  "personalPlan": "Текст в формате Markdown. Должен включать: 1. НЕОЧЕВИДНЫЕ МОМЕНТЫ И СЛЕПЫЕ ЗОНЫ (## Неочевидные моменты и потенциальные слепые зоны), 2. КЛЮЧЕВЫЕ МЕХАНИЗМЫ (## Ключевые механизмы), 3. ЧТО МОЖЕТ УХУДШАТЬ СОСТОЯНИЕ (## Что может ухудшать состояние), 4. СИЛЬНЫЕ СТОРОНЫ (## Сильные стороны), 5. ВЛИЯНИЕ НА СФЕРЫ ЖИЗНИ (## Как это может влиять на сферы жизни), 6. МАЯЧКИ УЛУЧШЕНИЯ (## Маячки улучшения), 7. СЛЕДУЮЩИЙ ШАГ (## Следующий шаг - с точным текстом: 'Узнали себя? Не пугайтесь. Мы уже подготовили конкретные действия...')",
  
  "selfHelpTools": "Markdown-текст: Инструменты и техники самопомощи — конкретные упражнения, дыхательные техники, методы релаксации.",
  
  "psychPrep": "Markdown-текст: Подготовка к сеансу с психологом — что сказать, какие темы поднять, на что обратить внимание.",
  
  "specialistDoc": "Markdown-текст: Документ для специалиста — сухая клиническая выжимка, рекомендуемые тесты, предварительные выводы."
}

ОБЯЗАТЕЛЬНО соблюдай структуру JSON и ключи (name, confidence, explanation, reasoning, criteriaFor, missingData) внутри массива hypotheses!`;

    const userMessage = buildUserContext(req.body);

    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    console.log('📥 [QUESTIONNAIRE] Ответ от OpenAI (Results):', content.substring(0, 500));

    const generatedData = parseJSONFromResponse(content);

    console.log('✅ [QUESTIONNAIRE] Результаты успешно сгенерированы');

    res.json({
      success: true,
      hypotheses: generatedData.hypotheses || [],
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
      hypotheses: [],
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
