import express from 'express';
import { pool } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Получить вопросы первичного теста
router.get('/primary/questions', (req, res) => {
  const questions = [
    {
      id: 1,
      text: "Испытываете ли вы периоды чрезмерной энергии, когда спите мало, но чувствуете себя полным сил и идей?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Редко", max: "Очень часто" } }
    },
    {
      id: 2,
      text: "Бывают ли у вас эпизоды глубокой грусти или депрессии, когда вы теряете интерес ко всему на недели или месяцы?",
      type: "yes_no_text",
      placeholder: "Укажите продолжительность"
    },
    {
      id: 3,
      text: "Часто ли вы чувствуете себя рассеянным, забываете вещи или не можете сосредоточиться на задачах?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Редко", max: "Очень часто" } }
    },
    {
      id: 4,
      text: "Есть ли у вас импульсивные действия, такие как необдуманные покупки или рискованное поведение?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 5,
      text: "Испытываете ли вы сильную тревогу или панику в повседневных ситуациях?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Слабо", max: "Очень сильно" } }
    },
    {
      id: 6,
      text: "Бывают ли у вас флэшбэки или кошмары, связанные с травматическими событиями из прошлого?",
      type: "yes_no_text",
      placeholder: "Опишите кратко"
    },
    {
      id: 7,
      text: "Контролируете ли вы свой вес или еду чрезмерно, например, через диеты, переедание или очищение?",
      type: "yes_no_text",
      placeholder: "Укажите тип поведения"
    },
    {
      id: 8,
      text: "Используете ли вы алкоголь, наркотики или другие вещества, чтобы справиться с эмоциями?",
      type: "yes_no_text",
      placeholder: "Укажите частоту и тип"
    },
    {
      id: 9,
      text: "Чувствуете ли вы хроническую усталость или потерю энергии без видимой причины?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Слабо", max: "Очень сильно" } }
    },
    {
      id: 10,
      text: "Бывают ли у вас маниакальные идеи, когда вы говорите быстро и не можете остановиться?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 11,
      text: "Трудно ли вам сидеть на месте, или, может, вы постоянно ёрзаете, дёргаетесь?",
      type: "yes_no_text",
      placeholder: "В каких ситуациях"
    },
    {
      id: 12,
      text: "Испытываете ли вы социальную тревогу, избегая встреч или общения?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Лёгкая", max: "Сильная" } }
    },
    {
      id: 13,
      text: "Есть ли у вас обсессивные мысли или компульсивные действия (например, перепроверка, заперли ли вы дверь по 5 раз подряд)?",
      type: "yes_no_text",
      placeholder: "Укажите тип"
    },
    {
      id: 14,
      text: "Чувствуете ли вы себя оторванным от реальности или своих эмоций в стрессовых ситуациях?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Редко", max: "Очень часто" } }
    },
    {
      id: 15,
      text: "Бывают ли у вас суицидальные мысли или попытки самоповреждения?",
      type: "yes_no_text",
      placeholder: "Если да, когда в последний раз"
    },
    {
      id: 16,
      text: "Испытывали ли вы гиперактивность в детстве, которая продолжается во взрослой жизни?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 17,
      text: "Есть ли у вас циклы настроения: от эйфории к депрессии?",
      type: "yes_no_text",
      placeholder: "Укажите продолжительность циклов"
    },
    {
      id: 18,
      text: "Трудно ли вам регулировать эмоции, например, от гнева к слезам за минуты?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Легко", max: "Очень трудно" } }
    },
    {
      id: 19,
      text: "Используете ли вы азартные игры или шопинг как способ отвлечься?",
      type: "yes_no_text",
      placeholder: "Укажите частоту"
    },
    {
      id: 20,
      text: "Бывают ли у вас галлюцинации или паранойя?",
      type: "yes_no_text",
      placeholder: "Если да, опишите"
    },
    {
      id: 21,
      text: "Чувствуете ли вы хроническую пустоту или скуку?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Редко", max: "Постоянно" } }
    },
    {
      id: 22,
      text: "Есть ли у вас проблемы с доверием или страх отвержения в отношениях?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 23,
      text: "Испытываете ли вы бессонницу или чрезмерный сон во время эмоциональных спадов?",
      type: "yes_no_text",
      placeholder: "Укажите тип нарушения сна"
    },
    {
      id: 24,
      text: "Бывают ли у вас компульсивные покупки или долги из-за импульсов?",
      type: "yes_no_text",
      placeholder: "Укажите сумму долгов, если применимо"
    },
    {
      id: 25,
      text: "Чувствуете ли вы себя \"другим человеком\" в разных ситуациях (расщепление идентичности)?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 26,
      text: "Какой максимальный бюджет на один сеанс вы можете себе позволить?",
      type: "budget"
    },
    {
      id: 27,
      text: "Сколько сеансов в месяц вы планируете (или можете себе позволить)?",
      type: "scale",
      scale: { min: 1, max: 10, labels: { min: "1 сеанс", max: "10+ сеансов" } }
    },
    {
      id: 28,
      text: "Предпочитаете ли вы бесплатные/государственные сервисы, если они доступны?",
      type: "yes_no"
    },
    {
      id: 29,
      text: "Принципиален ли вид терапии (онлайн/очно)?",
      type: "yes_no_text",
      placeholder: "Опишите ваши предпочтения по формату терапии. Если очно, то в каком городе?"
    },
    {
      id: 30,
      text: "Зависите ли вы финансово от кого-то (родителей, партнера)?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Не завишу", max: "Полностью завишу" } }
    },
    {
      id: 31,
      text: "Находитесь ли вы в абьюзивных отношениях (эмоциональный, физический, финансовый абьюз)?",
      type: "yes_no_text",
      placeholder: "Тип и продолжительность"
    },
    {
      id: 32,
      text: "Есть ли у вас зависимости от веществ или другие, негативно влияющие на вашу жизнь?",
      type: "yes_no_text",
      placeholder: "Тип и как давно"
    },
    {
      id: 33,
      text: "Чувствуете ли вы себя изолированным от друзей или семьи?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Много поддержки", max: "Полная изоляция" } }
    },
    {
      id: 34,
      text: "Были ли в вашей жизни травмы (детские, недавние)?",
      type: "yes_no_text",
      placeholder: "Краткое описание"
    },
    {
      id: 35,
      text: "Есть ли у вас хронические заболевания, влияющие на психическое здоровье?",
      type: "yes_no_text",
      placeholder: "Какие"
    },
    {
      id: 36,
      text: "Работает ли ваш текущий график (работа/учеба) против вашего благополучия?",
      type: "yes_no_examples",
      placeholder: "Примеры стрессоров"
    },
    {
      id: 37,
      text: "Готовы ли вы делиться с психологом деталями о семье или отношениях?",
      type: "yes_no"
    },
    {
      id: 38,
      text: "Есть ли у вас доступ к безопасному месту для терапии (дом, онлайн)?",
      type: "no_text",
      placeholder: "Препятствия"
    },
    {
      id: 39,
      text: "Испытываете ли вы финансовый стресс (долги, безработица)?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Нет стресса", max: "Критический стресс" } }
    },
    {
      id: 40,
      text: "Был ли у вас предыдущий опыт терапии?",
      type: "yes_no_text",
      placeholder: "Что понравилось/не понравилось"
    },
    {
      id: 41,
      text: "Есть ли у вас дети или иждивенцы, влияющие на ваше расписание?",
      type: "yes_no_text",
      placeholder: "Как это влияет"
    },
    {
      id: 42,
      text: "Чувствуете ли вы давление от общества или культуры по поводу психического здоровья?",
      type: "yes_no_examples",
      placeholder: "Примеры"
    },
    {
      id: 43,
      text: "Готовы ли вы к изменениям в образе жизни (например, отказ от зависимостей)?",
      type: "yes_no_scale",
      scale: { min: 1, max: 10, labels: { min: "Нет готовности", max: "Максимум мотивации" } }
    },
    {
      id: 44,
      text: "Какие ваши сильные стороны или ресурсы (хобби, поддержка), которые можно использовать в терапии?",
      type: "open_text"
    },
    {
      id: 45,
      text: "Введите почту, на которую мы пришлём персональный план:",
      type: "email"
    }
  ];

  res.json(questions);
});

