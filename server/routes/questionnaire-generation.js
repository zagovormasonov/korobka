import express from 'express';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
import FormData from 'form-data';
import { extractJSON } from '../utils/extractJSON.js';

const router = express.Router();
const upload = multer({ dest: '/tmp/' });

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

    const questions = extractJSON(content);

    console.log('✅ [QUESTIONNAIRE] Сгенерировано вопросов (Part 1):', Array.isArray(questions) ? questions.length : 0);

    res.json({
      success: true,
      questions: Array.isArray(questions) ? questions : (questions.questions || [])
    });

  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [QUESTIONNAIRE] generate-part1 failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({
      success: false,
      error: errMsg || 'Ошибка генерации опросника',
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

    const questions = extractJSON(content);

    console.log('✅ [QUESTIONNAIRE] Сгенерировано вопросов (Part 2):', Array.isArray(questions) ? questions.length : 0);

    res.json({
      success: true,
      questions: Array.isArray(questions) ? questions : (questions.questions || [])
    });

  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [QUESTIONNAIRE] generate-part2 failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({
      success: false,
      error: errMsg || 'Ошибка генерации опросника',
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

ВЕРНИ СТРОГО JSON-ОБЪЕКТ С ЧЕТЫРЬМЯ КЛЮЧАМИ:
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
  "riskStatus": {
    "suicide": "отсутствует / низкий / выраженный / высокий",
    "selfHarm": "отсутствует / низкий / выраженный / высокий",
    "aggression": "отсутствует / низкий / выраженный / высокий"
  },
  "psychiatristDoc": {
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
    const data = extractJSON(content);
    
    res.json({ success: true, data });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [QUESTIONNAIRE] generate-specialist failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ success: false, error: errMsg });
  }
});

/**
 * POST /api/generate-diagnostic
 */
