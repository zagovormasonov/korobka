import express from 'express';
import { extractJSON } from '../utils/extractJSON.js';

const router = express.Router();

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

async function callGemini(systemPrompt, userMessage, temperature = 0.4) {
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

  console.log(`🤖 [MEDITATION] model=${GEMINI_MODEL}, temp=${temperature}, promptLen=${(systemPrompt + userMessage).length}`);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [MEDITATION] Gemini API error ${response.status}:`, errorText.slice(0, 500));
    throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini вернул пустой ответ');
  return text;
}

// POST /api/meditation/generate-text
router.post('/generate-text', async (req, res) => {
  try {
    const { dataset } = req.body;
    console.log('📥 [MEDITATION] generate-text, hasDataset:', !!dataset);

    const systemPrompt = `Ты — опытный психолог и автор медитативных практик. Напиши персональную
аудиомедитацию для пользователя на основе его долгосрочного датасета.

ЦЕЛИ МЕДИТАЦИИ:
- Снижение тревоги и напряжения
- Развитие навыков осознанности
- Укрепление ресурсов и внутренних сильных сторон
- Поддержка в переживании сложных эмоций

=== ПАУЗЫ ===

В медитации ОБЯЗАТЕЛЬНО используй паузы для дыхательных практик и визуализаций.
Формат паузы: <#1.5#> где 1.5 = полторы секунды (можно 0.5, 1, 1.5, 2, 2.5, 3 и т.д.)

Пример использования:
"Сядьте удобно, закройте глаза<#1.5#>. Сделайте глубокий вдох<#1#>, и медленный выдох<#2#>.
Представьте место, где вам спокойно<#3#>..."

=== ОГРАНИЧЕНИЕ НА КОЛИЧЕСТВО СИМВОЛОВ ===

ОБЩЕЕ ограничение: до 1500 символов.
ВНИМАНИЕ: символы паузы <#X#> полностью учитываются в этот лимит!
Пример: "<#3#>" — это 6 символов, которые занимают 3 секунды озвучки.

РАСЧЁТ: примерно 2.5 символа на секунду озвучки. Если текст без пауз ~1200 символов,
можно добавить пауз на ~300 символов (это примерно 60-90 секунд пауз).

=== СТРУКТУРА МЕДИТАЦИИ (СВОБОДНАЯ) ===

НЕ используй жёсткую структуру типа "5 минут — сделайте вдох... выдох...".
Вместо этого создай СВОБОДНУЮ медитацию, которая:

1. Учитывает ЦЕЛИ ПОЛЬЗОВАТЕЛЯ из dataset.tracker.goals и dataset.tracker.goalsText:
   - Если цель "снизить тревожность" — работай с телесными ощущениями напряжения,
     дыхательными практиками, визуализацией безопасного пространства
   - Если цель "наладить сон" — работай с ритуалом отхода ко сну,
     расслаблением тела по частям, успокоением мыслей
   - Если цель "улучшить отношения" — работай с визуализацией связей,
     посланиями самому себе, принятием
   - Если цель "справиться с конкретной ситуацией" — адаптируй контент
     к эмоциям и контексту ситуации

2. Использует данные из DATASET:
   - Симптомы из diagnostics → если есть тревога, бессонница, раздражительность —
     адаптируй технику
   - Паттерны из checkins → если человек ложится поздно, работает по ночам —
     учитывай его ритм
   - Feedback от Луми → если были инсайты про паттерны — можешь мягко их упомянуть

3. Структура (НЕ жёсткая, а как примерное направление):
   - Мягкое введение (15-20 сек) — приглашение расслабиться, настроиться
   - Основная часть (1-2 мин) — работа с главной темой, выбранной с учётом целей
   - Телесная часть (20-30 сек) — дыхание, расслабление или заземление
   - Ресурсная часть (15-20 сек) — визуализация своих сильных сторон, ресурсов
   - Мягкое завершение (10-15 сек) — возврат в реальность, напутствие

4. ВАЖНО:
   - ПАУЗЫ ОБЯЗАТЕЛЬНЫ после каждой фразы-инструкции
   - НЕ упоминай конкретные дедлайны, стрессовые события, имена людей
   - НЕ давай советов типа "завтра сделай то-то"
   - Текст должен быть на русском, звучать естественно при чтении вслух
   - Избегай длинных предложений — короткие фразы лучше для озвучки
   - ОБЩАЯ длина: до 1500 символов (включая паузы!)
   - После каждой фразы-инструкции ("сделайте вдох", "представьте", "направьте внимание") СТАВЬ паузу <#1.5#>, <#2#>, <#3#>

5. ТЕХНИКИ с паузами:
   - Дыхание 4-7-8 или квадратное дыхание — паузы после каждого шага
   - Body scan — частые паузы <#1.5#>
   - Визуализация безопасного места — длинные паузы <#3#>
   - Заземление (5-4-3-2-1) — паузы после каждого числа
   - Работа с внутренним критиком (мягкое)
   - Самосострадание (самоcompassion)
   - Напоминание о ценности и ресурсах

Верни СТРОГО JSON:
{ "text": "полный текст медитации с паузами <#X#>" }`;

    const userMessage = JSON.stringify({ dataset });

    const raw = await callGemini(systemPrompt, userMessage, 0.4);
    const parsed = extractJSON(raw);
    const text = parsed.text || '';

    console.log('✅ [MEDITATION] generate-text success, textLen:', text.length);
    res.json({ text });
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [MEDITATION] generate-text failed: ${errMsg}`, error?.stack || '');
    res.status(500).json({ error: 'Failed to generate meditation text', details: errMsg });
  }
});

export default router;
