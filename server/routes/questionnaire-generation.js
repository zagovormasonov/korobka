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
  const { symptoms = [], generalDescription = '', answersPart1 = {}, answersPart2 = {} } = body;

  const symptomsText = Array.isArray(symptoms) && symptoms.length > 0
    ? `Выбранные симптомы: ${symptoms.join(', ')}`
    : 'Симптомы не указаны';

  const descText = generalDescription ? `Описание ситуации: ${generalDescription}` : '';

  const answers1Text = Object.keys(answersPart1).length > 0
    ? `\nОТВЕТЫ (ЧАСТЬ 1):\n${Object.entries(answersPart1).map(([k, v]) => `Вопрос ${k}: ${v}`).join('\n')}`
    : '';

  const answers2Text = Object.keys(answersPart2).length > 0
    ? `\nОТВЕТЫ (ЧАСТЬ 2):\n${Object.entries(answersPart2).map(([k, v]) => `Вопрос ${k}: ${v}`).join('\n')}`
    : '';

  return [symptomsText, descText, answers1Text, answers2Text].filter(Boolean).join('\n');
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
Верни ТОЛЬКО JSON-объект с полями:
{
  "personalPlan": "Markdown-текст: Личный план ментального здоровья — конкретные шаги, что делать сейчас, через 2 недели, через месяц. Как выбрать специалиста и методику.",
  "psychPrep": "Markdown-текст: Подготовка к сеансу с психологом — что сказать, какие темы поднять, на что обратить внимание.",
  "specialistDoc": "Markdown-текст: Документ для специалиста — гипотезы о состоянии, рекомендуемые тесты, предварительные выводы.",
  "selfHelpTools": "Markdown-текст: Инструменты и техники самопомощи — конкретные упражнения, дыхательные техники, методы релаксации.",
  "diagnosticResults": "Markdown-текст: Результаты диагностики — описание выявленных паттернов, областей беспокойства, степень выраженности."
}
Каждое поле должно содержать развёрнутый текст в формате Markdown (заголовки ##, списки -, жирный текст **). Текст на русском языке.`;

    const allAnswers = { ...answersPart1, ...answersPart2, ...answersPart3 };
    const answersDescription = Object.entries(allAnswers)
      .map(([questionId, answer]) => `Вопрос ${questionId}: ${answer}`)
      .join('\n');

    const symptomsText = Array.isArray(symptoms) && symptoms.length > 0
      ? `Выбранные симптомы: ${symptoms.join(', ')}`
      : 'Симптомы не указаны';

    const userMessage = [
      symptomsText,
      generalDescription ? `Описание ситуации: ${generalDescription}` : '',
      answersDescription ? `\nВСЕ ОТВЕТЫ:\n${answersDescription}` : ''
    ].filter(Boolean).join('\n');

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