router.post('/generate-diagnostic', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию diagnostic');
    
    const systemPrompt = `Ты — клинический психолог. В контексте тебе будут переданы "coreHypotheses" (уже поставленные гипотезы). Напиши эмпатичный, но содержательный отчет для клиента.

ВЕРНИ СТРОГО JSON-ОБЪЕКТ С 2 КЛЮЧАМИ (beforeHypotheses, afterHypotheses):
{
  "beforeHypotheses": "Markdown-текст ДО блока гипотез (секции 1-4)",
  "afterHypotheses": "Markdown-текст ПОСЛЕ блока гипотез (секции 5-11)"
}

СТРУКТУРА ДЛЯ beforeHypotheses:

(ОПЦИОНАЛЬНЫЙ БЛОК - ТОЛЬКО ПРИ ВЫСОКОМ РИСКЕ СУИЦИДА/СЕЛФХАРМА. Оберни в цитату через >):
> ## Если тебе очень плохо прямо сейчас
> Если появились мысли навредить себе, исчезнуть или вы уже начали это делать — не оставайтесь одни. Позвоните немедленно:
> •  8-800-2000-122 (или 124 с мобильного) — главный федеральный телефон доверия. Анонимно, бесплатно, круглосуточно.
> •  +7 (495) 989-50-50 — экстренная линия МЧС (острый кризис).
> •  112 — если опасность для жизни прямо сейчас.
> Звонок спасает жизнь. Это не слабость, это действие.

(БЕЗ ЗАГОЛОВКА. 2-3 предложения. Эмпатичное приветствие, нормализация чувств. Обязательно упомяни, что это не диагнозы, а предварительная оценка на основе предоставленных данных, и для точной картины рекомендуется обратиться к специалисту. Без пафоса.)

## Портрет личности
(Один абзац. Целостный портрет личности: сильные стороны, ресурсы, черты характера. Это НЕ перечисление симптомов, а описание ЧЕЛОВЕКА.)

## Метафора состояния
(Подбери точную, узнаваемую метафору. Пример: «Сейчас ваша нервная система напоминает смартфон, у которого открыто 100 тяжёлых приложений...». Люди понимают метафоры лучше клинических терминов.)

## Почему это происходит
(Валидация и поддержка. Объясни ключевые механизмы простым языком. Как связаны симптомы между собой, что что поддерживает. Обязательно начни с валидирующего посыла: «Учитывая ваш уровень нагрузки, такая реакция вашей психики абсолютно нормальна и закономерна. Вы не сломаны, это защитный механизм».)

## Главные открытия
(3-5 инсайтов, которые клиент мог не осознавать. Формулируй мягко, без обвинений.)

--- ЗДЕСЬ НА ФРОНТЕНДЕ БУДУТ ВСТАВЛЕНЫ ГИПОТЕЗЫ ИЗ ОТДЕЛЬНОГО ПОЛЯ, НЕ ГЕНЕРИРУЙ ИХ ---

СТРУКТУРА ДЛЯ afterHypotheses:

## Неочевидные моменты и потенциальные слепые зоны
(Список. То, что клиент мог не заметить или не связать с основной проблемой.)

## Ключевые механизмы
(Список. Коротко и ёмко: какие психологические механизмы работают.)

## Что может ухудшать состояние
(Список конкретных факторов, привычек, ситуаций, которые поддерживают или усугубляют симптомы.)

## Сильные стороны
(Список. Что у клиента уже работает, на что можно опереться.)

## Что это значит для твоей жизни в целом
(Список. Краткий обзор, как текущее состояние влияет на жизнь в целом.)

## Как это может влиять на сферы жизни
(Включай только актуальные подзаголовки из: работа, отношения с людьми, физическое здоровье и тело, сон и восстановление, финансы и импульсивные решения, самооценка и внутренний диалог, досуг / хобби / ощущение удовольствия от жизни)

## Маячки улучшения
(Дай 3-4 конкретных маячка. Например: «Вы сможете засыпать быстрее 30 минут», «Уйдет фоновое чувство вины по утрам». Это даёт надежду и измеримый результат.)

## Следующий шаг
«Узнали себя? Не пугайтесь. Мы уже подготовили конкретные действия для работы с этим состоянием. Перейдите во вкладку "Пошаговый план", чтобы узнать, с чего начать прямо сегодня».
`;

    const userMessage = `Core Hypotheses: ${JSON.stringify(req.body.coreHypotheses || [])}\n\n${buildUserContext(req.body)}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = extractJSON(content);
    
    res.json({ success: true, beforeHypotheses: data.beforeHypotheses || '', afterHypotheses: data.afterHypotheses || '' });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [QUESTIONNAIRE] generate-diagnostic failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ success: false, error: errMsg });
  }
});

/**
 * POST /api/generate-lumi
 */
router.post('/generate-lumi', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию lumi');
    
    const systemPrompt = `Ты — Луми, маленькая капля света. Ты — тёплый, эмпатичный маскот приложения idenself. Твоя задача — написать короткое приветственное сообщение пользователю, который только что прошёл диагностику.

ПРАВИЛА:
- Сообщение ОБЯЗАТЕЛЬНО начинается с "Я — Луми, капля света."
- Максимум 290 символов. 2-4 предложения.
- Тон: мягкий, поддерживающий, без пафоса, без восклицательных знаков подряд.
- ТОЛЬКО поддержка, эмпатия и валидация. Дай понять, что первый шаг (пройти диагностику) уже сделан — это важно и смело.
- НЕ предлагай заглянуть в результаты, план или документы. НЕ направляй к конкретным разделам.
- НЕ добавляй в конце фразы-инструкции вроде "отметьте пункты", "если что-то откликается", "загляните в план".
- НЕ ставь диагнозов, НЕ давай медицинских советов.
- НЕ используй слова "генерация", "ИИ", "нейросеть", "алгоритм".
- Пиши на русском языке.

ВЕРНИ СТРОГО JSON: { "content": "текст сообщения" }`;

    const { coreHypotheses, patientPayload } = req.body;
    const patientBlock =
      patientPayload != null
        ? `patientPayload (JSON):\n${JSON.stringify(patientPayload, null, 2)}`
        : `Данные из анкеты:\n${buildUserContext(req.body)}`;
    const userMessage = `coreHypotheses: ${JSON.stringify(coreHypotheses || [])}\n\n${patientBlock}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.7);
    const data = extractJSON(content);
    
    res.json({ success: true, content: data.content });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [QUESTIONNAIRE] generate-lumi failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ success: false, error: errMsg });
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
  "content": "Markdown-текст по строгой структуре ниже."
}

СТРУКТУРА МАРКДАУН-ТЕКСТА (соблюдай заголовки и форматирование):

# Пошаговый план
*${new Date().toLocaleDateString('ru-RU')}*

*Этот план — вспомогательный инструмент на основе твоих данных. Он не заменяет профессиональную помощь психолога или психиатра и не является лечением. Выполняй рекомендации осознанно и прислушивайся к своему состоянию. При любом ухудшении или появлении тревожных симптомов сразу обращайся к специалисту.*

