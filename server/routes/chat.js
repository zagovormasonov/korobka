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
    fileSize: 20 * 1024 * 1024 // 20MB лимит
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

// Функция для конвертации файла в formат Gemini
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
  
  try {
    const { message, history } = req.body;
    const files = req.files || [];
    
    console.log('💬 Запрос к чату:', {
      message: message?.substring(0, 50) + '...',
      filesCount: files.length,
      historyLength: history ? JSON.parse(history).length : 0
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
    
    // Добавляем текстовое сообщение
    if (message) {
      parts.push({ text: message });
    }

    // Добавляем файлы
    for (const file of files) {
      console.log('📎 Обрабатываем файл:', file.originalname, file.mimetype);
      const filePart = fileToGenerativePart(file.path, file.mimetype);
      parts.push(filePart);
    }

    // Пробуем разные модели с fallback (начиная с Gemini 2.5 Pro)
    const models = [
      'gemini-2.5-pro',           // Последняя версия 2.5 Pro
      'gemini-1.5-pro-latest',    // Стабильная 1.5 Pro (последняя версия)
      'gemini-1.5-pro',           // Стабильная 1.5 Pro
      'gemini-1.5-flash',         // Быстрая модель
      'gemini-pro'                // Старая стабильная
    ];
    
    let result;
    let lastError;
    
    for (const modelName of models) {
      try {
        console.log(`🤖 Пробуем модель ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Если есть история, создаем чат с контекстом
        if (history && history !== '[]') {
          const parsedHistory = JSON.parse(history);
          const chat = model.startChat({
            history: parsedHistory.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            }))
          });
          
          result = await chat.sendMessage(parts);
        } else {
          // Без истории - просто генерируем ответ
          result = await model.generateContent(parts);
        }
        
        const response = await result.response;
        const text = response.text();

        console.log(`✅ Ответ получен от ${modelName}, длина:`, text.length);

        return res.json({
          success: true,
          response: text,
          model: modelName
        });
        
      } catch (modelError) {
        console.error(`❌ Ошибка с ${modelName}:`, modelError.message);
        lastError = modelError;
        // Продолжаем со следующей моделью
      }
    }
    
    // Если ни одна модель не сработала
    throw lastError || new Error('Все модели Gemini недоступны');

  } catch (error) {
    console.error('❌ Ошибка в чате:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Произошла ошибка при обработке запроса'
    });
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

export default router;

