import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, unlinkSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

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

    // Создаем клиент Google AI
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

    // Пробуем разные модели с fallback (начиная с Gemini 3.0 Pro)
    // Только проверенные модели, которые существуют в API v1
    const models = [
      'gemini-3.0-pro',           // Последняя версия 3.0 Pro (если существует)
      'gemini-2.5-pro',           // Последняя версия 2.5 Pro (fallback)
      'gemini-2.0-flash-exp',     // Экспериментальная 2.0
      'gemini-1.5-flash',         // Стабильная быстрая модель
      'gemini-1.5-flash-8b'       // Легкая модель
    ];
    
    let result;
    let lastError;
    
    for (const modelName of models) {
      try {
        console.log(`🤖 [${requestId}] Пробуем модель ${modelName}...`);
        console.log(`📊 [${requestId}] Количество частей в запросе: ${parts.length} (текст: ${parts.filter(p => p.text).length}, файлы: ${parts.filter(p => p.inlineData).length})`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            maxOutputTokens: 8192, // Увеличиваем лимит для больших ответов
          }
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
        console.error(`❌ Ошибка с ${modelName}:`, {
          message: modelError.message,
          status: modelError.status,
          statusText: modelError.statusText
        });
        lastError = modelError;
        // Продолжаем со следующей моделью
      }
    }
    
    // Если ни одна модель не сработала
    throw lastError || new Error('Все модели Gemini недоступны');

  } catch (error) {
    console.error('❌ Ошибка в чате:', error);
    
    // Проверяем, не отправлен ли уже ответ
    if (!res.headersSent) {
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

