/**
 * Извлекает первый валидный JSON-объект или массив из текста (markdown, префикс/суффикс от модели).
 * Учитывает вложенность скобок и строки с экранированием.
 */
export function extractJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('extractJSON: input must be a non-empty string');
  }

  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  let startIdx = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{') {
      startIdx = i;
      break;
    }
    if (cleaned[i] === '[') {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    throw new Error('extractJSON: no JSON object or array found');
  }

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
