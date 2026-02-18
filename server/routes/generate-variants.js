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
 * POST /api/generate-variants
 * Генерация 3 вариантов краткого описания состояния пользователя на основе жалобы
 *
 * Request body:
 * {
 *   "complaint": "Текст жалобы пользователя"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "variants": ["Вариант 1", "Вариант 2", "Вариант 3"]
 * }
 */
router.post('/generate-variants', async (req, res) => {
  try {
    console.log('📝 [GENERATE-VARIANTS] Запрос на генерацию вариантов');
    console.log('📋 [GENERATE-VARIANTS] Тело запроса:', JSON.stringify(req.body, null, 2));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY не установлен в переменных окружения');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o';

    const systemPrompt = 'Ты — ассистент психотерапевта. Пользователь описал жалобу. Сформулируй 3 варианта краткого описания его состояния. Верни массив JSON из 3 строк.';
    const userMessage = `Жалоба: ${req.body.complaint}`;

    console.log('🚀 [GENERATE-VARIANTS] Отправляем запрос к OpenAI API...');
    const startTime = Date.now();

    let response;
    try {
      response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_completion_tokens: 1024
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
    } catch (err) {
      if (err.response) {
        console.error('❌ [GENERATE-VARIANTS] Статус:', err.response.status);
        console.error('❌ [GENERATE-VARIANTS] Тело ответа:', JSON.stringify(err.response.data, null, 2));
        const message = err.response.data?.error?.message || JSON.stringify(err.response.data);
        throw new Error(`OpenAI API error (${err.response.status}): ${message}`);
      }
      throw err;
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ [GENERATE-VARIANTS] Время ответа OpenAI API: ${(elapsed / 1000).toFixed(2)}с`);

    const content = response.data.choices[0].message.content;
    console.log('📥 [GENERATE-VARIANTS] Ответ от OpenAI:', content.substring(0, 300));

    const variants = parseJSONFromResponse(content);

    console.log('✅ [GENERATE-VARIANTS] Сгенерировано вариантов:', Array.isArray(variants) ? variants.length : 0);

    res.json({
      success: true,
      variants: Array.isArray(variants) ? variants : []
    });

  } catch (error) {
    console.error('❌ [GENERATE-VARIANTS] Ошибка генерации вариантов:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка генерации вариантов'
    });
  }
});

export default router;