(ОПЦИОНАЛЬНЫЙ БЛОК - ТОЛЬКО ПРИ ВЫСОКОМ РИСКЕ СУИЦИДА/СЕЛФХАРМА/АГРЕССИИ. Если риска нет, ПРОПУСТИ этот блок полностью. Обязательно оберни этот текст в цитату через знак > чтобы он окрасился в розовый цвет на фронтенде):
> ## Если прямо сейчас очень плохо
> Если появились мысли навредить себе, исчезнуть или вы уже начали это делать — не оставайтесь одни. Позвоните немедленно:
> •  8-800-2000-122 (или 124 с мобильного) — главный федеральный телефон доверия. Анонимно, бесплатно, круглосуточно.
> •  +7 (495) 989-50-50 — экстренная линия МЧС (острый кризис).
> •  112 — если опасность для жизни прямо сейчас.
> Звонок спасает жизнь. Это не слабость, это действие.

## Здесь и сейчас
(Список с цифрами 1., 2. и т.д. Первые 24-72 часа)

## Ближайшие 72 часа
(Свободная форма, можно обычный текст, разрешены списки)

## План на 2 недели
(Свободная форма, можно обычный текст, разрешены списки)

## Вектор и маршрут терапии
(Свободная форма, можно обычный текст, разрешены списки)

## Какие методики больше всего подходят
(Свободная форма, можно обычный текст, разрешены списки)

## Как выбрать специалиста
(Свободная форма, можно обычный текст, разрешены списки)

## Если кажется, что ничего не помогает
(Эмпатичное объяснение, что «откаты» (ухудшения) — это нормальная часть выздоровления, + четкая инструкция, что делать в этом случае)
`;

    const userMessage = `Core Hypotheses: ${JSON.stringify(req.body.coreHypotheses || [])}\n\n${buildUserContext(req.body)}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = extractJSON(content);
    
    res.json({ success: true, content: data.content });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [QUESTIONNAIRE] generate-plan failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ success: false, error: errMsg });
  }
});

/**
 * POST /api/generate-tools
 */
