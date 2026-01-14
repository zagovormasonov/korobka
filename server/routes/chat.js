import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, unlinkSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { sendErrorToTelegram } from '../utils/telegram-errors.js';

const router = express.Router();

// Создаем временную директорию для загрузок
const uploadDir = path.join(tmpdir(), 'chat-uploads');
try {
  mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.log('Директория для загрузок уже существует или создана:', uploadDir);
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Используем временную директорию системы
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB лимит (соответствует лимиту inline data в Gemini API)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WEBP) и PDF.'));
    }
  }
});

// Функция для конвертации файла в формат Gemini (inline data)
// Примечание: Текущая реализация использует inline data (base64) с лимитом ~20MB
// Для файлов больше 20MB можно использовать File API (до 2GB), но это требует
// дополнительной реализации с uploadFile() и управлением файлами
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: readFileSync(filePath).toString('base64'),
      mimeType
    }
  };
}

// Список доступных моделей (чтобы понять, как именно называется "nano banana pro" в вашем проекте)
router.get('/models', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY не установлен' });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const text = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: text });
    }

    const data = JSON.parse(text);
    const models = (data.models || []).map(m => ({
      name: m.name,
      displayName: m.displayName,
      supportedGenerationMethods: m.supportedGenerationMethods
    }));

    res.json({ success: true, models });
  } catch (error) {
    console.error('❌ [CHAT-MODELS] Ошибка получения списка моделей:', error);
    sendErrorToTelegram(error, { route: '/api/chat/models' }).catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// Режим генерации изображений ("nano banana pro"): 1 картинка + текст -> картинка
router.post('/image', upload.single('image'), async (req, res) => {
  const uploadedFiles = [];
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY не установлен' });
    }

    const prompt = (req.body?.prompt || '').toString();
    const imageFile = req.file;

    if (!prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Нужно указать промпт' });
    }

    // Изображение теперь опционально - можно генерировать только по текстовому промпту
    if (imageFile && !imageFile.mimetype?.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'В режиме генерации изображений можно загружать только изображения' });
    }

    if (imageFile) {
      uploadedFiles.push(imageFile.path);
    }

    // Nano Banana Pro (по вашему уточнению): gemini-3-pro-image-preview.
    // Важно: API ожидает формат "models/<id>", поэтому нормализуем значение.
    const rawModel = process.env.NANO_BANANA_PRO_MODEL || 'gemini-3-pro-image-preview';
    const modelName = rawModel.startsWith('models/') ? rawModel : `models/${rawModel}`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    const parts = [
      { text: prompt }
    ];
    
    // Добавляем изображение только если оно есть
    if (imageFile) {
      parts.push(fileToGenerativePart(imageFile.path, imageFile.mimetype));
    }

    const requestBody = {
      contents: [{ parts }]
      // Убрали maxOutputTokens - используем максимальные значения API по умолчанию
    };

    console.log(`🖼️ [${requestId}] Генерация изображения:`, {
      modelName,
      promptLen: prompt.length,
      hasImage: !!imageFile,
      mimeType: imageFile?.mimetype || 'нет',
      sizeMb: imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) : 'нет'
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    if (!response.ok) {
      // Пытаемся дать понятную ошибку (429/404/прочее)
      let errorJson;
      try { errorJson = JSON.parse(responseText); } catch { errorJson = { error: responseText }; }
      const msg = `v1beta API error: ${JSON.stringify(errorJson)}`;
      console.error(`❌ [${requestId}] Ошибка генерации изображения:`, response.status, msg);
      return res.status(response.status).json({
        success: false,
        error: msg,
        hint: 'Открой /api/chat/models и проверь точное имя модели для image generation. Затем задай NANO_BANANA_PRO_MODEL в Render.'
      });
    }

    let data;
    try { data = JSON.parse(responseText); } catch {
      return res.status(500).json({ success: false, error: 'Не удалось распарсить ответ модели' });
    }

    // Ищем image inlineData в parts ответа
    const partsOut = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = partsOut.find(p => p.inlineData?.mimeType?.startsWith('image/') && p.inlineData?.data);
    if (!imagePart) {
      console.error(`❌ [${requestId}] В ответе нет изображения. Ответ:`, JSON.stringify(data)?.substring(0, 800));
      return res.status(500).json({
        success: false,
        error: 'Модель не вернула изображение. Возможно, эта модель не поддерживает генерацию картинок через generateContent.'
      });
    }

    res.json({
      success: true,
      model: modelName,
      image: {
        mimeType: imagePart.inlineData.mimeType,
        data: imagePart.inlineData.data
      }
    });
  } catch (error) {
    console.error('❌ [CHAT-IMAGE] Ошибка:', error);
    sendErrorToTelegram(error, { route: '/api/chat/image', requestId }).catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  } finally {
    for (const filePath of uploadedFiles) {
      try {
        unlinkSync(filePath);
        console.log('🗑️ Файл удален:', filePath);
      } catch (err) {
        console.error('⚠️ Не удалось удалить файл:', filePath, err);
      }
    }
  }
});

