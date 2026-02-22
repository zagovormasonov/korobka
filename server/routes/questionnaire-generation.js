import express from 'express';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
import FormData from 'form-data';

const router = express.Router();
const upload = multer({ dest: '/tmp/' });

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
 * POST /api/generate-specialist
 */
router.post('/generate-specialist', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию отчета специалиста');
    
    const systemPrompt = `Ты — экспертный консилиум: главный врач-психиатр и клинический психолог. На основе данных пациента сформируй два клинических отчета.
Это первый этап, поэтому детально проанализируй анамнез.

ВЕРНИ СТРОГО JSON-ОБЪЕКТ С ТРЕМЯ КЛЮЧАМИ:
{
  "hypotheses": [
    {
      "codeMkb10": "Код МКБ-10",
      "codeMkb11": "Код МКБ-11",
      "syndrome": "Ведущий синдром",
      "name": "Название гипотезы (диагноза)",
      "confidence": "Высокая / Средняя / Низкая",
      "criteriaFor": ["Критерий За 1", "Критерий За 2"],
      "missingData": ["Каких данных не хватает 1"]
    }
  ],
  "psychiatristDoc": {
    "riskStatus": {
      "suicide": "отсутствует / низкий / выраженный / высокий",
      "selfHarm": "отсутствует / низкий / выраженный / высокий",
      "aggression": "отсутствует / низкий / выраженный / высокий"
    },
    "symptoms": {
      "emotional": ["Настроение, апатия, тревога..."],
      "cognitive": ["Память, внимание, туман в голове..."],
      "somatic": ["Сон, аппетит, либидо, боли..."],
      "perception": ["Навязчивости, паранойя..."],
      "other": ["Другое"]
    },
    "dynamics": "Особенности течения: длительность, периодичность, триггеры начала",
    "differential": ["Для диф. диагностики 1", "Пункт 2"],
    "somaticFactors": ["Фактор 1", "Фактор 2"],
    "pharmaTargets": ["Мишень 1 (без названий препаратов)", "Мишень 2"],
    "redFlags": ["Красный флаг 1"],
    "worsens": ["Что ухудшает 1"],
    "riskFactors": ["Фактор риска 1"]
  },
  "psychologistDoc": {
    "riskStatus": {
      "suicide": "отсутствует / низкий / выраженный / высокий",
      "selfHarm": "отсутствует / низкий / выраженный / высокий",
      "aggression": "отсутствует / низкий / выраженный / высокий"
    },
    "mainRequest": ["Жалоба 1 живым языком", "Жалоба 2"],
    "conceptualization": {
      "cognitive": ["Когнитивные искажения, глуб. убеждения"],
      "triggers": ["Триггер 1"],
      "patterns": ["Тревога -> избегание -> ..."],
      "other": ["Другое"]
    },
    "blindSpots": ["Неочевидный момент 1"],
    "allianceFeatures": ["Риск бросить терапию", "Склонность к интеллектуализации"],
    "targetsSequence": ["1. Сделать то-то (ACT/DBT)", "2. ..."],
    "indicators": ["Маячок улучшения 1"]
  }
}
Никакого текста кроме JSON.`;

    const userMessage = buildUserContext(req.body);
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = parseJSONFromResponse(content);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка generate-specialist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/generate-diagnostic
 */
router.post('/generate-diagnostic', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию diagnostic');
    
    const systemPrompt = `Ты — клинический психолог. В контексте тебе будут переданы "coreHypotheses" (уже поставленные гипотезы). Напиши эмпатичный отчет для клиента.

ВЕРНИ СТРОГО JSON:
{
  "content": "Здесь терапевтичный Markdown-текст. Включи: 1. КРАСНЫЕ ФЛАГИ (опционально, цитатой >), 2. ПРИВЕТСТВИЕ, 3. ПОРТРЕТ ЛИЧНОСТИ (## Портрет личности), 4. МЕТАФОРА СОСТОЯНИЯ (## Метафора состояния), 5. ПОЧЕМУ ЭТО ПРОИСХОДИТ (## Почему это происходит), 6. ГЛАВНЫЕ ОТКРЫТИЯ (## Главные открытия)."
}`;

    const userMessage = `Core Hypotheses: ${JSON.stringify(req.body.coreHypotheses || [])}\n\n${buildUserContext(req.body)}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = parseJSONFromResponse(content);
    
    res.json({ success: true, content: data.content });
  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка generate-diagnostic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/generate-plan
 */
router.post('/generate-plan', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию plan');
    
    const systemPrompt = `Ты — клинический психолог. В контексте переданы "coreHypotheses". Напиши пошаговый план для пациента.

ВЕРНИ СТРОГО JSON:
{
  "content": "Markdown-текст. Включи: 1. КЛЮЧЕВЫЕ МЕХАНИЗМЫ (## Ключевые механизмы), 2. СИЛЬНЫЕ СТОРОНЫ (## Сильные стороны), 3. ВЛИЯНИЕ НА СФЕРЫ ЖИЗНИ (## Как это может влиять на сферы жизни), 4. МАЯЧКИ УЛУЧШЕНИЯ (## Маячки улучшения), 5. СЛЕДУЮЩИЙ ШАГ (## Следующий шаг)."
}`;

    const userMessage = `Core Hypotheses: ${JSON.stringify(req.body.coreHypotheses || [])}\n\n${buildUserContext(req.body)}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = parseJSONFromResponse(content);
    
    res.json({ success: true, content: data.content });
  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка generate-plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/generate-tools
 */
router.post('/generate-tools', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию tools');
    
    const systemPrompt = `Ты — клинический психолог. В контексте переданы "coreHypotheses".
ВЕРНИ СТРОГО JSON:
{
  "content": "Markdown-текст. Подробные инструменты самопомощи (конкретные упражнения, дыхательные практики)."
}`;

    const userMessage = `Core Hypotheses: ${JSON.stringify(req.body.coreHypotheses || [])}\n\n${buildUserContext(req.body)}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = parseJSONFromResponse(content);
    
    res.json({ success: true, content: data.content });
  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка generate-tools:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/generate-prep
 */
router.post('/generate-prep', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию prep');
    
    const systemPrompt = `Ты — клинический психолог. В контексте переданы "coreHypotheses".
ВЕРНИ СТРОГО JSON:
{
  "content": "Markdown-текст. Подготовка к сеансу с психологом: что сказать, на что обратить внимание."
}`;

    const userMessage = `Core Hypotheses: ${JSON.stringify(req.body.coreHypotheses || [])}\n\n${buildUserContext(req.body)}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = parseJSONFromResponse(content);
    
    res.json({ success: true, content: data.content });
  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка generate-prep:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/transcribe
 * Транскрибация аудио
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на транскрибацию аудио');
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл аудио не найден' });
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), { filename: 'audio.webm' });
    formData.append('model', 'whisper-1');
    formData.append('language', 'ru');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: { 
        ...formData.getHeaders(), 
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}` 
      }
    });

    console.log('✅ [QUESTIONNAIRE] Транскрибация успешна');
    res.json({ success: true, text: response.data.text });
  } catch (error) {
    console.error('❌ [QUESTIONNAIRE] Ошибка transcribe:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export default router;