router.post('/generate-tools', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию tools');
    
    const systemPrompt = `Ты — клинический психолог. В контексте переданы "coreHypotheses".
ВЕРНИ СТРОГО JSON-ОБЪЕКТ С 3 КЛЮЧАМИ (intro, exercises, outro):
{
  "intro": "Markdown-текст (Блоки 1 и 2: Как пользоваться и Ключевые трудности)",
  "exercises": [
    {
      "category": "Например: Когда накрывает тревога",
      "title": "Название техники (только на русском)",
      "time": "СТРОГО ОДНО значение вида 'N-M минут' (например: '3-5 минут', '10-15 минут'). БЕЗ скобок, БЕЗ пояснений, БЕЗ разделения на этапы.",
      "therapy": "Вид терапии (СТРОГО ОДНА ФРАЗА ИЛИ АББРЕВИАТУРА ИЗ СПИСКА: КПТ, ДБТ, ТПО, ТСС, Схема-терапия)",
      "purpose": "Для чего (1 предложение)",
      "instructions": "Как выполнять (Пошаговая инструкция, можно длинную)",
      "source": "Откуда это (Фраза-маркер: 'Это базовая техника из...')"
    }
  ],
  "outro": "Markdown-текст (Блоки 4, 5 и 6: Простая ежедневная микро-рутина, Рекомендуемое направление психотерапии, Напутствие)"
}

СТРУКТУРА КОНТЕНТА:

--- ДЛЯ КЛЮЧА intro ---
# Инструменты и техники самопомощи
*Персональная аптечка первой психологической помощи*
*${new Date().toLocaleDateString('ru-RU')}*

*Эти инструменты — ваша «аптечка первой помощи», чтобы поддержать себя в сложные моменты. Они не могут заменить работу со специалистом, но помогут вернуть контроль над состоянием. Пожалуйста, будьте бережны к себе: если какая-то техника вызывает тревогу или не работает для вас — это абсолютно нормально, просто отложите её в сторону.*

## 1. Как пользоваться этой аптечкой
(Сгенерируй 4 эмпатичных пункта списком. Основные мысли: 1. Не пытайтесь сделать всё сразу... и т.д.)

## 2. Ваши ключевые трудности сейчас
(На основе диагностики выдели 3-5 главных мишеней. Опиши их живым, эмпатичным языком).

--- ДЛЯ КЛЮЧА exercises ---
Выбери 3-5 наиболее актуальных раздела из предложенных ниже, опираясь на симптомы клиента:
• Когда накрывает тревога или сильное напряжение
• Когда накатывают импульсы и хочется сорваться
• Когда ощущается пустота, онемение или «дыра»
• Когда резко падает энергия и мотивация
• Когда съедает самокритика и чувство вины
• Когда трудно заснуть или просыпаешься разбитым
• Когда накатывает грусть или апатия без явной причины
• Когда трудно сосредоточиться или «туман» в голове
• Когда напряжены отношения или одиночество
(Сгенерируй объекты упражнений для выбранных разделов. Названия только на русском, без английских аббревиатур. Аббревиатуры вроде ACT, DBT разрешены только в поле therapy или source).

--- ДЛЯ КЛЮЧА outro ---
## 4. Простая ежедневная микро-рутина
(Составь супер-простой план на день с минимальным порогом входа. Раздели на: Утро, День, Вечер).

## 5. Рекомендуемое направление психотерапии
(Порекомендуй 1-2 направления психотерапии из списка: КПТ, ДБТ, ТПО, ТСС, Схема-терапия. Напиши почему оно подходит).

## 6. Напутствие
(Напиши 2-3 предложения мощной, теплой поддержки).
`;

    const userMessage = `Core Hypotheses: ${JSON.stringify(req.body.coreHypotheses || [])}\n\n${buildUserContext(req.body)}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = extractJSON(content);
    
    res.json({ 
      success: true, 
      intro: data.intro || '',
      exercises: data.exercises || [],
      outro: data.outro || ''
    });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [QUESTIONNAIRE] generate-tools failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ success: false, error: errMsg });
  }
});

/**
 * POST /api/generate-prep
 */
router.post('/generate-prep', async (req, res) => {
  try {
    console.log('📝 [QUESTIONNAIRE] Запрос на генерацию prep');
    
    const systemPrompt = `Ты — клинический психолог и медицинский консультант. В контексте переданы "coreHypotheses" и все ответы пациента. 
ВЕРНИ СТРОГО JSON с двумя ключами: psychiatristContent и psychologistContent.

{
  "psychiatristContent": "Markdown-текст для психиатра",
  "psychologistContent": "Markdown-текст для психолога"
}

СТРУКТУРА ДЛЯ "psychiatristContent" (Диагностика и назначение терапии):

# Подготовка к сеансу с психиатром (диагностика и назначение терапии)
*Как перевести свои чувства на язык врачей и получить максимум от визита*
*${new Date().toLocaleDateString('ru-RU')}*

*Этот документ создан, чтобы структурировать хаос внутри и помочь вам не растеряться в кабинете врача. Помните: задача психиатра — подобрать вам правильную поддержку (например, наладить сон или убрать острую тревогу), а не осудить. Вы имеете право подглядывать в этот текст и зачитывать свои жалобы с экрана.*

## 1. Ваши цели на этот визит
(На основе симптомов 1-3 главные задачи. Уточнение диагноза или подбор терапии. Например: "Понять, являются ли ваши симптомы следствием затяжного стресса или проявлением расстройства настроения...". Сформулируй эмпатично, в 1-3 предложениях).

## 2. Что взять с собой (Минимум)
(3-5 пунктов. Обязательно первым пунктом: "Откройте на телефоне или распечатайте «Документ для специалиста (Для Психиатра)» из вашего кабинета idenself — просто покажите его врачу, это сэкономит вам 20 минут объяснений").

## 3. Как описать свои симптомы (Самое важное)
(ЯДРО ДОКУМЕНТА. Выбери 3-8 самых ярких симптомов. Строгий формат:
**Название проблемы**
❌ Не говорите: [типичная размытая фраза, например "Мне просто плохо и грустно"]
✅ Скажите конкретно: [детальное описание с оценкой интенсивности от 1 до 10, указанием длительности, влияния на физиологию (сон/еда) и конкретных проявлений, взятых из анкеты клиента].
)

## 4. О чём ещё обязательно нужно упомянуть
(2-3 критичных факта для диагностики/лечения: хроника (астма и т.д.), ПАВ, зависимости, склонность к перееданию, работа).

## 5. Ваш чек-лист вопросов психиатру
(Ровно 4-5 персонализированных вопросов врачу. Всегда включай: "Как быстро я почувствую эффект и какие побочки нормальны в первые дни?").

## 6. Чего ожидать от приёма (Снимаем страхи)
(3-4 пункта, нормализующих визит: врач будет задавать странные вопросы (протокол), подбор таблеток может занять время — это нормально).


СТРУКТУРА ДЛЯ "psychologistContent" (Разговорная психотерапия):

# Подготовка к сеансу с психологом (разговорная психотерапия)
*Как сформулировать запрос, выбрать своего терапевта и начать работу над причиной*
*${new Date().toLocaleDateString('ru-RU')}*

*Психотерапия — это безопасное пространство и партнерская работа. Здесь нет правильных или неправильных ответов. Этот гид поможет вам занять активную позицию в терапии и сэкономить время на первых встречах.*

## 1. Ваш главный запрос на терапию
(Сформулируй 1-2 предложения, описывающих главную психологическую боль клиента: вырваться из цикла тревоги, научиться справляться с самокритикой, проработать травму и т.д. Если клиент уже был в терапии и она не помогла — укажи, что цель — пересмотреть формат работы).

## 2. Что взять с собой
(2-4 пункта. Обязательно первым пунктом: "Распечатанный или скачанный на телефон «Документ для специалиста (Для Психолога)» из кабинета idenself — отправьте его психологу до сессии или покажите на первой встрече").

## 3. С чего начать разговор (Как презентовать свой случай)
(Важнейший блок. Создай 3-5 пунктов в формате "❌ Не говорите / ✅ Скажите конкретно". Переведи бытовые жалобы в описание психологических механизмов и циклов.
Пример:
**О типичном срыве (цикле)**
❌ Не говорите: «Я транжира и много ем».
✅ Скажите конкретно: «Мой сценарий такой: мне становится скучно или тревожно -> я чувствую невыносимую пустоту -> чтобы её заполнить, я импульсивно трачу деньги или переедаю -> наступает временное облегчение, а затем сильная вина».
Создай такие блоки про эмоциональный фон, главную проблему и ожидания).

## 4. Чек-лист: Подходит ли вам этот психолог (Красные и зеленые флаги)
(Напиши 3-5 вопросов, которые клиент должен задать психологу. Для каждого пропиши "Зеленый флаг" (хороший ответ) и "Красный флаг" (плохой ответ).
Например:
**Вопрос:** «Вы работаете в методах с доказанной эффективностью (КПТ, DBT)? Мне нужны конкретные навыки саморегуляции».
**Зеленый флаг:** «Да, мы будем использовать структурированные протоколы для снижения импульсивности».
**Красный флаг:** «Я работаю интуитивно, в интегративном подходе...». (Вам сейчас нужна структура, а не интуиция).
Сгенерируй 3-5 таких вопросов).

## 5. Что можно подготовить заранее (Неочевидные вещи)
(Предложи ровно 3 креативных микро-задания, опираясь на анкету.
Например:
1. **Хит-парад внутреннего критика:** Выпишите 5 самых частых и злых фраз, которые вы говорите сами себе ("Ты хуже всех").
2. **Карта избеганий:** Запишите 3 вещи, места или ситуации, которых вы стали избегать.
3. **Список "костылей":** Что вы делаете прямо сейчас, чтобы стало легче, даже если это вредно (алкоголь, скроллинг)).

## 6. Чего ожидать от первых сессий
(Нормализуй процесс. 3 пункта: на первых встречах сбор информации; может стать эмоционально тяжело после сеанса (нормально, "хирургия души"); главное — честно говорить терапевту, если некомфортно или темп слишком быстрый).
`;

    const userMessage = `Core Hypotheses: ${JSON.stringify(req.body.coreHypotheses || [])}\n\n${buildUserContext(req.body)}`;
    const content = await callOpenAI(systemPrompt, userMessage, 0.5);
    const data = extractJSON(content);
    
    res.json({ 
      success: true, 
      psychiatristContent: data.psychiatristContent || '',
      psychologistContent: data.psychologistContent || ''
    });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [QUESTIONNAIRE] generate-prep failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ success: false, error: errMsg });
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

    console.log('[Transcribe] forwarding to OpenAI, size:', req.file.size, 'filename:', req.file.originalname || 'audio.webm');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: { 
        ...formData.getHeaders(), 
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}` 
      }
    });

    console.log('✅ [QUESTIONNAIRE] Транскрибация успешна');
    res.json({ success: true, text: response.data.text });
  } catch (error) {
    console.error('transcribe error:', error.message, JSON.stringify(error.response?.data || {}));
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export default router;
