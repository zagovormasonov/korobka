import express from 'express';
import axios from 'axios';
import { supabase } from '../index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { constants } from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Получаем __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Функция для создания конфигурации axios с прокси
function createAxiosConfig() {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Отключаем прокси если указано
  if (process.env.DISABLE_PROXY === 'true') {
    console.log('⚠️ Прокси отключен (DISABLE_PROXY=true), подключение напрямую к Gemini API');
    return config;
  }

  // Добавляем прокси если настроен
  if (process.env.PROXY_HOST && process.env.PROXY_PORT) {
    console.log('🌐 Настройка прокси для Gemini API:', {
      host: process.env.PROXY_HOST,
      port: process.env.PROXY_PORT,
      protocol: process.env.PROXY_PROTOCOL || 'http',
      auth: process.env.PROXY_USERNAME ? 'да' : 'нет'
    });

    // Создаем URL прокси
    let proxyUrl = `${process.env.PROXY_PROTOCOL || 'http'}://`;
    
    if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
      proxyUrl += `${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@`;
    }
    
    proxyUrl += `${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
    
    console.log('🔗 Proxy URL:', proxyUrl.replace(/:[^:]*@/, ':***@')); // Скрываем пароль в логах
    
    // Пробуем разные типы прокси
    try {
      // Сначала пробуем SOCKS5 прокси
      if (process.env.PROXY_TYPE === 'socks5') {
        console.log('🔧 Используем SOCKS5 прокси...');
        const socksProxyUrl = `socks5://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
        config.httpsAgent = new SocksProxyAgent(socksProxyUrl, {
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined,
          // Дополнительные настройки для стабильности
          timeout: 30000,
          keepAlive: true
        });
        console.log('✅ SOCKS5 прокси создан успешно');
      } else {
        // Используем HTTP прокси
        console.log('🔧 Используем HTTP прокси...');
        config.httpsAgent = new HttpsProxyAgent(proxyUrl, {
          // Полностью отключаем проверку SSL сертификата для прокси
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined, // Отключаем проверку hostname
          // Дополнительные опции для обхода проблем с SSL
          secureProtocol: 'TLSv1_2_method',
          ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384',
          // Дополнительные опции для обхода проблем с сертификатами
          servername: 'generativelanguage.googleapis.com',
          // Дополнительные опции для стабильного соединения
          keepAlive: true,
          timeout: 30000,
          // Отключаем проверку сертификата прокси
          secureOptions: constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3
        });
        console.log('✅ HTTP прокси создан успешно');
      }
      config.timeout = 30000;
    } catch (proxyError) {
      console.error('❌ Ошибка создания прокси агента для Gemini API:', proxyError.message);
    }
  } else {
    console.log('🌐 Прокси не настроен, подключение напрямую к Gemini API');
  }

  return config;
}

// Функция для вызова Gemini API через официальный SDK
async function callGeminiAI(prompt, maxTokens = null) {
  // Параметр maxTokens больше не используется - API использует максимальные значения по умолчанию
  let responseData = null; // Сохраняем для уведомлений об ошибках
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY не установлен в переменных окружения');
    }
    
    console.log('🔬 Вызываем Gemini API через официальный SDK...');
    console.log('📝 Длина промпта:', prompt.length, 'символов');
    console.log('🔑 API Key установлен:', apiKey ? 'да' : 'нет');
    console.log('🔑 API Key первые 10 символов:', apiKey ? apiKey.substring(0, 10) + '...' : 'НЕТ');
    
    // Настраиваем прокси для Google AI SDK
    if (process.env.PROXY_HOST && process.env.PROXY_PORT && process.env.DISABLE_PROXY !== 'true') {
      console.log('🌐 Настраиваем прокси для Google AI SDK...');
      
      // Устанавливаем переменные окружения для прокси
      if (process.env.PROXY_TYPE === 'socks5') {
        process.env.HTTP_PROXY = `socks5://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
        process.env.HTTPS_PROXY = `socks5://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
      } else {
        process.env.HTTP_PROXY = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
        process.env.HTTPS_PROXY = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
      }
      
      console.log('✅ Прокси настроен для Google AI SDK');
    } else {
      console.log('🌐 Прокси отключен, используем прямое подключение');
    }
    
    // Используем Gemini 3.0 Pro через v1beta API (как в chat.js)
    console.log('🔧 Используем Gemini 3.0 Pro через v1beta API...');
    const modelName = 'models/gemini-3-pro-preview';
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }]
      // Убрали maxOutputTokens - используем максимальные значения API по умолчанию
    };
    
    console.log('🚀 Отправляем запрос к v1beta API...');
    console.log('⏱️ Время начала:', new Date().toISOString());
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📥 [GEMINI-3.0] Статус ответа от v1beta API:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      // Обработка ошибки 429 (Rate Limit Exceeded)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // По умолчанию 5 секунд
        
        console.warn(`⚠️ [GEMINI-3.0] Превышен лимит запросов (429). Retry-After: ${retryAfter || 'не указан'}`);
        console.warn(`⏳ [GEMINI-3.0] Ждем ${waitTime / 1000}с перед retry...`);
        
        // Ждем перед повторной попыткой (максимум 10 секунд)
        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 10000)));
        
        // Пробуем еще раз (только один retry)
        console.log('🔄 [GEMINI-3.0] Повторная попытка после задержки...');
        const retryResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          let retryErrorData;
          try {
            retryErrorData = JSON.parse(retryErrorText);
          } catch (e) {
            retryErrorData = { error: retryErrorText };
          }
          console.error('❌ [GEMINI-3.0] Повторная попытка также не удалась:', retryResponse.status, JSON.stringify(retryErrorData));
          throw new Error(`v1beta API error (${retryResponse.status}): Превышен лимит запросов. Попробуйте позже.`);
        }
        
        // Если retry успешен, продолжаем обработку
        const retryData = await retryResponse.json();
        if (!retryData.candidates || !Array.isArray(retryData.candidates) || retryData.candidates.length === 0 ||
            !retryData.candidates[0].content || !retryData.candidates[0].content.parts ||
            !Array.isArray(retryData.candidates[0].content.parts) || retryData.candidates[0].content.parts.length === 0 ||
            !retryData.candidates[0].content.parts[0].text) {
          console.error('❌ [GEMINI-3.0] Неожиданная структура ответа от v1beta API после retry:', JSON.stringify(retryData));
          throw new Error('Неожиданная структура ответа от Gemini 3.0 Pro v1beta API');
        }
        const text = retryData.candidates[0].content.parts[0].text;
        console.log('✅ [GEMINI-3.0] Retry успешен, получен ответ, длина:', text.length);
        return text;
      }
      
      console.error('❌ [GEMINI-3.0] v1beta API вернул ошибку:', response.status, JSON.stringify(errorData));
      throw new Error(`v1beta API error (${response.status}): ${JSON.stringify(errorData)}`);
    }
    
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
      responseData = data; // Сохраняем для возможных уведомлений
    } catch (parseError) {
      console.error('❌ [GEMINI-3.0] Ошибка парсинга JSON ответа:', parseError);
      console.error('❌ [GEMINI-3.0] Текст ответа (первые 500 символов):', responseText.substring(0, 500));
      throw new Error(`Failed to parse v1beta API response: ${parseError.message}`);
    }
    console.log('📥 [GEMINI-3.0] Получен ответ от v1beta API, структура:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0,
      hasError: !!data.error
    });
    
    // Проверяем наличие candidates и обработываем возможные ошибки
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('❌ [GEMINI-3.0] Нет candidates в ответе:', JSON.stringify(data, null, 2));
      throw new Error(`v1beta API returned no candidates: ${JSON.stringify(data)}`);
    }
    
    const candidate = data.candidates[0];
    
    // КРИТИЧЕСКИ ВАЖНО: Проверяем finishReason ПЕРЕД проверкой content
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ [GEMINI-3.0] Ответ обрезан из-за MAX_TOKENS, finishReason:', candidate.finishReason);
      
      // Если есть частичный контент, используем его
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const partialText = candidate.content.parts[0].text;
        if (partialText) {
          console.warn('⚠️ [GEMINI-3.0] Используем частичный ответ (обрезан), длина:', partialText.length);
          console.warn('⚠️ [GEMINI-3.0] Ответ был обрезан, но частичный контент используется');
          return partialText;
        }
      }
      
      // Если контента нет - это критическая ошибка
      console.error('❌ [GEMINI-3.0] MAX_TOKENS но нет контента! Структура:', JSON.stringify(candidate, null, 2));
      throw new Error(`v1beta API returned MAX_TOKENS with empty content. API использует максимальные значения по умолчанию.`);
    }
    
    // Проверяем другие finishReason (SAFETY, RECITATION и т.д.)
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      console.warn(`⚠️ [GEMINI-3.0] Неожиданный finishReason: ${candidate.finishReason}`);
    }
    
    // Проверяем наличие content и parts
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('❌ [GEMINI-3.0] Нет content.parts в ответе:', JSON.stringify(candidate, null, 2));
      throw new Error(`v1beta API returned invalid candidate structure: ${JSON.stringify(candidate)}`);
    }
    
    const text = candidate.content.parts[0].text;
    
    if (!text) {
      console.error('❌ [GEMINI-3.0] Нет text в ответе:', JSON.stringify(candidate.content.parts[0], null, 2));
      throw new Error(`v1beta API returned no text in response`);
    }
    
    console.log('✅ Gemini 3.0 Pro ответ получен через v1beta API, длина:', text.length, 'символов');
    console.log('⏱️ Время окончания:', new Date().toISOString());
    return text;
    
  } catch (error) {
    console.error('❌ Ошибка Gemini API через SDK:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    // КРИТИЧЕСКОЕ: Отправляем уведомление в Telegram для критических ошибок
    if (error.message.includes('MAX_TOKENS') || 
        error.message.includes('invalid candidate structure') ||
        error.message.includes('no candidates')) {
      try {
        const { sendErrorToTelegram } = await import('../utils/telegram-errors.js');
        await sendErrorToTelegram(error, {
          route: 'callGeminiAI',
          promptLength: prompt?.length || 0,
          maxTokens: 'не используется (API использует максимальные значения)',
          finishReason: responseData?.candidates?.[0]?.finishReason || 'unknown'
        });
        console.log('📢 [GEMINI-3.0] Критическая ошибка отправлена в Telegram');
      } catch (notifError) {
        console.error('❌ Не удалось отправить уведомление в Telegram:', notifError);
      }
    }
    
    // Проверяем, если ошибка связана с неверной моделью
    if (error.message.includes('model') || error.message.includes('not found') || error.message.includes('Invalid')) {
      console.log('⚠️ Возможно, проблема с именем модели. Пробуем альтернативные модели...');
      
      // Список альтернативных моделей для попытки (от новых к старым)
      const alternativeModels = [
        'gemini-1.5-pro-latest',  // Стабильная 1.5 Pro (последняя версия)
        'gemini-1.5-pro',         // Стабильная 1.5 Pro
        'gemini-1.5-flash',       // Быстрая 1.5
        'gemini-pro',             // Старая стабильная
        'gemini-1.0-pro'          // Совсем старая
      ];
      
      for (const modelName of alternativeModels) {
        try {
          console.log(`🔄 Пробуем модель ${modelName}...`);
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          console.log(`✅ Gemini API ответ получен с ${modelName}, длина:`, text.length, 'символов');
          return text;
        } catch (modelError) {
          console.error(`❌ Ошибка с ${modelName}:`, modelError.message);
          // Продолжаем со следующей моделью
        }
      }
    }
    
    // Если ошибка связана с прокси или сетью, попробуем без прокси
    if (error.message.includes('proxy') || error.message.includes('timeout') || 
        error.message.includes('network') || error.message.includes('connection') ||
        error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.log('🔄 Пробуем без прокси через SDK...');
      
      // Очищаем переменные прокси
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      
      // Пробуем альтернативные модели без прокси
      const fallbackModels = ['gemini-1.5-pro-latest', 'gemini-1.5-pro', 'gemini-pro'];
      
      for (const modelName of fallbackModels) {
        try {
          console.log(`🔄 Пробуем ${modelName} без прокси...`);
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          console.log(`✅ Gemini API ответ получен с ${modelName} без прокси, длина:`, text.length, 'символов');
          return text;
        } catch (fallbackError) {
          console.error(`❌ Ошибка с ${modelName} без прокси:`, fallbackError.message);
          // Продолжаем со следующей моделью
        }
      }
    }
    
    // Возвращаем заглушку если API недоступен
    console.log('⚠️ Все попытки не удались, возвращаем заглушку');
    return 'Извините, сервис временно недоступен. Попробуйте позже.';
  }
}