// Сохранить результаты первичного теста
router.post('/primary/save', async (req, res) => {
  try {
    const { sessionId, answers, email } = req.body;
    
    const result = await pool.query(
      'INSERT INTO primary_test_results (session_id, email, answers) VALUES ($1, $2, $3) ON CONFLICT (session_id) DO UPDATE SET answers = $3, email = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [sessionId, email, JSON.stringify(answers)]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error saving primary test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Отправить результаты первичного теста (алиас для /save)
router.post('/primary/submit', async (req, res) => {
  try {
    const { sessionId, answers } = req.body;
    
    console.log('📥 Получены результаты теста для sessionId:', sessionId);
    console.log('📊 Количество ответов:', answers.length);
    
    // Определяем вопросы для поиска email
    const questions = [
      { id: 1, type: "yes_no_scale" },
      { id: 2, type: "yes_no_text" },
      { id: 3, type: "yes_no_scale" },
      { id: 4, type: "yes_no_examples" },
      { id: 5, type: "yes_no_scale" },
      { id: 6, type: "yes_no_text" },
      { id: 7, type: "yes_no_text" },
      { id: 8, type: "yes_no_text" },
      { id: 9, type: "yes_no_scale" },
      { id: 10, type: "yes_no_examples" },
      { id: 11, type: "yes_no_text" },
      { id: 12, type: "yes_no_scale" },
      { id: 13, type: "yes_no_text" },
      { id: 14, type: "yes_no_scale" },
      { id: 15, type: "yes_no_text" },
      { id: 16, type: "yes_no_examples" },
      { id: 17, type: "yes_no_text" },
      { id: 18, type: "yes_no_scale" },
      { id: 19, type: "yes_no_text" },
      { id: 20, type: "yes_no_text" },
      { id: 21, type: "yes_no_scale" },
      { id: 22, type: "yes_no_text" },
      { id: 23, type: "yes_no_text" },
      { id: 24, type: "yes_no_examples" },
      { id: 25, type: "yes_no_text" },
      { id: 26, type: "budget" },
      { id: 27, type: "scale" },
      { id: 28, type: "yes_no" },
      { id: 29, type: "yes_no_text" },
      { id: 30, type: "yes_no_scale" },
      { id: 31, type: "yes_no_text" },
      { id: 32, type: "yes_no_text" },
      { id: 33, type: "yes_no_scale" },
      { id: 34, type: "yes_no_text" },
      { id: 35, type: "yes_no_text" },
      { id: 36, type: "yes_no_text" },
      { id: 37, type: "yes_no" },
      { id: 38, type: "no_text" },
      { id: 39, type: "yes_no_scale" },
      { id: 40, type: "yes_no_text" },
      { id: 41, type: "yes_no_text" },
      { id: 42, type: "yes_no_text" },
      { id: 43, type: "yes_no_examples" },
      { id: 44, type: "open_text" },
      { id: 45, type: "email" }
    ];
    
    const { email } = req.body;
    console.log('📧 Email из запроса:', email);
    
    const result = await pool.query(
      'INSERT INTO primary_test_results (session_id, email, answers) VALUES ($1, $2, $3) ON CONFLICT (session_id) DO UPDATE SET answers = $3, email = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [sessionId, email, JSON.stringify(answers)]
    );

    console.log('✅ Результаты теста сохранены в БД');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Ошибка при сохранении результатов теста:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить результаты первичного теста
router.get('/primary/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM primary_test_results WHERE session_id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching primary test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Сохранить результаты дополнительного теста
router.post('/additional/save', async (req, res) => {
  try {
    const { sessionId, testName, testUrl, testResult } = req.body;
    
    const result = await pool.query(
      'INSERT INTO additional_test_results (session_id, test_name, test_url, test_result) VALUES ($1, $2, $3, $4) RETURNING *',
      [sessionId, testName, testUrl, testResult]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error saving additional test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Сохранить результат дополнительного теста
router.post('/additional/save-result', async (req, res) => {
  try {
    const { sessionId, testName, testUrl, testResult } = req.body;
    
    console.log('💾 Сохраняем результат теста:', { sessionId, testName, testResult });
    
    // Проверяем, что sessionId не пустой
    if (!sessionId || sessionId.trim() === '') {
      console.log('❌ SessionId пустой или отсутствует');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем email пользователя из primary_test_results
    const primaryTest = await pool.query(
      'SELECT email FROM primary_test_results WHERE session_id = $1',
      [sessionId]
    );
    
    if (primaryTest.rows.length === 0) {
      console.log('❌ Primary test не найден для sessionId:', sessionId);
      return res.status(404).json({ success: false, error: 'Primary test not found' });
    }
    
    const email = primaryTest.rows[0].email;
    console.log('📧 Email пользователя:', email);
    console.log('✅ Primary test найден для sessionId:', sessionId);
    
    // Проверяем, существует ли уже результат для этого теста
    const existingResult = await pool.query(
      'SELECT id FROM additional_test_results WHERE session_id = $1 AND test_name = $2',
      [sessionId, testName]
    );
    
    console.log('🔍 Существующий результат:', existingResult.rows);
    
    let result;
    if (existingResult.rows.length > 0) {
      // Обновляем существующий результат
      console.log('🔄 Обновляем существующий результат');
      result = await pool.query(
        'UPDATE additional_test_results SET test_result = $1, test_url = $2, email = $3 WHERE session_id = $4 AND test_name = $5 RETURNING *',
        [testResult, testUrl, email, sessionId, testName]
      );
    } else {
      // Создаем новый результат
      console.log('➕ Создаем новый результат');
      result = await pool.query(
        'INSERT INTO additional_test_results (session_id, email, test_name, test_url, test_result) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [sessionId, email, testName, testUrl, testResult]
      );
    }

    console.log('✅ Результат теста сохранен в БД');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Ошибка при сохранении результата теста:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить результаты дополнительных тестов по sessionId
router.get('/additional/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM additional_test_results WHERE session_id = $1 ORDER BY created_at DESC',
      [sessionId]
    );

    res.json({ success: true, results: result.rows });
  } catch (error) {
    console.error('Error fetching additional tests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить результаты дополнительных тестов по email
router.get('/additional/results-by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log('📧 Загружаем результаты по email:', email);
    
    const result = await pool.query(
      'SELECT * FROM additional_test_results WHERE email = $1 ORDER BY created_at DESC',
      [email]
    );

    console.log('📊 Найдено результатов:', result.rows.length);
    res.json({ success: true, results: result.rows });
  } catch (error) {
    console.error('Error fetching additional tests by email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