// Роут для отправки сообщения в чат
router.post('/message', upload.array('files', 10), async (req, res) => {
  const uploadedFiles = [];
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  console.log(`\n🆕 [${requestId}] Новый запрос к чату`);
  
  try {
    const { message, history } = req.body;
    const files = req.files || [];
    
    console.log(`💬 [${requestId}] Запрос к чату:`, {
      message: message?.substring(0, 50),
      filesCount: files.length,
      hasHistory: !!history,
      historyLength: history ? (history === '[]' ? 0 : JSON.parse(history).length) : 0
    });

    if (!message && files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо отправить сообщение или прикрепить файл'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY не установлен в переменных окружения');
    }

    // Создаем клиент Google AI (для fallback моделей)
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Сохраняем пути загруженных файлов для последующего удаления
    uploadedFiles.push(...files.map(f => f.path));

    // Формируем части запроса
    const parts = [];
    
    // Добавляем системный промпт для отключения markdown
    const systemPrompt = "Ты - полезный AI-ассистент. Отвечай на русском языке простым текстом без использования markdown разметки (не используй символы #, *, **, - для списков и т.д.). Пиши ответы как обычный текст.";
    parts.push({ text: systemPrompt });
    
    // Добавляем текстовое сообщение пользователя
    if (message) {
      parts.push({ text: message });
    }

    // Добавляем файлы
    for (const file of files) {
      console.log(`📎 [${requestId}] Обрабатываем файл:`, {
        name: file.originalname,
        type: file.mimetype,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      });
      
      try {
        const filePart = fileToGenerativePart(file.path, file.mimetype);
        parts.push(filePart);
        console.log(`✅ [${requestId}] Файл успешно конвертирован в base64`);
      } catch (fileError) {
        console.error(`❌ [${requestId}] Ошибка обработки файла:`, fileError);
        throw new Error(`Ошибка обработки файла ${file.originalname}: ${fileError.message}`);
      }
    }

    // Пробуем разные модели с fallback (начиная с Gemini 3.0 Pro Preview)
    // Используем v1beta API для доступа к preview моделям
    const models = [
      'models/gemini-3-pro-preview', // Gemini 3.0 Pro (v1beta)
      'gemini-2.5-pro',              // Fallback на 2.5 Pro
      'gemini-2.0-flash-exp',        // Экспериментальная 2.0
      'gemini-1.5-flash',            // Стабильная быстрая модель
      'gemini-1.5-flash-8b'          // Легкая модель
    ];
    
    let result;
    let lastError;
    
    for (const modelName of models) {
      try {
        console.log(`🤖 [${requestId}] Пробуем модель ${modelName}...`);
        console.log(`📊 [${requestId}] Количество частей в запросе: ${parts.length} (текст: ${parts.filter(p => p.text).length}, файлы: ${parts.filter(p => p.inlineData).length})`);
        
        // Для preview моделей используем прямой вызов v1beta API
        if (modelName === 'models/gemini-3-pro-preview') {
          console.log(`🔧 [${requestId}] Используем v1beta API для preview модели`);
          
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
          
          const requestBody = {
            contents: [{
              parts: parts
            }]
            // Убрали maxOutputTokens - используем максимальные значения API по умолчанию
          };
          
          // Если есть история, добавляем её
          if (history && history !== '[]' && history !== '') {
            let parsedHistory;
            try {
              parsedHistory = JSON.parse(history);
            } catch (parseError) {
              console.error('❌ Ошибка парсинга истории:', parseError);
              parsedHistory = [];
            }
            
            if (parsedHistory.length > 0) {
              requestBody.contents = parsedHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              }));
              requestBody.contents.push({ parts: parts });
            }
          }
          
          console.log('🚀 Отправляем запрос к v1beta API...');
          const startTime = Date.now();
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          
          const elapsed = Date.now() - startTime;
          console.log(`⏱️ Время ответа v1beta API: ${(elapsed / 1000).toFixed(2)}с`);
          
          if (!response.ok) {
            const errorData = await response.json();
            
            // Обработка ошибки 429 (Rate Limit Exceeded)
            if (response.status === 429) {
              const retryAfter = response.headers.get('Retry-After');
              const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // По умолчанию 5 секунд
              
              console.warn(`⚠️ [${requestId}] Превышен лимит запросов (429) для ${modelName}. Retry-After: ${retryAfter || 'не указан'}`);
              console.warn(`⏳ [${requestId}] Пробуем следующую модель или ждем ${waitTime / 1000}с...`);
              
              // Если это первая модель (gemini-3-pro-preview), пробуем следующую без задержки
              // Если это последняя модель, пробуем retry с задержкой
              if (models.indexOf(modelName) === 0) {
                // Это первая модель, просто пробуем следующую
                throw new Error(`Rate limit exceeded for ${modelName}, trying next model`);
              } else {
                // Это не первая модель, пробуем retry с задержкой
                await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 10000))); // Максимум 10 секунд
                throw new Error(`Rate limit exceeded for ${modelName}, retry after delay`);
              }
            }
            
            throw new Error(`v1beta API error: ${JSON.stringify(errorData)}`);
          }
          
          const data = await response.json();
          const text = data.candidates[0].content.parts[0].text;
          
          console.log(`✅ [${requestId}] Ответ получен от ${modelName}, длина:`, text.length, 'символов');
          
          if (res.headersSent) {
            console.error(`⚠️ [${requestId}] Заголовки уже отправлены! Пропускаем отправку ответа.`);
            return;
          }
          
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.status(200).json({
            success: true,
            response: text,
            model: modelName
          });
          
          console.log(`📤 [${requestId}] JSON ответ отправлен клиенту успешно`);
          return;
        }
        
        // Для остальных моделей используем обычный SDK
        const model = genAI.getGenerativeModel({ 
          model: modelName
          // Убрали maxOutputTokens - используем максимальные значения API по умолчанию
        });
        
        // Если есть история, создаем чат с контекстом
        if (history && history !== '[]' && history !== '') {
          let parsedHistory;
          try {
            parsedHistory = JSON.parse(history);
          } catch (parseError) {
            console.error('❌ Ошибка парсинга истории:', parseError);
            // Если не можем распарсить историю, просто игнорируем её
            parsedHistory = [];
          }
          
          if (parsedHistory.length > 0) {
            console.log('🔄 Создаем чат с контекстом истории');
            const chat = model.startChat({
              history: parsedHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              }))
            });
            
            console.log('🚀 Отправляем сообщение с контекстом...');
            const startTime = Date.now();
            result = await chat.sendMessage(parts);
            const elapsed = Date.now() - startTime;
            console.log(`⏱️ Время ответа Gemini с историей: ${(elapsed / 1000).toFixed(2)}с`);
          } else {
            // Если история пустая, генерируем как обычно
            console.log('🚀 Отправляем запрос без истории...');
            const startTime = Date.now();
            result = await model.generateContent(parts);
            const elapsed = Date.now() - startTime;
            console.log(`⏱️ Время ответа Gemini: ${(elapsed / 1000).toFixed(2)}с`);
          }
        } else {
          // Без истории - просто генерируем ответ
          console.log('🚀 Отправляем запрос к Gemini API...');
          const startTime = Date.now();
          result = await model.generateContent(parts);
          const elapsed = Date.now() - startTime;
          console.log(`⏱️ Время ответа Gemini: ${(elapsed / 1000).toFixed(2)}с`);
        }
        
        console.log('📦 Получаем ответ...');
        const response = await result.response;
        console.log('📝 Извлекаем текст...');
        const text = response.text();

        console.log(`✅ [${requestId}] Ответ получен от ${modelName}, длина:`, text.length, 'символов');

        // Проверяем, не был ли уже отправлен ответ
        if (res.headersSent) {
          console.error(`⚠️ [${requestId}] Заголовки уже отправлены! Пропускаем отправку ответа.`);
          return;
        }

        // Явно устанавливаем заголовки перед отправкой
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json({
          success: true,
          response: text,
          model: modelName
        });
        
        console.log(`📤 [${requestId}] JSON ответ отправлен клиенту успешно`);
        return; // Явный return чтобы не продолжать выполнение
        
      } catch (modelError) {
        // Проверяем, является ли ошибка 429 (Rate Limit)
        const isRateLimit = modelError.message?.includes('429') || 
                           modelError.message?.includes('RESOURCE_EXHAUSTED') ||
                           modelError.message?.includes('Rate limit exceeded') ||
                           modelError.status === 429;
        
        if (isRateLimit) {
          console.warn(`⚠️ [${requestId}] Превышен лимит запросов (429) для ${modelName}`);
          console.warn(`🔄 [${requestId}] Пробуем следующую модель...`);
        } else {
          console.error(`❌ Ошибка с ${modelName}:`, {
            message: modelError.message,
            status: modelError.status,
            statusText: modelError.statusText
          });
        }
        lastError = modelError;
        // Продолжаем со следующей моделью
      }
    }
    
    // Если ни одна модель не сработала
    throw lastError || new Error('Все модели Gemini недоступны');

  } catch (error) {
    console.error('❌ Ошибка в чате:', error);
    
    // Проверяем, является ли ошибка 429 (Rate Limit)
    const isRateLimit = error.message?.includes('429') || 
                       error.message?.includes('RESOURCE_EXHAUSTED') ||
                       error.message?.includes('Rate limit exceeded');
    
    // Отправляем ошибку в Telegram (включая 429)
    sendErrorToTelegram(error, {
      route: '/api/chat/message',
      requestId: requestId,
      message: message?.substring(0, 100),
      filesCount: files?.length || 0,
      isRateLimit: isRateLimit
    }).catch(err => {
      console.error('❌ Не удалось отправить ошибку в Telegram:', err);
    });
    
    // Проверяем, не отправлен ли уже ответ
    if (!res.headersSent) {
      if (isRateLimit) {
        return res.status(429).json({
          success: false,
          error: 'Превышен лимит запросов к AI. Пожалуйста, подождите немного и попробуйте снова через несколько секунд.',
          retryAfter: 10 // Рекомендуем повторить через 10 секунд
        });
      }
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Произошла ошибка при обработке запроса'
      });
    }
  } finally {
    // Удаляем загруженные файлы
    for (const filePath of uploadedFiles) {
      try {
        unlinkSync(filePath);
        console.log('🗑️ Файл удален:', filePath);
      } catch (err) {
        console.error('⚠️ Не удалось удалить файл:', filePath, err);
      }
    }
  }
});

// Middleware для обработки ошибок multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ Ошибка загрузки файла:', error);
    return res.status(400).json({
      success: false,
      error: `Ошибка загрузки файла: ${error.message}`
    });
  } else if (error) {
    console.error('❌ Общая ошибка:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Произошла ошибка'
    });
  }
  next();
});

export default router;

