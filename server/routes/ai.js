import express from 'express';
import axios from 'axios';
import { supabase } from '../index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { constants } from 'crypto';

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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    console.log('🚀 Отправляем запрос к Gemini через SDK...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API ответ получен через SDK, длина:', text.length, 'символов');
    return text;
    
  } catch (error) {
    console.error('❌ Ошибка Gemini API через SDK:', {
      message: error.message,
      stack: error.stack
    });
    
    // Если ошибка связана с прокси или сетью, попробуем без прокси
    if (error.message.includes('proxy') || error.message.includes('timeout') || 
        error.message.includes('network') || error.message.includes('connection') ||
        error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.log('🔄 Пробуем без прокси через SDK...');
      
      // Очищаем переменные прокси
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        
        console.log('🚀 Отправляем fallback запрос к Gemini через SDK...');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Gemini API ответ получен без прокси через SDK, длина:', text.length, 'символов');
        return text;
      } catch (fallbackError) {
        console.error('❌ Ошибка Gemini API без прокси через SDK:', {
          message: fallbackError.message,
          stack: fallbackError.stack
        });
      }
    }
    
    // Возвращаем заглушку если API недоступен
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
      .single();

    if (error || !testResult) {
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

    const message = await callGeminiAI(prompt, 300);
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
    
    console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    
    // Получаем результаты первичного теста
    const { data: primaryTest, error } = await supabase
      .from('primary_test_results')
      .select('answers, email')
      .eq('session_id', sessionId)
      .single();

    console.log('🔍 Результаты теста из БД:', primaryTest);

    if (error || !primaryTest) {
      console.log('❌ Результаты теста не найдены для sessionId:', sessionId);
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    const answers = primaryTest.answers;
    const email = primaryTest.email;
    
    console.log('📊 Ответы теста:', answers);
    console.log('📧 Email из БД:', email);
    
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

    console.log('🚀 Отправляем запрос к Gemini AI...');
    
    const message = await callGeminiAI(prompt, 350);
    res.json({ success: true, message, recommendedTests });
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
    const { sessionId } = req.body;
    
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
      .select('test_name, test_result')
      .eq('email', userEmail);

    // Определяем пол пользователя из ответов
    const genderAnswer = primaryAnswers.find(a => a.questionId === 'Q2');
    const userGender = genderAnswer ? genderAnswer.answer : 'неопределен';

    // Формируем результаты дополнительных тестов
    let secondaryTestResults = 'Дополнительные тесты не пройдены';
    if (additionalTests && additionalTests.length > 0) {
      secondaryTestResults = additionalTests.map(test => 
        `${test.test_name}: ${test.test_result}`
      ).join('; ');
    }

    // Читаем промпт из файла
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const promptPath = path.join(__dirname, '../../prompt.txt');
    const promptTemplate = fs.readFileSync(promptPath, 'utf8');

    // Формируем финальный промпт, заменяя переменные
    const prompt = promptTemplate
      .replace('{user_gender}', userGender)
      .replace('{user_answers}', JSON.stringify(primaryAnswers))
      .replace('{secondary_test_results}', secondaryTestResults);

    console.log('🚀 Генерируем персональный план через Gemini AI...');
    const plan = await callGeminiAI(prompt, 4000);
    
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error generating personal plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Подготовка к сеансу
router.post('/session-preparation', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
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
      .select('test_name, test_result')
      .eq('email', userEmail);

    // Формируем результаты дополнительных тестов
    let testResults = 'Дополнительные тесты не пройдены';
    if (additionalTests && additionalTests.length > 0) {
      testResults = additionalTests.map(test => 
        `${test.test_name}: ${test.test_result}`
      ).join('; ');
    }
    
    const prompt = `Создай детальное руководство по подготовке к сеансу с психологом и психиатром.

ИССЛЕДОВАТЕЛЬСКАЯ ЗАДАЧА:
Проанализируй результаты тестов и создай персонализированное руководство для максимально эффективного использования времени на сеансе.

ДАННЫЕ ДЛЯ АНАЛИЗА:
Результаты первичного теста: ${JSON.stringify(primaryAnswers)}
Результаты дополнительных тестов: ${testResults}

ТРЕБОВАНИЯ К РУКОВОДСТВУ:
Создай структурированное руководство, которое включает:

1. ЧТО ГОВОРИТЬ ПСИХОЛОГУ
   - Ключевые эмоциональные проблемы
   - Поведенческие паттерны
   - Отношения и социальные трудности
   - Цели психотерапии

2. ЧТО ГОВОРИТЬ ПСИХИАТРУ
   - Симптомы и их выраженность
   - История развития состояния
   - Влияние на повседневную жизнь
   - Предыдущий опыт медикаментозного лечения

3. ВОПРОСЫ ДЛЯ ПСИХОЛОГА
   - О методах терапии
   - О длительности лечения
   - О домашних заданиях
   - О работе с конкретными проблемами

4. ВОПРОСЫ ДЛЯ ПСИХИАТРА
   - О диагнозе и прогнозе
   - О медикаментах и побочных эффектах
   - О совместимости с другими препаратами
   - О контроле эффективности лечения

5. ЦЕЛИ СЕАНСОВ
   - Краткосрочные цели (1-3 месяца)
   - Долгосрочные цели (6-12 месяцев)
   - Критерии улучшения состояния

6. ЧТО ВЗЯТЬ С СОБОЙ
   - К психологу: дневники настроения, записи о проблемах
   - К психиатру: ОБЯЗАТЕЛЬНО историю назначений и приёма препаратов, как влияли разные сочетания/дозировки препаратов, результаты анализов
   - Список текущих медикаментов
   - Медицинскую карту

ТРЕБОВАНИЯ К СТИЛЮ:
- Практичный и конкретный
- Персонализированный под результаты тестов
- Понятный и структурированный
- На русском языке
- Мотивирующий тон

ОСОБОЕ ВНИМАНИЕ: Подчеркни важность взять с собой к психиатру историю назначений и приёма препаратов и как влияли разные сочетания/дозировки препаратов.

ФОРМАТ ОТВЕТА: Только текст руководства, без дополнительных объяснений.`;

    const preparation = await callGeminiAI(prompt, 2000);
    res.json({ success: true, preparation });
  } catch (error) {
    console.error('Error generating session preparation:', error);
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
      .select('test_name, test_result')
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

    const analysis = await callGeminiAI(prompt, 2000);
    
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
    { id: 1, name: "Тест на пограничное расстройство личности (ПРЛ)", url: "https://yasno.live/tests/pogranichnoye-rasstroystvo-lichnosti" },
    { id: 2, name: "Тест на биполярное аффективное расстройство (БАР)", url: "https://iyaroslav.ru/test/test-na-gipomaniu-bipolarnoe-rasstroystvo/" },
    { id: 3, name: "Тест на синдром дефицита внимания и гиперактивности (СДВГ)", url: "https://yasno.live/tests/sdvg" },
    { id: 4, name: "Тест на посттравматическое стрессовое расстройство (ПТСР)", url: "https://yasno.live/tests/ptsr" },
    { id: 5, name: "Тест на комплексное посттравматическое стрессовое расстройство (кПТСР)", url: "https://www.bipolar.su/test-kptsr-onlajn-oprosnik-na-kompleksnoe-ptsr/" },
    { id: 6, name: "Тест на депрессию", url: "https://psi-praktika.ru/testyi/test-beka-na-depressiyu.html" },
    { id: 7, name: "Тест на генерализованное тревожное расстройство", url: "https://psytests.org/anxiety/gad7.html" },
    { id: 8, name: "Тест на обсессивно-компульсивное расстройство (ОКР)", url: "https://yasno.live/tests/okr-jelya-brauna" },
    { id: 9, name: "Тест на расстройства пищевого поведения", url: "https://centrsna.by/articles/testy/test-eat-26-test-na-veroyatnost-nalichiya-rasstroystv-pishchevogo-povedeniya/" },
    { id: 10, name: "Тест на зависимость от веществ", url: "https://rehabfamily.com/o-klinike/testy/test-na-narkoticheskuyu-zavisimost/" },
    { id: 11, name: "Тест на диссоциативное расстройство", url: "https://yasno.live/tests/dissociativnoe-rasstrojstvo-lichnosti" },
    { id: 12, name: "Тест на расстройство аутистического спектра (РАС)", url: "https://psytests.org/arc/aq.html" },
    { id: 13, name: "Тест на социальное тревожное расстройство", url: "https://psytests.org/anxiety/lsas.html" },
    { id: 14, name: "Тест на паническое расстройство", url: "https://akhmetovfoundation.org/ru/test/panycheskye-ataky-onlayn-test" },
    { id: 15, name: "Тест на дисморфофобию", url: "https://testometrika.com/diagnosis-of-abnormalities/are-you-prone-to-dysmorphophobia/" },
    { id: 16, name: "Тест на суицидальные тенденции", url: "https://testometrika.com/depression-and-stress/the-questionnaire-of-suicidal-risk-for-adolescents/" },
    { id: 17, name: "Тест на детскую травму", url: "https://ershovlabexpert.ru/test/detskie_travmy" },
    { id: 18, name: "Тест на шизотипическое расстройство личности", url: "https://onlinetestpad.com/ru/test/1492724-test-na-shizotipicheskoe-rasstrojstvo" }
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

    const recommendedTestNumbers = await callGeminiAI(analysisPrompt, 100);
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

export default router;
