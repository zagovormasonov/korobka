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
async function callGeminiAI(prompt, maxTokens = 2000) {
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
    
    // Создаем клиент Google AI
    console.log('🔧 Создаем клиент Google AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = "gemini-2.5-pro"; // Точное название из AI Studio
    console.log(`🤖 Получаем модель ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    console.log('🚀 Отправляем запрос к Gemini через SDK...');
    console.log('⏱️ Время начала:', new Date().toISOString());
    
    const result = await model.generateContent(prompt);
    console.log('📦 Результат получен, обрабатываем ответ...');
    const response = await result.response;
    console.log('📝 Извлекаем текст из ответа...');
    const text = response.text();
    
    console.log('✅ Gemini API ответ получен через SDK, длина:', text.length, 'символов');
    console.log('⏱️ Время окончания:', new Date().toISOString());
    return text;
    
  } catch (error) {
    console.error('❌ Ошибка Gemini API через SDK:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
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

    const message = await callGeminiAI(prompt, 1200);
    res.json({ success: true, message });
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
    // Используем maybeSingle() вместо single() чтобы избежать ошибок
    // TODO: Добавить lumi_dashboard_message после применения миграции
    const { data: primaryTest, error } = await supabase
      .from('primary_test_results')
      .select('answers, email')
      .eq('session_id', sessionId)
      .maybeSingle();

    console.log('🔍 Результаты теста из БД:', primaryTest);
    console.log('🔍 Есть ли ответы (answers)?', !!primaryTest?.answers);
    console.log('🔍 Тип answers:', typeof primaryTest?.answers);
    console.log('🔍 Ошибка Supabase:', error);

    if (error || !primaryTest) {
      console.log('❌ Результаты теста не найдены для sessionId:', sessionId);
      console.log('❌ Код ошибки Supabase:', error?.code);
      console.log('❌ Сообщение ошибки:', error?.message);
      console.log('❌ Детали ошибки:', error?.details);
      
      // Попробуем получить запись со всеми полями для отладки
      console.log('🔍 Пробуем получить запись со всеми полями...');
      const { data: fullRecord, error: fullError } = await supabase
        .from('primary_test_results')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      console.log('🔍 Полная запись:', fullRecord);
      console.log('🔍 Ошибка при получении полной записи:', fullError);
      
      return res.status(404).json({ success: false, error: 'Test results not found' });
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

    // TODO: Раскомментировать после применения миграции для кэширования сообщений
    // Проверяем, есть ли уже сохраненное сообщение
    // if (primaryTest.lumi_dashboard_message) {
    //   console.log('💾 Найдено сохраненное сообщение Луми, возвращаем его');
    //   
    //   // Всё равно генерируем список рекомендованных тестов
    //   const answers = primaryTest.answers;
    //   const recommendedTests = await analyzeAndRecommendTests(answers);
    //   
    //   return res.json({ 
    //     success: true, 
    //     message: primaryTest.lumi_dashboard_message,
    //     recommendedTests,
    //     cached: true 
    //   });
    // }

    const answers = primaryTest.answers;
    const email = primaryTest.email;
    
    console.log('📊 Ответы теста:', answers);
    console.log('📧 Email из БД:', email);
    console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    
    // Анализируем ответы и определяем рекомендуемые тесты
    const recommendedTests = await analyzeAndRecommendTests(answers);
    
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
    
    const message = await callGeminiAI(prompt, 1400);
    
    // TODO: Раскомментировать после применения миграции для кэширования
    // Сохраняем сгенерированное сообщение в БД
    // console.log('💾 Сохраняем сообщение Луми в БД...');
    // const { error: updateError } = await supabase
    //   .from('primary_test_results')
    //   .update({ lumi_dashboard_message: message })
    //   .eq('session_id', sessionId);
    //
    // if (updateError) {
    //   console.error('⚠️ Ошибка при сохранении сообщения:', updateError);
    //   // Не останавливаем выполнение, просто логируем
    // } else {
    //   console.log('✅ Сообщение Луми успешно сохранено в БД');
    // }
    
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
    console.log('🔍 [PERSONAL-PLAN] Получаем данные из БД...');
    // Используем maybeSingle() вместо single() чтобы избежать ошибок
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('answers, email, personal_plan')
      .eq('session_id', sessionId)
      .maybeSingle();

    console.log('📊 [PERSONAL-PLAN] Результат запроса к БД:', {
      hasData: !!primaryTest,
      hasError: !!primaryError,
      errorMessage: primaryError?.message
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

    // Получаем результаты дополнительных тестов по email
    console.log('🔍 [PERSONAL-PLAN] Получаем дополнительные тесты из БД...');
    const { data: additionalTests, error: additionalError } = await supabase
      .from('additional_test_results')
      .select('test_type, answers')
      .eq('email', userEmail);

    console.log('📊 [PERSONAL-PLAN] Дополнительные тесты:', {
      hasTests: !!additionalTests,
      count: additionalTests?.length || 0,
      hasError: !!additionalError
    });

    // Определяем пол пользователя из ответов
    const genderAnswer = primaryAnswers.find(a => a.questionId === 'Q2');
    const userGender = genderAnswer ? genderAnswer.answer : 'неопределен';
    console.log('👤 [PERSONAL-PLAN] Пол пользователя:', userGender);

    // Формируем результаты дополнительных тестов
    let secondaryTestResults = 'Дополнительные тесты не пройдены';
    if (additionalTests && additionalTests.length > 0) {
      secondaryTestResults = additionalTests.map(test =>
        `${test.test_type}: ${test.answers}`
      ).join('; ');
    }
    console.log('📋 [PERSONAL-PLAN] Результаты доп. тестов:', secondaryTestResults.substring(0, 100) + '...');

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
      
      // Формируем финальный промпт, заменяя переменные
      const prompt = promptTemplate
        .replace('{user_gender}', userGender)
        .replace('{user_answers}', JSON.stringify(primaryAnswers))
        .replace('{secondary_test_results}', secondaryTestResults)
        .replace('{example_personal_plan}', examplePlan);

      console.log('📝 [PERSONAL-PLAN] Финальный промпт сформирован, длина:', prompt.length);
      console.log('🚀 [PERSONAL-PLAN] Вызываем Gemini API...');
      
      const plan = await callGeminiAI(prompt, 16000);
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
      secondaryTestResults = additionalTests.map(test => 
        `${test.test_type}: ${test.answers}`
      ).join('; ');
    }
    
    console.log('📋 [SESSION-PREPARATION] Результаты доп. тестов:', secondaryTestResults.substring(0, 100) + '...');

    // Определяем пол пользователя из ответов
    const userGender = primaryAnswers?.Q1 === 'male' ? 'мужской' : 'женский';
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
      
      const preparation = await callGeminiAI(prompt, 16000);
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
router.post('/session-feedback', async (req, res) => {
  try {
    const { sessionId, feedbackText } = req.body;
    
    // Получаем результаты первичного теста
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('answers, email')
      .eq('session_id', sessionId)
      .single();

    if (primaryError || !primaryTest) {
      return res.status(404).json({ success: false, error: 'Primary test results not found' });
    }

    const primaryAnswers = primaryTest.answers;
    const userEmail = primaryTest.email;

    // Получаем результаты дополнительных тестов по email
    const { data: additionalTests, error: additionalError } = await supabase
      .from('additional_test_results')
      .select('test_type, answers')
      .eq('email', userEmail);

    // Формируем результаты дополнительных тестов
    let testResults = 'Дополнительные тесты не пройдены';
    if (additionalTests && additionalTests.length > 0) {
      testResults = additionalTests.map(test => 
        `${test.test_name}: ${test.test_result}`
      ).join('; ');
    }
    
    const prompt = `Проведи глубокое исследование эффективности терапевтического сеанса и создай детальный анализ с рекомендациями.

ИССЛЕДОВАТЕЛЬСКАЯ ЗАДАЧА:
Проанализируй обратную связь пользователя о сеансе в контексте его психологического профиля и дай научно обоснованные рекомендации.

ДАННЫЕ ДЛЯ АНАЛИЗА:
Результаты первичного теста: ${JSON.stringify(primaryAnswers)}
Результаты дополнительных тестов: ${testResults}
Обратная связь пользователя: ${feedbackText}

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

ФОРМАТ ОТВЕТА: Только текст анализа, без дополнительных объяснений.`;

    const analysis = await callGeminiAI(prompt, 8000);
    
    // Сохраняем обратную связь в базу
    const { error: insertError } = await supabase
      .from('session_feedback')
      .insert({
        session_id: sessionId,
        feedback_text: feedbackText,
        ai_response: analysis
      });

    if (insertError) {
      console.error('Error saving feedback:', insertError);
    }

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
    { id: 18, name: "Тест на шизотипическое расстройство личности", url: "https://psytests.org/diag/spq.html" }
  ];

  try {
    // Используем Gemini для глубокого анализа ответов
    const analysisPrompt = `Проведи глубокое исследование психологических паттернов в ответах теста и определи приоритетные области для дополнительного тестирования.

ИССЛЕДОВАТЕЛЬСКАЯ ЗАДАЧА:
Проанализируй ответы на психологический тест и выяви ключевые паттерны, требующие углубленного изучения.

ДАННЫЕ ДЛЯ АНАЛИЗА:
${JSON.stringify(answers)}

ДОСТУПНЫЕ ТЕСТЫ ДЛЯ РЕКОМЕНДАЦИИ:
${allTests.map((test, index) => `${index + 1}. ${test.name}`).join('\n')}

ИССЛЕДОВАТЕЛЬСКИЕ НАПРАВЛЕНИЯ:
1. Выяви доминирующие психологические паттерны
2. Определи области повышенного риска
3. Проанализируй взаимосвязи между ответами
4. Оцени потребность в специализированном тестировании

ТРЕБОВАНИЯ К АНАЛИЗУ:
- Используй научный подход к анализу данных
- Выяви скрытые паттерны и корреляции
- Определи приоритетные области для диагностики
- Учти специфику каждого теста

ФОРМАТ ОТВЕТА: Верни только номера рекомендуемых тестов через запятую (например: 1,3,6,7), максимум 5 тестов.`;

    const recommendedTestNumbers = await callGeminiAI(analysisPrompt, 400);
    console.log('🔬 Рекомендации от Gemini:', recommendedTestNumbers);
    
    // Парсим номера тестов
    const testNumbers = recommendedTestNumbers.split(',').map(num => parseInt(num.trim()) - 1).filter(num => num >= 0 && num < allTests.length);
    
    const recommendedTests = testNumbers.map(num => allTests[num]);
    
    // Если Gemini не дал рекомендаций, используем fallback логику
    if (recommendedTests.length === 0) {
      console.log('⚠️ Gemini не дал рекомендаций, используем fallback логику');
      return getFallbackRecommendations(answers, allTests);
    }
    
    return recommendedTests.slice(0, 5);
    
  } catch (error) {
    console.error('❌ Ошибка анализа Gemini, используем fallback:', error.message);
    return getFallbackRecommendations(answers, allTests);
  }
}

function getFallbackRecommendations(answers, allTests) {
  const recommendedTests = [];
  
  // Анализируем ответы и рекомендуем соответствующие тесты
  if (answers[1]?.answer === 'yes' || answers[17]?.answer === 'yes') {
    recommendedTests.push(allTests[1]); // БАР
  }
  
  if (answers[3]?.answer === 'yes' || answers[16]?.answer === 'yes') {
    recommendedTests.push(allTests[0]); // ПРЛ
  }
  
  if (answers[2]?.answer === 'yes' || answers[10]?.answer === 'yes' || answers[15]?.answer === 'yes') {
    recommendedTests.push(allTests[2]); // СДВГ
  }
  
  if (answers[5]?.answer === 'yes' || answers[33]?.answer === 'yes') {
    recommendedTests.push(allTests[3]); // ПТСР
    recommendedTests.push(allTests[4]); // кПТСР
  }
  
  if (answers[1]?.answer === 'yes' || answers[17]?.answer === 'yes') {
    recommendedTests.push(allTests[5]); // Депрессия
  }
  
  if (answers[4]?.answer === 'yes' || answers[11]?.answer === 'yes') {
    recommendedTests.push(allTests[6]); // Тревожное расстройство
    recommendedTests.push(allTests[12]); // Социальная тревога
  }
  
  if (answers[12]?.answer === 'yes') {
    recommendedTests.push(allTests[7]); // ОКР
  }
  
  if (answers[6]?.answer === 'yes') {
    recommendedTests.push(allTests[8]); // Расстройства пищевого поведения
  }
  
  if (answers[7]?.answer === 'yes' || answers[31]?.answer === 'yes') {
    recommendedTests.push(allTests[9]); // Зависимость от веществ
  }
  
  if (answers[13]?.answer === 'yes' || answers[24]?.answer === 'yes') {
    recommendedTests.push(allTests[10]); // Диссоциативное расстройство
  }
  
  if (answers[15]?.answer === 'yes') {
    recommendedTests.push(allTests[15]); // Суицидальные тенденции
  }
  
  if (answers[33]?.answer === 'yes') {
    recommendedTests.push(allTests[16]); // Детская травма
  }

  // Убираем дубликаты
  const uniqueTests = recommendedTests.filter((test, index, self) => 
    index === self.findIndex(t => t.id === test.id)
  );

  return uniqueTests.slice(0, 5); // Максимум 5 тестов
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
      additionalTestResults = additionalTests.map(test => 
        `${test.test_type}: ${test.answers}`
      ).join('\n');
    }

    // Определяем пол пользователя из ответов
    let userGender = 'неизвестен';
    if (primaryAnswers && Array.isArray(primaryAnswers)) {
      const genderAnswer = primaryAnswers.find(answer => 
        answer.questionId === 1 && answer.answer
      );
      if (genderAnswer) {
        userGender = genderAnswer.answer.toLowerCase().includes('женский') ? 'женский' : 'мужской';
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
    const psychologistPdf = await callGeminiAI(prompt, 12000);
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

export default router;
