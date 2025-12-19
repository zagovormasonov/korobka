import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Инициализация Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * POST /api/generate-part1
 * Генерация первой части опросника
 * 
 * Request body:
 * {
 *   "context": "Описание контекста или предыдущих ответов",
 *   "preferences": { ... } // опциональные настройки
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

    const { context = '', preferences = {} } = req.body;

    // Формируем промпт для генерации первой части
    const prompt = `Ты — AI-ассистент, который создаёт персонализированные психологические опросники.

ЗАДАЧА: Создай первую часть опросника (5-7 вопросов) для первичной оценки состояния пользователя.

КОНТЕКСТ: ${context || 'Первичная оценка психологического состояния'}

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

    // Вызываем Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
 *   "part1_answers": {
 *     "1": "Ответ на вопрос 1",
 *     "2": "Ответ на вопрос 2",
 *     ...
 *   },
 *   "context": "Дополнительный контекст"
 * }
 * 
 * Response: аналогичен generate-part1
 */
router.post('/generate-part2', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию второй части опросника');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const { part1_answers = {}, context = '' } = req.body;

    // Формируем описание ответов из первой части
    const answersDescription = Object.entries(part1_answers)
      .map(([questionId, answer]) => `Вопрос ${questionId}: ${answer}`)
      .join('\n');

    // Формируем промпт для генерации второй части
    const prompt = `Ты — AI-ассистент, который создаёт персонализированные психологические опросники.

ЗАДАЧА: Создай вторую часть опросника (5-7 вопросов) на основе ответов пользователя из первой части.

ОТВЕТЫ ИЗ ПЕРВОЙ ЧАСТИ:
${answersDescription}

КОНТЕКСТ: ${context}

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

    // Вызываем Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
 * POST /api/generate-results
 * Генерация финальных документов на основе всех ответов
 * 
 * Request body:
 * {
 *   "all_answers": {
 *     "1": "Ответ на вопрос 1",
 *     "2": "Ответ на вопрос 2",
 *     ...
 *   },
 *   "user_info": {
 *     "name": "Имя",
 *     "age": 25,
 *     ...
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "results": {
 *     "summary": "Общая сводка состояния",
 *     "recommendations": [
 *       "Рекомендация 1",
 *       "Рекомендация 2",
 *       ...
 *     ],
 *     "risk_areas": ["Область 1", "Область 2"],
 *     "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
 *     "next_steps": ["Шаг 1", "Шаг 2"]
 *   }
 * }
 */
router.post('/generate-results', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию финальных результатов');
    console.log('📋 [QUESTIONNAIRE] Тело запроса:', JSON.stringify(req.body, null, 2));

    const { all_answers = {}, user_info = {} } = req.body;

    // Формируем описание всех ответов
    const answersDescription = Object.entries(all_answers)
      .map(([questionId, answer]) => `Вопрос ${questionId}: ${answer}`)
      .join('\n');

    const userInfoText = Object.entries(user_info)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    // Формируем промпт для генерации результатов
    const prompt = `Ты — AI-ассистент психолог, который анализирует ответы пользователя и создаёт персонализированные рекомендации.

ЗАДАЧА: Проанализируй все ответы пользователя и создай развёрнутые результаты с рекомендациями.

ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:
${userInfoText || 'Не указана'}

ВСЕ ОТВЕТЫ:
${answersDescription}

ТРЕБОВАНИЯ:
1. Анализ должен быть профессиональным, но понятным
2. Рекомендации — конкретные и выполнимые
3. Отметь как области риска, так и сильные стороны
4. Предложи конкретные следующие шаги

ФОРМАТ ОТВЕТА (верни ТОЛЬКО валидный JSON без дополнительного текста):
{
  "summary": "Общая сводка психологического состояния пользователя (2-3 абзаца)",
  "recommendations": [
    "Конкретная рекомендация 1",
    "Конкретная рекомендация 2",
    "Конкретная рекомендация 3"
  ],
  "risk_areas": [
    "Область, требующая внимания 1",
    "Область, требующая внимания 2"
  ],
  "strengths": [
    "Выявленная сильная сторона 1",
    "Выявленная сильная сторона 2"
  ],
  "next_steps": [
    "Конкретный шаг 1",
    "Конкретный шаг 2",
    "Конкретный шаг 3"
  ],
  "professional_help_recommended": true или false,
  "urgency_level": "low" | "medium" | "high"
}`;

    // Вызываем Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
      results: generatedData
    });

  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка генерации результатов:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка генерации результатов',
      results: null
    });
  }
});

export default router;

