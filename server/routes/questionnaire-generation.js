import express from 'express';

const router = express.Router();

/**
 * Вызов Gemini API через v1beta API (как в /chat)
 */
async function callGeminiAI(prompt, maxTokens = 40960) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY не установлен в переменных окружения');
  }

  const modelName = 'models/gemini-3-pro-preview';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [{ text: prompt }]
    }]
    // Убрали maxOutputTokens - используем максимальные значения API по умолчанию
  };

  // Проверяем доступность fetch (для Node.js < 18 может потребоваться node-fetch)
  if (typeof fetch === 'undefined') {
    throw new Error('fetch не доступен. Требуется Node.js 18+ или установка node-fetch');
  }

  console.log('🚀 [QUESTIONNAIRE] Отправляем запрос к v1beta API...');
  console.log('🔗 [QUESTIONNAIRE] URL:', apiUrl.replace(apiKey, '***'));
  console.log('📋 [QUESTIONNAIRE] Model:', modelName);
  console.log('🔧 [QUESTIONNAIRE] Используем v1beta API (не SDK)');
  const startTime = Date.now();
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  const elapsed = Date.now() - startTime;
  console.log(`⏱️ [QUESTIONNAIRE] Время ответа v1beta API: ${(elapsed / 1000).toFixed(2)}с`);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (parseError) {
      const errorText = await response.text();
      console.error('❌ [QUESTIONNAIRE] Ошибка ответа (не JSON):', errorText);
      throw new Error(`v1beta API error (${response.status}): ${errorText}`);
    }
    
    console.error('❌ [QUESTIONNAIRE] Ошибка API:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    
    // Обработка ошибки 429 (Rate Limit Exceeded)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
      console.warn(`⚠️ [QUESTIONNAIRE] Превышен лимит запросов (429). Retry-After: ${retryAfter || 'не указан'}`);
      throw new Error(`v1beta API error (429): Rate limit exceeded`);
    }
    
    // Обработка ошибки 404
    if (response.status === 404) {
      console.error('❌ [QUESTIONNAIRE] Модель не найдена (404). Проверьте название модели:', modelName);
      throw new Error(`Модель ${modelName} не найдена для v1beta API. Проверьте доступность модели.`);
    }
    
    throw new Error(`v1beta API error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  
  // Проверяем структуру ответа (как в chat.js)
  if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0 ||
      !data.candidates[0].content || !data.candidates[0].content.parts ||
      !Array.isArray(data.candidates[0].content.parts) || data.candidates[0].content.parts.length === 0 ||
      !data.candidates[0].content.parts[0].text) {
    console.error('❌ [QUESTIONNAIRE] Неожиданная структура ответа от v1beta API:', JSON.stringify(data));
    throw new Error('Неожиданная структура ответа от Gemini 3.0 Pro v1beta API');
  }

  const text = data.candidates[0].content.parts[0].text;
  console.log(`✅ [QUESTIONNAIRE] Ответ получен, длина: ${text.length} символов`);
  
  return text;
}

/**
 * POST /api/generate-part1
 * Генерация первой части опросника
 * 
 * Request body:
 * {
 *   "symptoms": ["symptom_id_1", "symptom_id_2", ...],
 *   "generalDescription": "Общее описание ситуации пользователя"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "questions": [
 *     {
 *       "id": 1,
 *       "text": "Вопрос...",
 *       "type": "single" | "multiple" | "text",
 *       "options": ["Вариант 1", "Вариант 2", ...]
 *     },
 *     ...
 *   ]
 * }
 */
router.post('/generate-part1', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию первой части опросника');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const { symptoms = [], generalDescription = '' } = req.body;

    // Формируем описание симптомов
    const symptomsText = Array.isArray(symptoms) && symptoms.length > 0
      ? `Выбранные симптомы: ${symptoms.join(', ')}`
      : 'Симптомы не указаны';

    // Формируем промпт для генерации первой части
    const prompt = `Ты — AI-ассистент, который создаёт персонализированные психологические опросники.

ЗАДАЧА: Создай первую часть опросника (5-7 вопросов) для первичной оценки состояния пользователя.

${symptomsText}
${generalDescription ? `Общее описание ситуации: ${generalDescription}` : ''}

ТРЕБОВАНИЯ:
1. Вопросы должны быть понятными и не вызывать тревогу
2. Охватывать базовые области: настроение, энергия, сон, социальные контакты
3. Варианты ответов должны быть конкретными и легко выбираемыми
4. Каждый вопрос должен иметь 3-5 вариантов ответа

ФОРМАТ ОТВЕТА (верни ТОЛЬКО валидный JSON без дополнительного текста):
{
  "questions": [
    {
      "id": 1,
      "text": "Текст вопроса",
      "type": "single",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3"]
    }
  ]
}

Типы вопросов: "single" (один вариант), "multiple" (несколько вариантов), "text" (текстовый ответ)`;

    // Вызываем Gemini API через v1beta
    const text = await callGeminiAI(prompt, 8192);

    console.log('📥 [QUESTIONNAIRE] Ответ от Gemini (Part 1):', text.substring(0, 500));

    // Парсим JSON из ответа
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const generatedData = JSON.parse(jsonText);

    console.log('✅ [QUESTIONNAIRE] Сгенерировано вопросов (Part 1):', generatedData.questions?.length || 0);

    res.json({
      success: true,
      questions: generatedData.questions || []
    });

  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка генерации первой части:', error);
    console.error('❌ [QUESTIONNAIRE] Тип ошибки:', error.constructor?.name);
    console.error('❌ [QUESTIONNAIRE] Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка генерации опросника',
      questions: []
    });
  }
});

/**
 * POST /api/generate-part2
 * Генерация второй части опросника на основе ответов из первой части
 * 
 * Request body:
 * {
 *   "symptoms": ["symptom_id_1", "symptom_id_2", ...],
 *   "generalDescription": "Общее описание ситуации пользователя",
 *   "answersPart1": {
 *     "1": "Ответ на вопрос 1",
 *     "2": "Ответ на вопрос 2",
 *     ...
 *   }
 * }
 * 
 * Response: аналогичен generate-part1
 */
router.post('/generate-part2', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию второй части опросника');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const { symptoms = [], generalDescription = '', answersPart1 = {} } = req.body;

    // Формируем описание ответов из первой части
    const answersDescription = Object.entries(answersPart1)
      .map(([questionId, answer]) => `Вопрос ${questionId}: ${answer}`)
      .join('\n');

    // Формируем описание симптомов
    const symptomsText = Array.isArray(symptoms) && symptoms.length > 0
      ? `Выбранные симптомы: ${symptoms.join(', ')}`
      : 'Симптомы не указаны';

    // Формируем промпт для генерации второй части
    const prompt = `Ты — AI-ассистент, который создаёт персонализированные психологические опросники.

ЗАДАЧА: Создай вторую часть опросника (5-7 вопросов) на основе ответов пользователя из первой части.

${symptomsText}
${generalDescription ? `Общее описание ситуации: ${generalDescription}` : ''}

ОТВЕТЫ ИЗ ПЕРВОЙ ЧАСТИ:
${answersDescription}

ТРЕБОВАНИЯ:
1. Вопросы должны углубляться в проблемные области, выявленные в первой части
2. Быть более конкретными и персонализированными
3. Помочь лучше понять состояние пользователя
4. Каждый вопрос должен иметь 3-5 вариантов ответа

ФОРМАТ ОТВЕТА (верни ТОЛЬКО валидный JSON без дополнительного текста):
{
  "questions": [
    {
      "id": 8,
      "text": "Текст вопроса",
      "type": "single",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3"]
    }
  ]
}

ID вопросов должны начинаться с 8 (продолжение после первой части).
Типы вопросов: "single" (один вариант), "multiple" (несколько вариантов), "text" (текстовый ответ)`;

    // Вызываем Gemini API через v1beta
    const text = await callGeminiAI(prompt, 8192);

    console.log('📥 [QUESTIONNAIRE] Ответ от Gemini (Part 2):', text.substring(0, 500));

    // Парсим JSON из ответа
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const generatedData = JSON.parse(jsonText);

    console.log('✅ [QUESTIONNAIRE] Сгенерировано вопросов (Part 2):', generatedData.questions?.length || 0);

    res.json({
      success: true,
      questions: generatedData.questions || []
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
 * Генерация третьей части опросника (дополнительные тесты)
 * 
 * Request body:
 * {
 *   "symptoms": ["symptom_id_1", "symptom_id_2", ...],
 *   "generalDescription": "Общее описание ситуации пользователя",
 *   "answersPart1": { ... },
 *   "answersPart2": { ... }
 * }
 * 
 * Response: аналогичен generate-part1
 */
router.post('/generate-part3', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию третьей части опросника');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const { symptoms = [], generalDescription = '', answersPart1 = {}, answersPart2 = {} } = req.body;

    // Формируем описание ответов из первой и второй частей
    const answersPart1Text = Object.entries(answersPart1)
      .map(([questionId, answer]) => `Вопрос ${questionId}: ${answer}`)
      .join('\n');
    const answersPart2Text = Object.entries(answersPart2)
      .map(([questionId, answer]) => `Вопрос ${questionId}: ${answer}`)
      .join('\n');

    // Формируем описание симптомов
    const symptomsText = Array.isArray(symptoms) && symptoms.length > 0
      ? `Выбранные симптомы: ${symptoms.join(', ')}`
      : 'Симптомы не указаны';

    // Формируем промпт для генерации третьей части
    const prompt = `Ты — AI-ассистент, который создаёт персонализированные психологические опросники.

ЗАДАЧА: Создай третью часть опросника (5-7 вопросов) для дополнительной диагностики на основе предыдущих ответов.

${symptomsText}
${generalDescription ? `Общее описание ситуации: ${generalDescription}` : ''}

ОТВЕТЫ ИЗ ПЕРВОЙ ЧАСТИ:
${answersPart1Text}

ОТВЕТЫ ИЗ ВТОРОЙ ЧАСТИ:
${answersPart2Text}

ТРЕБОВАНИЯ:
1. Вопросы должны быть направлены на уточнение и углубление информации из предыдущих частей
2. Фокусироваться на специфических аспектах выявленных проблем
3. Помочь определить необходимость дополнительных тестов или специализированной помощи
4. Каждый вопрос должен иметь 3-5 вариантов ответа

ФОРМАТ ОТВЕТА (верни ТОЛЬКО валидный JSON без дополнительного текста):
{
  "questions": [
    {
      "id": 15,
      "text": "Текст вопроса",
      "type": "single",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3"]
    }
  ]
}

ID вопросов должны начинаться с 15 (продолжение после второй части).
Типы вопросов: "single" (один вариант), "multiple" (несколько вариантов), "text" (текстовый ответ)`;

    // Вызываем Gemini API через v1beta
    const text = await callGeminiAI(prompt, 8192);

    console.log('📥 [QUESTIONNAIRE] Ответ от Gemini (Part 3):', text.substring(0, 500));

    // Парсим JSON из ответа
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const generatedData = JSON.parse(jsonText);

    console.log('✅ [QUESTIONNAIRE] Сгенерировано вопросов (Part 3):', generatedData.questions?.length || 0);

    res.json({
      success: true,
      questions: generatedData.questions || []
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
 * Генерация финальных документов на основе всех ответов
 * 
 * Request body:
 * {
 *   "symptoms": ["symptom_id_1", "symptom_id_2", ...],
 *   "generalDescription": "Общее описание ситуации пользователя",
 *   "answersPart1": { ... },
 *   "answersPart2": { ... },
 *   "answersPart3": { ... } // опционально
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "personalPlan": "...",
 *   "psychPrep": "...",
 *   "specialistDoc": "...",
 *   "recommendedTests": [...]
 * }
 */
router.post('/generate-results', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию финальных результатов');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const { symptoms = [], generalDescription = '', answersPart1 = {}, answersPart2 = {}, answersPart3 = {} } = req.body;

    // Объединяем все ответы
    const allAnswers = { ...answersPart1, ...answersPart2, ...answersPart3 };
    const answersDescription = Object.entries(allAnswers)
      .map(([questionId, answer]) => `Вопрос ${questionId}: ${answer}`)
      .join('\n');

    // Формируем описание симптомов
    const symptomsText = Array.isArray(symptoms) && symptoms.length > 0
      ? `Выбранные симптомы: ${symptoms.join(', ')}`
      : 'Симптомы не указаны';

    // Формируем промпт для генерации результатов
    const prompt = `Ты — AI-ассистент психолог, который анализирует ответы пользователя и создаёт персонализированные рекомендации.

ЗАДАЧА: Проанализируй все ответы пользователя и создай развёрнутые результаты с рекомендациями.

${symptomsText}
${generalDescription ? `Общее описание ситуации: ${generalDescription}` : ''}

ВСЕ ОТВЕТЫ:
${answersDescription}

ТРЕБОВАНИЯ:
1. Анализ должен быть профессиональным, но понятным
2. Рекомендации — конкретные и выполнимые
3. Отметь как области риска, так и сильные стороны
4. Предложи конкретные следующие шаги

ФОРМАТ ОТВЕТА (верни ТОЛЬКО валидный JSON без дополнительного текста):
{
  "personalPlan": "Полный персональный план в формате Markdown",
  "psychPrep": "Подготовка к сеансу с психологом в формате Markdown",
  "specialistDoc": "Документ для специалиста в формате Markdown",
  "recommendedTests": [
    {
      "id": "test_id",
      "name": "Название теста",
      "description": "Описание теста",
      "url": "ссылка на тест"
    }
  ]
}`;

    // Вызываем Gemini API через v1beta
    const text = await callGeminiAI(prompt, 16000);

    console.log('📥 [QUESTIONNAIRE] Ответ от Gemini (Results):', text.substring(0, 500));

    // Парсим JSON из ответа
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const generatedData = JSON.parse(jsonText);

    console.log('✅ [QUESTIONNAIRE] Результаты успешно сгенерированы');

    res.json({
      success: true,
      personalPlan: generatedData.personalPlan || '',
      psychPrep: generatedData.psychPrep || '',
      specialistDoc: generatedData.specialistDoc || '',
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
      recommendedTests: []
    });
  }
});

export default router;

