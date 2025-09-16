import express from 'express';
import axios from 'axios';
import { pool } from '../index.js';

const router = express.Router();

// Генерировать сообщение от маскота для лендинга оплаты
router.post('/mascot-message/payment', async (req, res) => {
  try {
    console.log('🤖 Запрос на генерацию сообщения маскота:', req.body);
    
    const { sessionId } = req.body;
    
    if (!sessionId) {
      console.error('❌ Отсутствует sessionId');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? 'установлен' : 'НЕ УСТАНОВЛЕН');
    
    // Получаем результаты теста
    const testResult = await pool.query(
      'SELECT answers FROM primary_test_results WHERE session_id = $1',
      [sessionId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    const answers = testResult.rows[0].answers;
    
    const prompt = `На основе результатов теста на психическое здоровье создай поддерживающее сообщение от маскота Луми для пользователя, который только что завершил тест. 

Результаты теста: ${JSON.stringify(answers)}

Сообщение должно быть:
- Поддерживающим и ободряющим
- Кратким (2-3 предложения)
- Указывать на важность получения персонального плана
- Быть написано от лица дружелюбного маскота Луми
- На русском языке
- ссылаться на конкретные детали в ответах на вопросы теста

Ответь только текстом сообщения, без дополнительных объяснений.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const message = response.data.choices[0].message.content;
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error generating mascot message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Генерировать сообщение от маскота для личного кабинета
router.post('/mascot-message/dashboard', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Получаем результаты первичного теста
    const primaryTest = await pool.query(
      'SELECT answers, email FROM primary_test_results WHERE session_id = $1',
      [sessionId]
    );

    console.log('🔍 Результаты теста из БД:', primaryTest.rows);

    if (primaryTest.rows.length === 0) {
      console.log('❌ Результаты теста не найдены для sessionId:', sessionId);
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    const answers = primaryTest.rows[0].answers;
    const email = primaryTest.rows[0].email;
    
    console.log('📊 Ответы теста:', answers);
    console.log('📧 Email из БД:', email);
    
    // Анализируем ответы и определяем рекомендуемые тесты
    const recommendedTests = await analyzeAndRecommendTests(answers);
    
    const prompt = `На основе результатов первичного теста создай поддерживающее сообщение от маскота Луми для пользователя в личном кабинете.

Результаты теста: ${JSON.stringify(answers)}
Рекомендуемые дополнительные тесты: ${recommendedTests.map(t => t.name).join(', ')}

Сообщение должно быть:
- Поддерживающим и мотивирующим
- Объяснять важность прохождения дополнительных тестов
- Указывать на конкретные области, которые стоит проверить
- Быть написано от лица дружелюбного маскота Луми
- На русском языке
- Кратким (3-4 предложения)

Ответь только текстом сообщения, без дополнительных объяснений.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const message = response.data.choices[0].message.content;
    res.json({ success: true, message, recommendedTests });
  } catch (error) {
    console.error('Error generating dashboard message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Генерировать персональный план
router.post('/personal-plan', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Получаем все результаты тестов
    const primaryTest = await pool.query(
      'SELECT answers FROM primary_test_results WHERE session_id = $1',
      [sessionId]
    );

    const additionalTests = await pool.query(
      'SELECT test_name, test_result FROM additional_test_results WHERE session_id = $1',
      [sessionId]
    );

    if (primaryTest.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    const primaryAnswers = primaryTest.rows[0].answers;
    const additionalResults = additionalTests.rows;
    
    const prompt = `На основе всех результатов тестов создай персональный план для пользователя.

Результаты первичного теста: ${JSON.stringify(primaryAnswers)}
Результаты дополнительных тестов: ${JSON.stringify(additionalResults)}

Создай структурированный персональный план, который включает:
1. Краткий анализ основных проблем
2. Конкретные рекомендации по терапии
3. Советы по выбору психолога
4. Подготовку к сеансам
5. Дополнительные ресурсы

План должен быть:
- Персонализированным под конкретные проблемы пользователя
- Практичным и выполнимым
- Написанным на русском языке
- Структурированным с заголовками и пунктами

Ответь только текстом плана, без дополнительных объяснений.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const plan = response.data.choices[0].message.content;
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error generating personal plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Генерировать подготовку к сеансу
router.post('/session-preparation', async (req, res) => {
  try {
    const { sessionId, specialistType } = req.body; // 'psychologist' или 'psychiatrist'
    
    // Получаем все результаты тестов
    const primaryTest = await pool.query(
      'SELECT answers FROM primary_test_results WHERE session_id = $1',
      [sessionId]
    );

    const additionalTests = await pool.query(
      'SELECT test_name, test_result FROM additional_test_results WHERE session_id = $1',
      [sessionId]
    );

    if (primaryTest.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    const primaryAnswers = primaryTest.rows[0].answers;
    const additionalResults = additionalTests.rows;
    
    const specialistName = specialistType === 'psychologist' ? 'психологу' : 'психиатру';
    
    const prompt = `На основе всех результатов тестов создай руководство по подготовке к сеансу с ${specialistName}.

Результаты первичного теста: ${JSON.stringify(primaryAnswers)}
Результаты дополнительных тестов: ${JSON.stringify(additionalResults)}

Создай структурированное руководство, которое включает:
1. Что рассказать ${specialistName} о своих проблемах
2. Какие вопросы задать ${specialistName}
3. Цели сеанса
4. Что взять с собой (особенно для психиатра - история препаратов)
5. Как максимально эффективно использовать время

Руководство должно быть:
- Персонализированным под конкретные проблемы пользователя
- Практичным и конкретным
- Написанным на русском языке
- Структурированным с заголовками и пунктами

Ответь только текстом руководства, без дополнительных объяснений.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const preparation = response.data.choices[0].message.content;
    res.json({ success: true, preparation });
  } catch (error) {
    console.error('Error generating session preparation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Анализ обратной связи по сеансу
router.post('/session-feedback', async (req, res) => {
  try {
    const { sessionId, feedbackText } = req.body;
    
    // Получаем все результаты тестов
    const primaryTest = await pool.query(
      'SELECT answers FROM primary_test_results WHERE session_id = $1',
      [sessionId]
    );

    const additionalTests = await pool.query(
      'SELECT test_name, test_result FROM additional_test_results WHERE session_id = $1',
      [sessionId]
    );

    if (primaryTest.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    const primaryAnswers = primaryTest.rows[0].answers;
    const additionalResults = additionalTests.rows;
    
    const prompt = `Проанализируй обратную связь пользователя о сеансе с психологом и дай рекомендации.

Результаты первичного теста: ${JSON.stringify(primaryAnswers)}
Результаты дополнительных тестов: ${JSON.stringify(additionalResults)}
Обратная связь пользователя: ${feedbackText}

Дай анализ и рекомендации:
1. Оценка эффективности сеанса
2. Что было хорошо
3. На что обратить внимание
4. Рекомендации для следующих сеансов
5. Дополнительные советы

Ответ должен быть:
- Конструктивным и поддерживающим
- Основанным на данных тестов
- Практичным
- Написанным на русском языке
- Структурированным

Ответь только текстом анализа, без дополнительных объяснений.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const analysis = response.data.choices[0].message.content;
    
    // Сохраняем обратную связь в базу
    await pool.query(
      'INSERT INTO session_feedback (session_id, feedback_text, ai_response) VALUES ($1, $2, $3)',
      [sessionId, feedbackText, analysis]
    );

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing session feedback:', error);
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

  // Простая логика рекомендации на основе ответов
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