// Генерировать сообщение от маскота для лендинга оплаты
router.post('/mascot-message/payment', async (req, res) => {
  try {
    console.log('🤖 Запрос на генерацию сообщения маскота:', req.body);
    
    const { sessionId } = req.body;
    
    if (!sessionId) {
      console.error('❌ Отсутствует sessionId');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    
    // Получаем результаты теста
    const { data: testResult, error } = await supabase
      .from('primary_test_results')
      .select('answers')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error || !testResult) {
      console.log('❌ [PAYMENT MASCOT] Результаты теста не найдены:', { sessionId, error });
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    const answers = testResult.answers;
    
    const prompt = `Проведи глубокое исследование результатов психологического теста и создай персонализированное поддерживающее сообщение.

ИССЛЕДОВАТЕЛЬСКАЯ ЗАДАЧА:
Проанализируй результаты теста на психическое здоровье и выяви ключевые паттерны в ответах пользователя.

ДАННЫЕ ДЛЯ АНАЛИЗА:
${JSON.stringify(answers)}

ИССЛЕДОВАТЕЛЬСКИЕ ВОПРОСЫ:
1. Какие эмоциональные состояния преобладают в ответах?
2. Какие области требуют особого внимания?
3. Какие сильные стороны можно выделить?
4. Какие паттерны поведения прослеживаются?

ТРЕБОВАНИЯ К РЕЗУЛЬТАТУ:
- Создай поддерживающее сообщение от маскота Луми
- Используй конкретные данные из анализа
- Сообщение должно быть кратким (2-3 предложения)
- Укажи важность персонального плана
- На русском языке
- Прояви эмпатию и понимание

ФОРМАТ ОТВЕТА: Только текст сообщения, без дополнительных объяснений.`;

    const message = await callGeminiAI(prompt);
    
    // Генерируем рекомендуемые тесты для payment страницы
    const recommendedTests = await analyzeAndRecommendTests(answers);
    
    // Проверяем, что recommendedTests - массив
    if (!Array.isArray(recommendedTests)) {
      console.error('❌ [AI] recommendedTests не является массивом:', recommendedTests);
      // Используем пустой массив как fallback
      const fallbackTests = [];
      
      // Сохраняем только сообщение без тестов
      const { error: updateError } = await supabase
        .from('primary_test_results')
        .update({ 
          lumi_dashboard_message: message
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('⚠️ [MASCOT-MESSAGE] Ошибка при сохранении сообщения:', updateError);
      }
      
      return res.json({ success: true, message, recommendedTests: fallbackTests, cached: false });
    }
    
    // Сохраняем сгенерированное сообщение и список тестов в БД
    console.log('💾 [MASCOT-MESSAGE] Сохраняем сообщение Луми и список тестов в БД...');
    const { error: updateError } = await supabase
      .from('primary_test_results')
      .update({ 
        lumi_dashboard_message: message,
        recommended_tests: recommendedTests
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('⚠️ [MASCOT-MESSAGE] Ошибка при сохранении сообщения и тестов:', updateError);
    } else {
      console.log('✅ [MASCOT-MESSAGE] Сообщение Луми и список тестов успешно сохранены в БД');
    }
    
    res.json({ success: true, message, recommendedTests, cached: false });
  } catch (error) {
    console.error('❌ Ошибка генерации сообщения маскота:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Генерировать сообщение от маскота для дашборда
router.post('/mascot-message/dashboard', async (req, res) => {
  try {
    console.log('🤖 Запрос на генерацию сообщения маскота для dashboard:', req.body);
    
    const { sessionId } = req.body;
    
    if (!sessionId) {
      console.error('❌ Отсутствует sessionId');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем результаты первичного теста
    console.log('🔍 [MASCOT-MESSAGE] Получаем данные из БД для sessionId:', sessionId);
    const { data: primaryTest, error } = await supabase
      .from('primary_test_results')
      .select('answers, email, lumi_dashboard_message, recommended_tests')
      .eq('session_id', sessionId)
      .maybeSingle();

    console.log('📊 [MASCOT-MESSAGE] Результат запроса к БД:', {
      hasData: !!primaryTest,
      hasError: !!error,
      errorMessage: error?.message,
      hasLumiMessage: !!primaryTest?.lumi_dashboard_message,
      hasRecommendedTests: !!primaryTest?.recommended_tests,
      lumiMessageLength: primaryTest?.lumi_dashboard_message?.length || 0,
      testsCount: primaryTest?.recommended_tests?.length || 0
    });

    console.log('🔍 Результаты теста из БД:', primaryTest);
    console.log('🔍 Есть ли ответы (answers)?', !!primaryTest?.answers);
    console.log('🔍 Тип answers:', typeof primaryTest?.answers);
    console.log('🔍 Ошибка Supabase:', error);

    if (error || !primaryTest) {
      console.log('❌ Результаты теста не найдены для sessionId:', sessionId);
      console.log('❌ Код ошибки Supabase:', error?.code);
      console.log('❌ Сообщение ошибки:', error?.message);
      console.log('❌ Детали ошибки:', error?.details);
      
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    // Проверяем кэш - есть ли уже сохраненное сообщение и список тестов
    if (primaryTest.lumi_dashboard_message && primaryTest.recommended_tests) {
      console.log('💾 [MASCOT-MESSAGE] Найдено сохраненное сообщение Луми и список тестов, возвращаем их');
      
      return res.json({ 
        success: true, 
        message: primaryTest.lumi_dashboard_message,
        recommendedTests: primaryTest.recommended_tests,
        cached: true 
      });
    }

    // Если есть только сообщение, но нет тестов - генерируем тесты заново
    if (primaryTest.lumi_dashboard_message && !primaryTest.recommended_tests) {
      console.log('💾 [MASCOT-MESSAGE] Найдено сообщение Луми, но нет тестов - генерируем тесты');
      const answers = primaryTest.answers;
      const recommendedTests = await analyzeAndRecommendTests(answers);
      
      // Сохраняем тесты в БД
      const { error: updateError } = await supabase
        .from('primary_test_results')
        .update({ recommended_tests: recommendedTests })
        .eq('session_id', sessionId);
      
      if (updateError) {
        console.error('⚠️ [MASCOT-MESSAGE] Ошибка при сохранении тестов:', updateError);
      }
      
      return res.json({ 
        success: true, 
        message: primaryTest.lumi_dashboard_message,
        recommendedTests: recommendedTests,
        cached: true 
      });
    }

    // Проверяем наличие ответов теста
    if (!primaryTest.answers || (Array.isArray(primaryTest.answers) && primaryTest.answers.length === 0)) {
      console.log('⚠️ Ответы теста отсутствуют или пусты для sessionId:', sessionId);
      
      // Возвращаем дружелюбное сообщение без генерации через AI
      const defaultMessage = 'Привет! Я Луми, твой помощник в создании персонального плана психологического благополучия. 🌟\n\nЧтобы я мог подобрать для тебя подходящие дополнительные тесты и создать персональный план, пожалуйста, сначала пройди первичный тест на главной странице. Это поможет мне лучше понять твою ситуацию и предложить наиболее эффективные инструменты для улучшения твоего психологического состояния.';
      
      return res.json({ 
        success: true, 
        message: defaultMessage,
        recommendedTests: [],
        cached: false,
        warning: 'Primary test not completed'
      });
    }

    // Проверяем, есть ли уже сохраненное сообщение и список тестов
    if (primaryTest.lumi_dashboard_message && primaryTest.recommended_tests) {
      console.log('💾 Найдено сохраненное сообщение Луми и список тестов, возвращаем их');
      
      return res.json({ 
        success: true, 
        message: primaryTest.lumi_dashboard_message,
        recommendedTests: primaryTest.recommended_tests,
        cached: true 
      });
    }

    // Если есть только сообщение, но нет тестов - генерируем тесты заново
    if (primaryTest.lumi_dashboard_message && !primaryTest.recommended_tests) {
      console.log('💾 Найдено сообщение Луми, но нет тестов - генерируем тесты');
      const answers = primaryTest.answers;
      const recommendedTests = await analyzeAndRecommendTests(answers);
      
      // Сохраняем тесты в БД
      const { error: updateError } = await supabase
        .from('primary_test_results')
        .update({ recommended_tests: recommendedTests })
        .eq('session_id', sessionId);
      
      if (updateError) {
        console.error('⚠️ Ошибка при сохранении тестов:', updateError);
      }
      
      return res.json({ 
        success: true, 
        message: primaryTest.lumi_dashboard_message,
        recommendedTests: recommendedTests,
        cached: true 
      });
    }

    const answers = primaryTest.answers;
    const email = primaryTest.email;
    
    console.log('📊 Ответы теста:', answers);
    console.log('📧 Email из БД:', email);
    console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    
    // Анализируем ответы и определяем рекомендуемые тесты
    const recommendedTests = await analyzeAndRecommendTests(answers);
    
    // Проверяем, что recommendedTests - массив
    if (!Array.isArray(recommendedTests)) {
      console.error('❌ [AI] recommendedTests не является массивом:', recommendedTests);
      throw new Error('Failed to get recommended tests');
    }
    
    const prompt = `Проведи комплексное исследование психологического профиля пользователя и создай персонализированное мотивирующее сообщение.

ИССЛЕДОВАТЕЛЬСКАЯ ЗАДАЧА:
Проанализируй результаты первичного теста и определи оптимальную стратегию дальнейшего психологического тестирования.

ДАННЫЕ ДЛЯ АНАЛИЗА:
Результаты первичного теста: ${JSON.stringify(answers)}
Рекомендуемые дополнительные тесты: ${recommendedTests.map(t => t.name).join(', ')}

ИССЛЕДОВАТЕЛЬСКИЕ НАПРАВЛЕНИЯ:
1. Выяви ключевые психологические паттерны в ответах
2. Определи приоритетные области для углубленного изучения
3. Проанализируй взаимосвязи между различными ответами
4. Оцени потенциал для развития и улучшения

ТРЕБОВАНИЯ К РЕЗУЛЬТАТУ:
- Создай мотивирующее сообщение от маскота Луми
- Объясни важность дополнительных тестов на основе анализа
- Укажи конкретные области, требующие внимания
- Прояви понимание и поддержку
- На русском языке
- Кратко и по существу (3-4 предложения)

ФОРМАТ ОТВЕТА: Только текст сообщения, без дополнительных объяснений.`;

    console.log('🚀 Отправляем запрос к Gemini AI для генерации нового сообщения...');
    
    const message = await callGeminiAI(prompt);
    
    // Сохраняем сгенерированное сообщение и список тестов в БД
    console.log('💾 Сохраняем сообщение Луми и список тестов в БД...');
    const { error: updateError } = await supabase
      .from('primary_test_results')
      .update({ 
        lumi_dashboard_message: message,
        recommended_tests: recommendedTests
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('⚠️ Ошибка при сохранении сообщения и тестов:', updateError);
      // Не останавливаем выполнение, просто логируем
    } else {
      console.log('✅ Сообщение Луми и список тестов успешно сохранены в БД');
    }
    
    res.json({ success: true, message, recommendedTests, cached: false });
  } catch (error) {
    console.error('❌ Ошибка генерации сообщения для ЛК:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Генерировать персональный план
router.post('/personal-plan', async (req, res) => {
  try {
    console.log('🎯 [PERSONAL-PLAN] Начало обработки запроса');
    const { sessionId } = req.body;
    console.log('🎯 [PERSONAL-PLAN] SessionId:', sessionId);
    
    if (!sessionId) {
      console.error('❌ [PERSONAL-PLAN] SessionId не передан');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем результаты первичного теста
    console.log('🔍 [MASCOT-MESSAGE] Получаем данные из БД для sessionId:', sessionId);
    // Используем maybeSingle() вместо single() чтобы избежать ошибок
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('answers, email, personal_plan, lumi_dashboard_message, recommended_tests')
      .eq('session_id', sessionId)
      .maybeSingle();

    console.log('📊 [MASCOT-MESSAGE] Результат запроса к БД:', {
      hasData: !!primaryTest,
      hasError: !!primaryError,
      errorMessage: primaryError?.message,
      hasLumiMessage: !!primaryTest?.lumi_dashboard_message,
      hasRecommendedTests: !!primaryTest?.recommended_tests,
      lumiMessageLength: primaryTest?.lumi_dashboard_message?.length || 0,
      testsCount: primaryTest?.recommended_tests?.length || 0
    });
    console.log('📊 [PERSONAL-PLAN] Полные данные primaryTest:', primaryTest);
    console.log('📊 [PERSONAL-PLAN] Детали ошибки:', {
      code: primaryError?.code,
      message: primaryError?.message,
      details: primaryError?.details,
      hint: primaryError?.hint
    });

    if (primaryError || !primaryTest) {
      console.error('❌ [PERSONAL-PLAN] Результаты теста не найдены:', primaryError);
      
      // Попробуем получить запись со всеми полями для отладки
      console.log('🔍 [PERSONAL-PLAN] Пробуем получить запись со всеми полями...');
      const { data: fullRecord, error: fullError } = await supabase
        .from('primary_test_results')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      console.log('🔍 [PERSONAL-PLAN] Полная запись:', fullRecord);
      console.log('🔍 [PERSONAL-PLAN] Ошибка при получении полной записи:', fullError);
      
      return res.status(404).json({ success: false, error: 'Primary test results not found' });
    }

    // Проверяем наличие ответов теста
    if (!primaryTest.answers || (Array.isArray(primaryTest.answers) && primaryTest.answers.length === 0)) {
      console.error('❌ [PERSONAL-PLAN] Ответы теста отсутствуют для sessionId:', sessionId);
      return res.status(400).json({ 
        success: false, 
        error: 'Primary test not completed',
        message: 'Пожалуйста, сначала пройдите первичный тест на главной странице'
      });
    }

    // Если план уже сгенерирован, возвращаем его
    if (primaryTest.personal_plan) {
      console.log('💾 [PERSONAL-PLAN] Возвращаем кэшированный персональный план');
      return res.json({ success: true, plan: primaryTest.personal_plan, cached: true });
    }

    console.log('✨ [PERSONAL-PLAN] Генерируем новый персональный план');
    console.log('🔑 [PERSONAL-PLAN] GEMINI_API_KEY установлен:', process.env.GEMINI_API_KEY ? 'ДА' : 'НЕТ');

    const primaryAnswers = primaryTest.answers;
    const userEmail = primaryTest.email;
    console.log('📧 [PERSONAL-PLAN] Email пользователя:', userEmail || 'не указан');

    // Получаем результаты дополнительных тестов по session_id (как в других эндпоинтах)
    console.log('🔍 [PERSONAL-PLAN] Получаем дополнительные тесты из БД по session_id...');
    const { data: additionalTests, error: additionalError } = await supabase
      .from('additional_test_results')
      .select('test_type, answers')
      .eq('session_id', sessionId);

    console.log('📊 [PERSONAL-PLAN] Дополнительные тесты:', {
      hasTests: !!additionalTests,
      count: additionalTests?.length || 0,
      hasError: !!additionalError
    });

    // Определяем пол пользователя из ответов
    const genderAnswer = primaryAnswers.find(a => a.questionId === 1);
    const userGender = genderAnswer 
      ? (genderAnswer.answer === 'male' ? 'мужской' : 'женский') 
      : 'неопределен';
    console.log('👤 [PERSONAL-PLAN] Пол пользователя:', userGender);

    // Формируем результаты дополнительных тестов
    let secondaryTestResults = 'Дополнительные тесты не пройдены';
    if (additionalTests && additionalTests.length > 0) {
      secondaryTestResults = additionalTests.map(test => {
        // Правильно сериализуем answers (может быть объект, массив или строка)
        const answersStr = typeof test.answers === 'object' && test.answers !== null
          ? JSON.stringify(test.answers, null, 2)
          : String(test.answers || 'нет данных');
        return `${test.test_type}:\n${answersStr}`;
      }).join('\n\n---\n\n');
    }
    console.log('📋 [PERSONAL-PLAN] Результаты доп. тестов:', secondaryTestResults.substring(0, 200) + '...');

    // Читаем промпт из файла
    console.log('📝 [PERSONAL-PLAN] Читаем шаблон промпта...');
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const promptPath = path.join(__dirname, '../../prompt.txt');
    const examplePlanPath = path.join(__dirname, '../../example-personal-plan.txt');
    console.log('📝 [PERSONAL-PLAN] Путь к промпту:', promptPath);
    console.log('📝 [PERSONAL-PLAN] Путь к примеру плана:', examplePlanPath);
    
    try {
      const promptTemplate = fs.readFileSync(promptPath, 'utf8');
      const examplePlan = fs.readFileSync(examplePlanPath, 'utf8');
      console.log('✅ [PERSONAL-PLAN] Промпт успешно прочитан, длина:', promptTemplate.length);
      console.log('✅ [PERSONAL-PLAN] Пример плана прочитан, длина:', examplePlan.length);
      
      // Проверяем наличие данных перед формированием промпта
      console.log('📊 [PERSONAL-PLAN] Проверка данных перед формированием промпта:');
      console.log('📊 [PERSONAL-PLAN] Пол пользователя:', userGender);
      console.log('📊 [PERSONAL-PLAN] Количество ответов первичного теста:', primaryAnswers?.length || 0);
      console.log('📊 [PERSONAL-PLAN] Первые 3 ответа:', primaryAnswers?.slice(0, 3));
      console.log('📊 [PERSONAL-PLAN] Результаты доп. тестов:', secondaryTestResults?.substring(0, 200));
      
      if (!primaryAnswers || primaryAnswers.length === 0) {
        console.error('❌ [PERSONAL-PLAN] КРИТИЧЕСКАЯ ОШИБКА: Нет ответов первичного теста!');
        return res.status(400).json({ 
          success: false, 
          error: 'Primary test answers are required for plan generation' 
        });
      }
      
      // Формируем финальный промпт, заменяя переменные
      const userAnswersJson = JSON.stringify(primaryAnswers, null, 2);
      const prompt = promptTemplate
        .replace('{user_gender}', userGender)
        .replace('{user_answers}', userAnswersJson)
        .replace('{secondary_test_results}', secondaryTestResults)
        .replace('{example_personal_plan}', examplePlan);

      console.log('📝 [PERSONAL-PLAN] Финальный промпт сформирован, длина:', prompt.length);
      console.log('📝 [PERSONAL-PLAN] Первые 500 символов промпта:', prompt.substring(0, 500));
      console.log('📝 [PERSONAL-PLAN] Содержит ли промпт данные пользователя:', prompt.includes(userAnswersJson.substring(0, 50)));
      console.log('🚀 [PERSONAL-PLAN] Вызываем Gemini API...');
      
      const plan = await callGeminiAI(prompt);
      console.log('✅ [PERSONAL-PLAN] План получен от Gemini, длина:', plan?.length || 0);
    
      // Сохраняем план в БД для будущего использования
      console.log('💾 [PERSONAL-PLAN] Сохраняем план в БД...');
      const { error: updateError } = await supabase
        .from('primary_test_results')
        .update({ personal_plan: plan })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('⚠️ [PERSONAL-PLAN] Ошибка при сохранении плана в БД:', updateError);
        // Не возвращаем ошибку, так как план уже сгенерирован
      } else {
        console.log('✅ [PERSONAL-PLAN] Персональный план сохранён в БД');
      }
      
      console.log('🎉 [PERSONAL-PLAN] Отправляем успешный ответ клиенту');
      res.json({ success: true, plan, cached: false });
      
    } catch (promptError) {
      console.error('❌ [PERSONAL-PLAN] Ошибка при чтении/обработке промпта:', promptError);
      throw promptError;
    }
  } catch (error) {
    console.error('❌ [PERSONAL-PLAN] Критическая ошибка:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Подготовка к сеансу
router.post('/session-preparation', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    console.log('📝 [SESSION-PREPARATION] Начинаем генерацию подготовки к сеансу для sessionId:', sessionId);
    
    // Получаем результаты первичного теста
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('answers, email, personal_plan')
      .eq('session_id', sessionId)
      .single();

    if (primaryError || !primaryTest) {
      console.error('❌ [SESSION-PREPARATION] Ошибка получения данных первичного теста:', primaryError);
      return res.status(404).json({ success: false, error: 'Primary test results not found' });
    }

    const primaryAnswers = primaryTest.answers;
    const userEmail = primaryTest.email;
    const personalPlan = primaryTest.personal_plan;

    console.log('📊 [SESSION-PREPARATION] Получены данные первичного теста, email:', userEmail);
    console.log('📋 [SESSION-PREPARATION] Персональный план найден:', !!personalPlan);

    // Получаем результаты дополнительных тестов по sessionId
    const { data: additionalTests, error: additionalError } = await supabase
      .from('additional_test_results')
      .select('test_type, answers')
      .eq('session_id', sessionId);

    // Формируем результаты дополнительных тестов
    let secondaryTestResults = 'Дополнительные тесты не пройдены';
    if (additionalTests && additionalTests.length > 0) {
      secondaryTestResults = additionalTests.map(test => {
        // Правильно сериализуем answers (может быть объект, массив или строка)
        const answersStr = typeof test.answers === 'object' && test.answers !== null
          ? JSON.stringify(test.answers, null, 2)
          : String(test.answers || 'нет данных');
        return `${test.test_type}:\n${answersStr}`;
      }).join('\n\n---\n\n');
    }
    
    console.log('📋 [SESSION-PREPARATION] Результаты доп. тестов:', secondaryTestResults.substring(0, 200) + '...');

    // Определяем пол пользователя из ответов
    const genderAnswer = primaryAnswers.find(a => a.questionId === 1);
    const userGender = genderAnswer ? (genderAnswer.answer === 'male' ? 'мужской' : 'женский') : 'неопределен';
    console.log('👤 [SESSION-PREPARATION] Пол пользователя:', userGender);

    // Читаем промпт и пример из файлов
    console.log('📝 [SESSION-PREPARATION] Читаем шаблон промпта...');
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const promptPath = path.join(__dirname, '../../prompt-2.txt');
    const examplePath = path.join(__dirname, '../../example-podgotovka.txt');
    console.log('📝 [SESSION-PREPARATION] Путь к промпту:', promptPath);
    console.log('📝 [SESSION-PREPARATION] Путь к примеру:', examplePath);
    
    try {
      const promptTemplate = fs.readFileSync(promptPath, 'utf8');
      const examplePreparation = fs.readFileSync(examplePath, 'utf8');
      console.log('✅ [SESSION-PREPARATION] Промпт успешно прочитан, длина:', promptTemplate.length);
      console.log('✅ [SESSION-PREPARATION] Пример прочитан, длина:', examplePreparation.length);
      
      // Формируем финальный промпт, заменяя переменные
      const prompt = promptTemplate
        .replace('{user_gender}', userGender)
        .replace('{user_answers}', JSON.stringify(primaryAnswers))
        .replace('{secondary_test_results}', secondaryTestResults)
        .replace('{personal_plan}', personalPlan || 'Персональный план не найден')
        .replace('{example_preparation}', examplePreparation);

      console.log('📝 [SESSION-PREPARATION] Финальный промпт сформирован, длина:', prompt.length);
      console.log('🚀 [SESSION-PREPARATION] Вызываем Gemini API...');
      
      const preparation = await callGeminiAI(prompt);
      console.log('✅ [SESSION-PREPARATION] Подготовка получена от Gemini, длина:', preparation?.length || 0);
      
    res.json({ success: true, preparation });
    } catch (fileError) {
      console.error('❌ [SESSION-PREPARATION] Ошибка чтения файлов:', fileError);
      res.status(500).json({ success: false, error: 'Failed to read prompt files' });
    }
  } catch (error) {
    console.error('❌ [SESSION-PREPARATION] Ошибка генерации подготовки к сеансу:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Обратная связь о сеансе
// Получить историю чата обратной связи
router.get('/session-feedback/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`\n📥 [FEEDBACK HISTORY] Загрузка истории для sessionId: ${sessionId}`);
    
    // Получаем историю сообщений из базы
    const { data: messages, error } = await supabase
      .from('feedback_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [FEEDBACK HISTORY] Ошибка загрузки истории:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`✅ [FEEDBACK HISTORY] Загружено сообщений: ${messages?.length || 0}`);
    res.json({ success: true, messages: messages || [] });
  } catch (error) {
    console.error('❌ [FEEDBACK HISTORY] Критическая ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Проверить общее количество запросов пользователя (за всё время)
router.get('/session-feedback/limit/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`\n🔢 [FEEDBACK LIMIT] Проверка лимита для sessionId: ${sessionId}`);
    
    // Подсчитываем ОБЩЕЕ количество запросов пользователя (за всё время)
    const { count, error } = await supabase
      .from('feedback_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('role', 'user');

    if (error) {
      console.error('❌ [FEEDBACK LIMIT] Ошибка проверки лимита:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const requestsTotal = count || 0;
    const limit = 5;
    const remaining = Math.max(0, limit - requestsTotal);
    
    console.log(`✅ [FEEDBACK LIMIT] Результат: всего запросов=${requestsTotal}, лимит=${limit}, осталось=${remaining}`);

    res.json({ 
      success: true, 
      requestsToday: requestsTotal, // Оставляем имя поля для совместимости с фронтендом
      limit, 
      remaining,
      canSend: remaining > 0
    });
  } catch (error) {
    console.error('❌ [FEEDBACK LIMIT] Критическая ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/session-feedback', async (req, res) => {
  try {
    const { sessionId, message, history } = req.body;
    
    console.log('📥 [FEEDBACK-CHAT] Получен запрос:', { 
      sessionId, 
      messageLength: message?.length,
      historyLength: history?.length 
    });
    
    if (!message || !message.trim()) {
      console.log('❌ [FEEDBACK-CHAT] Пустое сообщение');
      return res.status(400).json({ success: false, error: 'Сообщение не может быть пустым' });
    }

    // Проверяем ограничение на 5 запросов ВСЕГО (за всё время)
    console.log('🔢 [FEEDBACK-CHAT] Проверяем лимит для sessionId:', sessionId);
    const { count, error: limitError } = await supabase
      .from('feedback_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('role', 'user');

    if (limitError) {
      console.error('❌ [FEEDBACK-CHAT] Ошибка проверки лимита:', limitError);
      return res.status(500).json({ success: false, error: 'Ошибка проверки лимита' });
    }

    const requestsTotal = count || 0;
    console.log('📊 [FEEDBACK-CHAT] Всего запросов пользователя:', requestsTotal);
    
    if (requestsTotal >= 5) {
      console.log('⚠️ [FEEDBACK-CHAT] Лимит превышен');
      return res.status(429).json({ 
        success: false, 
        error: 'Достигнут лимит запросов (5 запросов всего).' 
      });
    }
    
    // Получаем результаты первичного теста
    console.log('📥 [FEEDBACK-CHAT] Загружаем данные теста для sessionId:', sessionId);
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('answers, email')
      .eq('session_id', sessionId)
      .single();

    if (primaryError) {
      console.error('❌ [FEEDBACK-CHAT] Ошибка загрузки теста:', primaryError);
      return res.status(404).json({ success: false, error: 'Результаты теста не найдены: ' + primaryError.message });
    }
    
    if (!primaryTest) {
      console.error('❌ [FEEDBACK-CHAT] Тест не найден для sessionId:', sessionId);
      return res.status(404).json({ success: false, error: 'Результаты теста не найдены' });
    }
    
    console.log('✅ [FEEDBACK-CHAT] Данные теста загружены');

    const primaryAnswers = primaryTest.answers;
    const userEmail = primaryTest.email;

    // Получаем результаты дополнительных тестов по sessionId
    const { data: additionalTests, error: additionalError } = await supabase
      .from('additional_test_results')
      .select('test_type, answers')
      .eq('session_id', sessionId);

    // Формируем результаты дополнительных тестов
    let testResults = 'Дополнительные тесты не пройдены';
    if (additionalTests && additionalTests.length > 0) {
      testResults = additionalTests.map(test => 
        `${test.test_type}: ${test.answers}`
      ).join('; ');
    }

    // Формируем контекст из истории чата
    let historyContext = '';
    if (history && Array.isArray(history) && history.length > 0) {
      historyContext = '\n\nИСТОРИЯ ПРЕДЫДУЩИХ СООБЩЕНИЙ:\n';
      history.forEach((msg, idx) => {
        if (msg.role === 'user') {
          historyContext += `Пользователь: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          historyContext += `Ассистент: ${msg.content}\n`;
        }
      });
    }
    
    const prompt = `Ты - профессиональный психолог-консультант, который анализирует обратную связь клиентов после терапевтических сеансов.

ИССЛЕДОВАТЕЛЬСКАЯ ЗАДАЧА:
Проанализируй обратную связь пользователя о сеансе в контексте его психологического профиля и дай научно обоснованные рекомендации.

ДАННЫЕ ДЛЯ АНАЛИЗА:
Результаты первичного теста: ${JSON.stringify(primaryAnswers)}
Результаты дополнительных тестов: ${testResults}
${historyContext}
ТЕКУЩЕЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ: ${message}

ИССЛЕДОВАТЕЛЬСКИЕ НАПРАВЛЕНИЯ:
1. Проанализируй соответствие сеанса выявленным проблемам
2. Оцени эффективность терапевтических подходов
3. Выяви паттерны в обратной связи
4. Определи области для улучшения
5. Изучи динамику изменений

ТРЕБОВАНИЯ К АНАЛИЗУ:
Создай структурированный анализ, который включает:

1. КЛИНИЧЕСКАЯ ОЦЕНКА СЕАНСА
   - Соответствие проблемам из тестов
   - Эффективность выбранных методов
   - Уровень понимания специалистом ситуации

2. ПОЛОЖИТЕЛЬНЫЕ АСПЕКТЫ
   - Что было особенно полезно
   - Какие моменты дали результат
   - Успешные терапевтические элементы

3. ОБЛАСТИ ДЛЯ ВНИМАНИЯ
   - Потенциальные проблемы в подходе
   - Недостаточно проработанные темы
   - Возможные улучшения

4. РЕКОМЕНДАЦИИ ДЛЯ ПРОДОЛЖЕНИЯ
   - Направления для следующих сеансов
   - Корректировки в подходе
   - Дополнительные методы

5. ПРАКТИЧЕСКИЕ СОВЕТЫ
   - Что делать между сеансами
   - Как подготовиться к следующему сеансу
   - Самопомощь и развитие

ТРЕБОВАНИЯ К СТИЛЮ:
- Конструктивный и поддерживающий тон
- Научная обоснованность рекомендаций
- Практичность и выполнимость
- На русском языке
- Четкая структура с заголовками
- Если это продолжение диалога, учитывай предыдущие сообщения

КРИТИЧЕСКИ ВАЖНО - ФОРМАТИРОВАНИЕ:
- НЕ используй markdown форматирование (никаких символов #, **, __, *, и т.п.)
- НЕ используй заголовки с символами # или другими markdown элементами
- Пиши обычным текстом с простыми заголовками БОЛЬШИМИ БУКВАМИ
- Используй только обычный текст, переносы строк и простые разделители

ФОРМАТ ОТВЕТА: Только чистый текст без markdown форматирования, без символов #, **, и других markdown элементов.`;

    console.log('🚀 [FEEDBACK-CHAT] Отправляем запрос к Gemini API...');
    let analysis;
    try {
      analysis = await callGeminiAI(prompt);
      console.log('✅ [FEEDBACK-CHAT] Получен ответ от Gemini, длина:', analysis?.length);
    } catch (geminiError) {
      console.error('❌ [FEEDBACK-CHAT] Ошибка Gemini API:', geminiError);
      return res.status(500).json({ 
        success: false, 
        error: 'Ошибка при генерации ответа: ' + geminiError.message 
      });
    }
    
    // Убираем markdown форматирование из ответа
    analysis = analysis
      .replace(/^#{1,6}\s+/gm, '') // Убираем заголовки с #
      .replace(/\*\*(.*?)\*\*/g, '$1') // Убираем жирный текст **
      .replace(/\*(.*?)\*/g, '$1') // Убираем курсив *
      .replace(/__(.*?)__/g, '$1') // Убираем жирный __
      .replace(/_(.*?)_/g, '$1') // Убираем курсив _
      .replace(/`(.*?)`/g, '$1') // Убираем код `
      .replace(/~~(.*?)~~/g, '$1') // Убираем зачеркнутый текст
      .replace(/^[-*+]\s+/gm, '• ') // Заменяем markdown списки на простые
      .replace(/^\d+\.\s+/gm, '') // Убираем нумерацию списков
      .trim();
    
    console.log('💾 [FEEDBACK-CHAT] Сохраняем сообщение пользователя...');
    // Сохраняем сообщение пользователя
    const { error: userMsgError } = await supabase
      .from('feedback_chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message.trim()
      });

    if (userMsgError) {
      console.error('❌ [FEEDBACK-CHAT] Ошибка сохранения сообщения пользователя:', userMsgError);
      return res.status(500).json({ 
        success: false, 
        error: 'Ошибка сохранения сообщения: ' + userMsgError.message 
      });
    }
    console.log('✅ [FEEDBACK-CHAT] Сообщение пользователя сохранено');

    console.log('💾 [FEEDBACK-CHAT] Сохраняем ответ AI...');
    // Сохраняем ответ AI
    const { error: aiMsgError } = await supabase
      .from('feedback_chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: analysis
      });

    if (aiMsgError) {
      console.error('❌ [FEEDBACK-CHAT] Ошибка сохранения ответа AI:', aiMsgError);
      return res.status(500).json({ 
        success: false, 
        error: 'Ошибка сохранения ответа: ' + aiMsgError.message 
      });
    }
    console.log('✅ [FEEDBACK-CHAT] Ответ AI сохранён');

    // Также сохраняем в старую таблицу для обратной совместимости
    const { error: insertError } = await supabase
      .from('session_feedback')
      .insert({
        session_id: sessionId,
        feedback_text: message.trim(),
        ai_response: analysis
      });

    if (insertError) {
      console.error('⚠️ [FEEDBACK-CHAT] Ошибка сохранения в legacy таблицу (не критично):', insertError);
    }

    console.log('✅ [FEEDBACK-CHAT] Запрос обработан успешно');
    res.json({ success: true, response: analysis, requestsRemaining: Math.max(0, 5 - requestsTotal) });
  } catch (error) {
    console.error('❌ [FEEDBACK-CHAT] Критическая ошибка:', error);
    console.error('❌ [FEEDBACK-CHAT] Stack trace:', error.stack);
    res.status(500).json({ success: false, error: error.message || 'Внутренняя ошибка сервера' });
  }
});

// Функция для получения вопросов первичного теста
async function getPrimaryTestQuestions() {
  // Вопросы первичного теста (синхронизировано с server/routes/tests.js)
  const questions = [
    { id: 1, text: "В каком роде к вам обращаться?", type: "gender_choice" },
    { id: 2, text: "Испытываете ли вы периоды чрезмерной энергии, когда спите мало, но чувствуете себя полным сил и идей?", type: "yes_no_scale" },
    { id: 3, text: "Бывают ли у вас эпизоды глубокой грусти или депрессии, когда вы теряете интерес ко всему на недели или месяцы?", type: "yes_no_text", placeholder: "Укажите продолжительность" },
    { id: 4, text: "Часто ли вы чувствуете себя рассеянным, забываете вещи или не можете сосредоточиться на задачах?", type: "yes_no_scale" },
    { id: 5, text: "Есть ли у вас импульсивные действия, такие как необдуманные покупки или рискованное поведение?", type: "yes_no_examples", placeholder: "Приведите примеры" },
    { id: 6, text: "Испытываете ли вы сильную тревогу или панику в повседневных ситуациях?", type: "yes_no_scale" },
    { id: 7, text: "Оцените интенсивность переживаний, связанных с травматическими событиями из прошлого (если такие были)", type: "scale" },
    { id: 8, text: "Контролируете ли вы свой вес или еду чрезмерно, например, через диеты, переедание или очищение?", type: "yes_no_text", placeholder: "Укажите тип поведения" },
    { id: 9, text: "Используете ли вы алкоголь, наркотики или другие вещества, чтобы справиться с эмоциями?", type: "yes_no_text", placeholder: "Укажите частоту и тип" },
    { id: 10, text: "Чувствуете ли вы хроническую усталость или потерю энергии без видимой причины?", type: "yes_no_scale" },
    { id: 11, text: "Бывают ли у вас маниакальные идеи, когда вы говорите быстро и не можете остановиться?", type: "yes_no_examples", placeholder: "Приведите примеры" },
    { id: 12, text: "Трудно ли вам сидеть на месте, или, может, вы постоянно ёрзаете, дёргаетесь?", type: "yes_no_text", placeholder: "В каких ситуациях" },
    { id: 13, text: "Испытываете ли вы социальную тревогу, избегая встреч или общения?", type: "yes_no_scale" },
    { id: 14, text: "Есть ли у вас обсессивные мысли или компульсивные действия (например, перепроверка, заперли ли вы дверь по 5 раз подряд)?", type: "yes_no_text", placeholder: "Укажите тип" },
    { id: 15, text: "Чувствуете ли вы себя оторванным от реальности или своих эмоций в стрессовых ситуациях?", type: "yes_no_scale" },
    { id: 16, text: "Бывают ли у вас суицидальные мысли или попытки самоповреждения?", type: "yes_no_text", placeholder: "Если да, когда в последний раз" },
    { id: 17, text: "Испытывали ли вы гиперактивность в детстве, которая продолжается во взрослой жизни?", type: "yes_no_examples", placeholder: "Приведите примеры" },
    { id: 18, text: "Есть ли у вас циклы настроения: от эйфории к депрессии?", type: "yes_no_text", placeholder: "Укажите продолжительность циклов" },
    { id: 19, text: "Трудно ли вам регулировать эмоции, например, от гнева к слезам за минуты?", type: "yes_no_scale" },
    { id: 20, text: "Используете ли вы азартные игры или шопинг как способ отвлечься?", type: "yes_no_text", placeholder: "Укажите частоту" },
    { id: 21, text: "Бывают ли у вас галлюцинации или паранойя?", type: "yes_no_text", placeholder: "Если да, опишите" },
    { id: 22, text: "Чувствуете ли вы хроническую пустоту или скуку?", type: "yes_no_scale" },
    { id: 23, text: "Есть ли у вас проблемы с доверием или страх отвержения в отношениях?", type: "yes_no_examples", placeholder: "Приведите примеры" },
    { id: 24, text: "Испытываете ли вы бессонницу или чрезмерный сон во время эмоциональных спадов?", type: "yes_no_text", placeholder: "Укажите тип нарушения сна" },
    { id: 25, text: "Бывают ли у вас компульсивные покупки или долги из-за импульсов?", type: "yes_no_text", placeholder: "Укажите сумму долгов, если применимо" },
    { id: 26, text: "Чувствуете ли вы себя \"другим человеком\" в разных ситуациях (расщепление идентичности)?", type: "yes_no_examples", placeholder: "Приведите примеры" },
    { id: 27, text: "Какой максимальный бюджет на один сеанс вы можете себе позволить?", type: "budget" },
    { id: 28, text: "Сколько сеансов в месяц вы планируете (или можете себе позволить)?", type: "scale" },
    { id: 29, text: "Предпочитаете ли вы бесплатные/государственные клиники и психологические центры, если они доступны?", type: "yes_no" },
    { id: 30, text: "Принципиален ли вид терапии (онлайн/очно)?", type: "yes_no_text", placeholder: "Опишите ваши предпочтения по формату терапии. Если очно, то в каком городе?" },
    { id: 31, text: "Зависите ли вы финансово от кого-то (родителей, партнера)?", type: "yes_no_scale" },
    { id: 32, text: "Находитесь ли вы в абьюзивных отношениях (эмоциональный, физический, финансовый абьюз)?", type: "yes_no_text", placeholder: "Тип и продолжительность" },
    { id: 33, text: "Есть ли у вас зависимости от веществ или другие, негативно влияющие на вашу жизнь?", type: "yes_no_text", placeholder: "Тип и как давно" },
    { id: 34, text: "Чувствуете ли вы себя изолированным от друзей или семьи?", type: "yes_no_scale" },
    { id: 35, text: "Были ли в вашей жизни травмы (детские, недавние)?", type: "yes_no_text", placeholder: "Краткое описание" },
    { id: 36, text: "Есть ли у вас хронические заболевания, влияющие на психическое здоровье?", type: "yes_no_text", placeholder: "Какие" },
    { id: 37, text: "Работает ли ваш текущий график (работа/учеба) против вашего благополучия?", type: "yes_no_examples", placeholder: "Примеры стрессоров" },
    { id: 39, text: "Есть ли у вас доступ к безопасному месту для терапии (дом, онлайн)?", type: "no_text", placeholder: "Препятствия" },
    { id: 40, text: "Испытываете ли вы финансовый стресс (долги, безработица)?", type: "yes_no_scale" },
    { id: 41, text: "Был ли у вас предыдущий опыт терапии?", type: "yes_no_text", placeholder: "Что понравилось/не понравилось" },
    { id: 42, text: "Есть ли у вас дети или иждивенцы, влияющие на ваше расписание?", type: "yes_no_text", placeholder: "Как это влияет" },
    { id: 43, text: "Чувствуете ли вы давление от общества или культуры по поводу психического здоровья?", type: "scale" },
    { id: 44, text: "Готовы ли вы к изменениям в образе жизни (например, отказ от зависимостей)?", type: "scale" },
    { id: 45, text: "Какие ваши сильные стороны или ресурсы (хобби, поддержка), которые можно использовать в терапии?", type: "open_text" },
    { id: 46, text: "Опишите, что ещё вас беспокоит, а также дополнительные особенности вашей ситуации", type: "open_text" }
  ];
  return questions;
}

// Функция для анализа и рекомендации тестов
async function analyzeAndRecommendTests(answers) {
  const allTests = [
    { id: 1, name: "Тест на пограничное расстройство личности (ПРЛ)", url: "https://testometrika.com/diagnosis-of-abnormalities/do-you-have-a-border-disorder-of-personality/" },
    { id: 2, name: "Тест на биполярное аффективное расстройство (БАР)", url: "https://psytests.org/diag/hcl32.html" },
    { id: 3, name: "Тест на синдром дефицита внимания и гиперактивности (СДВГ)", url: "https://psytests.org/diag/asrs.html" },
    { id: 4, name: "Тест на посттравматическое стрессовое расстройство (ПТСР)", url: "https://psytests.org/trauma/pcl5.html" },
    { id: 5, name: "Тест на комплексное посттравматическое стрессовое расстройство (кПТСР)", url: "https://psytests.org/trauma/itq.html" },
    { id: 6, name: "Тест на депрессию", url: "https://psytests.org/depression/bdi.html" },
    { id: 7, name: "Тест на генерализованное тревожное расстройство", url: "https://psytests.org/anxiety/gad7.html" },
    { id: 8, name: "Тест на обсессивно-компульсивное расстройство (ОКР)", url: "https://psytests.org/psyclinical/ybocs.html" },
    { id: 9, name: "Тест на расстройства пищевого поведения", url: "https://psytests.org/food/eat26.html" },
    { id: 10, name: "Тест на зависимость от психоактивных веществ", url: "https://www.samopomo.ch/proversja/test-po-vyjavleniju-rasstroistv-svjazannykh-s-upotrebleniem-narkotikov-dudit" },
    { id: 11, name: "Тест на диссоциативное расстройство", url: "https://psytests.org/diag/des.html" },
    { id: 12, name: "Тест на расстройство аутистического спектра (РАС)", url: "https://psytests.org/arc/aq.html" },
    { id: 13, name: "Тест на социальное тревожное расстройство", url: "https://psytests.org/anxiety/lsas.html" },
    { id: 14, name: "Тест на паническое расстройство", url: "https://psytests.org/psyclinical/pdss.html" },
    { id: 15, name: "Тест на дисморфофобию (телесное дисморфическое расстройство)", url: "https://psytests.org/beauty/bddq.html" },
    { id: 16, name: "Тест на суицидальные тенденции", url: "https://psytests.org/psyclinical/osr.html" },
    { id: 17, name: "Тест на детскую травму", url: "https://psytests.org/trauma/ctq.html" },
    { id: 18, name: "Тест на шизотипическое расстройство личности", url: "https://psytests.org/diag/spq.html" },
    { id: 19, name: "Тест на выгорание", url: "https://psytests.org/stress/maslach.html" }
  ];

  try {
    // Получаем все вопросы первичного теста
    const primaryQuestions = await getPrimaryTestQuestions();
    
    // Формируем структурированные данные с вопросами, ответами и комментариями
    const answersWithQuestions = Object.entries(answers).map(([questionId, answerObj]) => {
      const question = primaryQuestions.find(q => q.id === parseInt(questionId));
      return {
        questionId: parseInt(questionId),
        questionText: question ? question.text : 'Неизвестный вопрос',
        answer: answerObj.answer,
        comment: answerObj.comment || ''
      };
    });

    // Используем Gemini для глубокого анализа ответов
    const analysisPrompt = `Ты — высококвалифицированный AI-психолог, специализирующийся на комплексной диагностике.

ИССЛЕДОВАТЕЛЬСКАЯ ЗАДАЧА:
Проанализируй ВСЕ предоставленные данные пользователя (формулировки вопросов, его ответы и комментарии) для формирования максимально точного списка рекомендуемых дополнительных психологических тестов.

ДАННЫЕ ДЛЯ АНАЛИЗА:
${JSON.stringify(answersWithQuestions, null, 2)}

ДОСТУПНЫЕ ТЕСТЫ ДЛЯ РЕКОМЕНДАЦИИ (используй ТОЛЬКО эти тесты):
${allTests.map((test, index) => `${index + 1}. ${test.name} (ID: ${test.id})`).join('\n')}

ТРЕБОВАНИЯ К АНАЛИЗУ И РЕКОМЕНДАЦИЯМ:
1. Проведи глубокий и всесторонний анализ всех ответов и комментариев пользователя.
2. Выяви все потенциальные психологические проблемы и области, требующие углубленной диагностики.
3. Сформируй список рекомендуемых тестов из предоставленного списка.
4. Включи ВСЕ тесты, которые действительно необходимы для полной картины состояния пользователя.
5. ИСКЛЮЧИ ЛИШНИЕ тесты, которые не имеют прямого отношения к выявленным проблемам.
6. КРИТИЧЕСКИ ВАЖНО: НЕ рекомендуй "Тест на зависимость от психоактивных веществ" ТОЛЬКО на основании упоминания курения обычных сигарет. Этот тест должен быть рекомендован только при наличии ЯВНЫХ признаков проблемного употребления веществ (например, алкоголь, наркотики, сильная зависимость от табака, влияющая на жизнь). Если пользователь просто упомянул "курение", но нет других признаков зависимости, НЕ рекомендуй этот тест.
7. Максимальное количество рекомендуемых тестов: 7.

ФОРМАТ ОТВЕТА: Верни ТОЛЬКО номера рекомендуемых тестов через запятую (например: 1,3,6,7), без дополнительного текста.`;

    const recommendedTestNumbers = await callGeminiAI(analysisPrompt);
    console.log('🔬 Рекомендации от Gemini:', recommendedTestNumbers);
    
    // Парсим номера тестов из ответа Gemini
    // Убираем все нечисловые символы и извлекаем числа
    const cleanedResponse = recommendedTestNumbers.replace(/[^\d,]/g, '');
    const testNumbers = cleanedResponse.split(',')
      .map(num => parseInt(num.trim()) - 1)
      .filter(num => !isNaN(num) && num >= 0 && num < allTests.length);
    
    const recommendedTests = testNumbers.map(num => allTests[num]);
    
    console.log('🔬 [ANALYZE] Рекомендации от Gemini:', {
      rawResponse: recommendedTestNumbers,
      parsedNumbers: testNumbers,
      recommendedTests: recommendedTests.map(t => t.name)
    });
    
    // Если Gemini не дал рекомендаций или дал слишком мало, используем fallback логику
    if (recommendedTests.length === 0) {
      console.log('⚠️ [ANALYZE] Gemini не дал рекомендаций, используем fallback логику');
      return getFallbackRecommendations(answers, allTests, primaryQuestions);
    }
    
    // Убедимся, что тест на ПРЛ (id=1) всегда в списке рекомендованных
    const bpdTest = allTests.find(test => test.id === 1);
    if (bpdTest && !recommendedTests.find(test => test.id === 1)) {
      console.log('🔒 [ANALYZE] Добавляем тест на ПРЛ в обязательные рекомендации');
      recommendedTests.unshift(bpdTest); // Добавляем в начало
    }
    
    return recommendedTests.slice(0, 7); // Увеличиваем лимит до 7 тестов
    
  } catch (error) {
    console.error('❌ [ANALYZE] Ошибка анализа Gemini, используем fallback:', error.message);
    const primaryQuestions = await getPrimaryTestQuestions();
    return getFallbackRecommendations(answers, allTests, primaryQuestions);
  }
}

function getFallbackRecommendations(answers, allTests, questions) {
  const recommendedTests = [];
  
  // Анализируем все ответы и комментарии для более точных рекомендаций
  // БАР (биполярное расстройство)
  const answer2 = answers[2]?.answer; // Энергия, мало сна
  const answer11 = answers[11]?.answer; // Маниакальные идеи
  const answer18 = answers[18]?.answer; // Циклы настроения
  if (answer2 === 'yes' || answer11 === 'yes' || answer18 === 'yes') {
    recommendedTests.push(allTests[1]); // БАР
  }
  
  // ПРЛ (пограничное расстройство личности)
  const answer19 = answers[19]?.answer; // Регуляция эмоций
  const answer22 = answers[22]?.answer; // Хроническая пустота
  const answer23 = answers[23]?.answer; // Проблемы с доверием
  const answer26 = answers[26]?.answer; // Расщепление идентичности
  if (answer19 === 'yes' || answer22 === 'yes' || answer23 === 'yes' || answer26 === 'yes') {
    recommendedTests.push(allTests[0]); // ПРЛ
  }
  
  // СДВГ
  const answer4 = answers[4]?.answer; // Рассеянность
  const answer12 = answers[12]?.answer; // Трудно сидеть на месте
  const answer17 = answers[17]?.answer; // Гиперактивность в детстве
  if (answer4 === 'yes' || answer12 === 'yes' || answer17 === 'yes') {
    recommendedTests.push(allTests[2]); // СДВГ
  }
  
  // ПТСР и кПТСР
  const answer7 = answers[7]; // Интенсивность травмы (slider)
  const answer35 = answers[35]?.answer; // Травмы
  const answer7Value = typeof answer7 === 'object' ? answer7.answer : answer7;
  if ((answer7Value && answer7Value > 5) || answer35 === 'yes') {
    recommendedTests.push(allTests[3]); // ПТСР
    recommendedTests.push(allTests[4]); // кПТСР
  }
  
  // Депрессия
  const answer3 = answers[3]?.answer; // Глубокая грусть
  const answer10 = answers[10]?.answer; // Хроническая усталость
  if (answer3 === 'yes' || answer10 === 'yes') {
    recommendedTests.push(allTests[5]); // Депрессия
  }
  
  // Тревожные расстройства
  const answer6 = answers[6]?.answer; // Сильная тревога
  const answer13 = answers[13]?.answer; // Социальная тревога
  if (answer6 === 'yes' || answer13 === 'yes') {
    recommendedTests.push(allTests[6]); // Генерализованное тревожное расстройство
    recommendedTests.push(allTests[12]); // Социальная тревога
  }
  
  // ОКР
  const answer14 = answers[14]?.answer; // Обсессивные мысли
  if (answer14 === 'yes') {
    recommendedTests.push(allTests[7]); // ОКР
  }
  
  // Расстройства пищевого поведения
  const answer8 = answers[8]?.answer; // Контроль веса/еды
  if (answer8 === 'yes') {
    recommendedTests.push(allTests[8]); // Расстройства пищевого поведения
  }
  
  // Зависимость от веществ - ТОЛЬКО при явных признаках
  const answer9 = answers[9]?.answer; // Использование веществ для эмоций
  const answer33 = answers[33]; // Зависимости от веществ
  const answer33Comment = answer33?.comment || '';
  // НЕ рекомендуем, если только курение сигарет без других признаков
  if (answer9 === 'yes' || (answer33?.answer === 'yes' && 
      answer33Comment && 
      !answer33Comment.toLowerCase().includes('сигарет') && 
      !answer33Comment.toLowerCase().includes('курени'))) {
    recommendedTests.push(allTests[9]); // Зависимость от веществ
  }
  
  // Диссоциативное расстройство
  const answer15 = answers[15]?.answer; // Оторванность от реальности
  if (answer15 === 'yes') {
    recommendedTests.push(allTests[10]); // Диссоциативное расстройство
  }
  
  // Суицидальные тенденции
  const answer16 = answers[16]?.answer; // Суицидальные мысли
  if (answer16 === 'yes') {
    recommendedTests.push(allTests[15]); // Суицидальные тенденции
  }
  
  // Детская травма
  if (answer35 === 'yes') {
    recommendedTests.push(allTests[16]); // Детская травма
  }

  // Убираем дубликаты
  const uniqueTests = recommendedTests.filter((test, index, self) => 
    index === self.findIndex(t => t.id === test.id)
  );

  // Убедимся, что тест на ПРЛ (id=1) всегда в списке рекомендованных
  const bpdTest = allTests.find(test => test.id === 1);
  if (bpdTest && !uniqueTests.find(test => test.id === 1)) {
    console.log('🔒 [FALLBACK] Добавляем тест на ПРЛ в обязательные рекомендации');
    uniqueTests.unshift(bpdTest); // Добавляем в начало
  }

  return uniqueTests.slice(0, 7); // Максимум 7 тестов
}

// PDF для психолога и психиатра - подготовительный документ для консультации
router.post('/psychologist-pdf', async (req, res) => {
  try {
    console.log('🎯 [PSYCHOLOGIST-PDF] Начало обработки запроса');
    const { sessionId } = req.body;
    console.log('🎯 [PSYCHOLOGIST-PDF] SessionId:', sessionId);
    
    if (!sessionId) {
      console.error('❌ [PSYCHOLOGIST-PDF] SessionId не передан');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем результаты первичного теста
    console.log('🔍 [PSYCHOLOGIST-PDF] Получаем данные из БД...');
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('answers, email, nickname, personal_plan')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (primaryError || !primaryTest) {
      console.error('❌ [PSYCHOLOGIST-PDF] Ошибка получения первичного теста:', primaryError);
      return res.status(404).json({ success: false, error: 'Primary test results not found' });
    }

    const primaryAnswers = primaryTest.answers;
    const userEmail = primaryTest.email;
    const userNickname = primaryTest.nickname;
    const personalPlan = primaryTest.personal_plan;

    // Получаем результаты дополнительных тестов по sessionId
    const { data: additionalTests, error: additionalError } = await supabase
      .from('additional_test_results')
      .select('test_type, answers')
      .eq('session_id', sessionId);

    // Формируем результаты дополнительных тестов
    let additionalTestResults = 'Дополнительные тесты не пройдены';
    if (additionalTests && additionalTests.length > 0) {
      additionalTestResults = additionalTests.map(test => {
        // Правильно сериализуем answers (может быть объект, массив или строка)
        const answersStr = typeof test.answers === 'object' && test.answers !== null
          ? JSON.stringify(test.answers, null, 2)
          : String(test.answers || 'нет данных');
        return `${test.test_type}:\n${answersStr}`;
      }).join('\n\n---\n\n');
    }

    // Определяем пол пользователя из ответов
    let userGender = 'неизвестен';
    if (primaryAnswers && Array.isArray(primaryAnswers)) {
      const genderAnswer = primaryAnswers.find(answer => 
        answer.questionId === 1 && answer.answer
      );
      if (genderAnswer) {
        userGender = genderAnswer.answer === 'male' ? 'мужской' : 'женский';
      }
    }

    console.log('📊 [PSYCHOLOGIST-PDF] Данные получены:', {
      userGender,
      primaryAnswersCount: primaryAnswers?.length || 0,
      additionalTestsCount: additionalTests?.length || 0,
      hasPersonalPlan: !!personalPlan
    });

    // Читаем промпт и пример
    const promptPath = path.join(__dirname, '../../prompt-3.txt');
    const examplePath = path.join(__dirname, '../../example-pdf-for-psy.txt');
    
    console.log('📖 [PSYCHOLOGIST-PDF] Читаем промпт из файла:', promptPath);
    const promptTemplate = fs.readFileSync(promptPath, 'utf8');
    
    console.log('📖 [PSYCHOLOGIST-PDF] Читаем пример из файла:', examplePath);
    const examplePdf = fs.readFileSync(examplePath, 'utf8');

    // Формируем финальный промпт
    const prompt = promptTemplate
      .replace('{user_gender}', userGender)
      .replace('{user_answers}', JSON.stringify(primaryAnswers))
      .replace('{secondary_test_results}', additionalTestResults)
      .replace('{personal_plan}', personalPlan || 'Персональный план не найден')
      .replace('{example_pdf}', examplePdf);

    console.log('🚀 [PSYCHOLOGIST-PDF] Вызываем Gemini API...');
    const psychologistPdf = await callGeminiAI(prompt);
    console.log('✅ [PSYCHOLOGIST-PDF] PDF для психолога и психиатра получен от Gemini, длина:', psychologistPdf?.length || 0);

    res.json({ 
      success: true, 
      psychologistPdf: psychologistPdf,
      userNickname: userNickname || 'Пользователь'
    });

  } catch (error) {
    console.error('❌ [PSYCHOLOGIST-PDF] Критическая ошибка:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint перегенерации больше не нужен - план генерируется только после прохождения всех тестов

export default router;
