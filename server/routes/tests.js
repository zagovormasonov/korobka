import express from 'express';
import { supabase } from '../index.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Получить вопросы первичного теста
router.get('/primary/questions', (req, res) => {
  const questions = [
    {
      id: 1,
      text: "В каком роде к вам обращаться?",
      type: "gender_choice",
      options: [
        { value: "male", label: "В мужском" },
        { value: "female", label: "В женском" }
      ]
    },
    {
      id: 2,
      text: "Испытываете ли вы периоды чрезмерной энергии, когда спите мало, но чувствуете себя полным сил и идей?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Редко", max: "Очень часто" } }
    },
    {
      id: 3,
      text: "Бывают ли у вас эпизоды глубокой грусти или депрессии, когда вы теряете интерес ко всему на недели или месяцы?",
      type: "yes_no_text",
      placeholder: "Укажите продолжительность"
    },
    {
      id: 4,
      text: "Часто ли вы чувствуете себя рассеянным, забываете вещи или не можете сосредоточиться на задачах?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Редко", max: "Очень часто" } }
    },
    {
      id: 5,
      text: "Есть ли у вас импульсивные действия, такие как необдуманные покупки или рискованное поведение?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 6,
      text: "Испытываете ли вы сильную тревогу или панику в повседневных ситуациях?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Слабо", max: "Очень сильно" } }
    },
    {
      id: 7,
      text: "Оцените интенсивность переживаний, связанных с травматическими событиями из прошлого (если такие были)",
      type: "scale",
      scale: { min: 1, max: 10, labels: { min: "1 - Нет переживаний", max: "10 - Очень интенсивные переживания" } }
    },
    {
      id: 8,
      text: "Контролируете ли вы свой вес или еду чрезмерно, например, через диеты, переедание или очищение?",
      type: "yes_no_text",
      placeholder: "Укажите тип поведения"
    },
    {
      id: 9,
      text: "Используете ли вы алкоголь, наркотики или другие вещества, чтобы справиться с эмоциями?",
      type: "yes_no_text",
      placeholder: "Укажите частоту и тип"
    },
    {
      id: 10,
      text: "Чувствуете ли вы хроническую усталость или потерю энергии без видимой причины?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Слабо", max: "Очень сильно" } }
    },
    {
      id: 11,
      text: "Бывают ли у вас маниакальные идеи, когда вы говорите быстро и не можете остановиться?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 12,
      text: "Трудно ли вам сидеть на месте, или, может, вы постоянно ёрзаете, дёргаетесь?",
      type: "yes_no_text",
      placeholder: "В каких ситуациях"
    },
    {
      id: 13,
      text: "Испытываете ли вы социальную тревогу, избегая встреч или общения?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Лёгкая", max: "Сильная" } }
    },
    {
      id: 14,
      text: "Есть ли у вас обсессивные мысли или компульсивные действия (например, перепроверка, заперли ли вы дверь по 5 раз подряд)?",
      type: "yes_no_text",
      placeholder: "Укажите тип"
    },
    {
      id: 15,
      text: "Чувствуете ли вы себя оторванным от реальности или своих эмоций в стрессовых ситуациях?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Редко", max: "Очень часто" } }
    },
    {
      id: 16,
      text: "Бывают ли у вас суицидальные мысли или попытки самоповреждения?",
      type: "yes_no_text",
      placeholder: "Если да, когда в последний раз"
    },
    {
      id: 17,
      text: "Испытывали ли вы гиперактивность в детстве, которая продолжается во взрослой жизни?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 18,
      text: "Есть ли у вас циклы настроения: от эйфории к депрессии?",
      type: "yes_no_text",
      placeholder: "Укажите продолжительность циклов"
    },
    {
      id: 19,
      text: "Трудно ли вам регулировать эмоции, например, от гнева к слезам за минуты?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Легко", max: "Очень трудно" } }
    },
    {
      id: 20,
      text: "Используете ли вы азартные игры или шопинг как способ отвлечься?",
      type: "yes_no_text",
      placeholder: "Укажите частоту"
    },
    {
      id: 21,
      text: "Бывают ли у вас галлюцинации или паранойя?",
      type: "yes_no_text",
      placeholder: "Если да, опишите"
    },
    {
      id: 22,
      text: "Чувствуете ли вы хроническую пустоту или скуку?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Редко", max: "Постоянно" } }
    },
    {
      id: 23,
      text: "Есть ли у вас проблемы с доверием или страх отвержения в отношениях?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 24,
      text: "Испытываете ли вы бессонницу или чрезмерный сон во время эмоциональных спадов?",
      type: "yes_no_text",
      placeholder: "Укажите тип нарушения сна"
    },
    {
      id: 25,
      text: "Бывают ли у вас компульсивные покупки или долги из-за импульсов?",
      type: "yes_no_text",
      placeholder: "Укажите сумму долгов, если применимо"
    },
    {
      id: 26,
      text: "Чувствуете ли вы себя \"другим человеком\" в разных ситуациях (расщепление идентичности)?",
      type: "yes_no_examples",
      placeholder: "Приведите примеры"
    },
    {
      id: 27,
      text: "Какой максимальный бюджет на один сеанс вы можете себе позволить?",
      type: "budget"
    },
    {
      id: 28,
      text: "Сколько сеансов в месяц вы планируете (или можете себе позволить)?",
      type: "scale",
      scale: { min: 0, max: 10, labels: { min: "0 сеансов", max: "10+ сеансов" } }
    },
    {
      id: 29,
      text: "Предпочитаете ли вы бесплатные/государственные клиники и психологические центры, если они доступны?",
      type: "yes_no"
    },
    {
      id: 30,
      text: "Принципиален ли вид терапии (онлайн/очно)?",
      type: "yes_no_text",
      placeholder: "Опишите ваши предпочтения по формату терапии. Если очно, то в каком городе?"
    },
    {
      id: 31,
      text: "Зависите ли вы финансово от кого-то (родителей, партнера)?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Не завишу", max: "Полностью завишу" } }
    },
    {
      id: 32,
      text: "Находитесь ли вы в абьюзивных отношениях (эмоциональный, физический, финансовый абьюз)?",
      type: "yes_no_text",
      placeholder: "Тип и продолжительность"
    },
    {
      id: 33,
      text: "Есть ли у вас зависимости от веществ или другие, негативно влияющие на вашу жизнь?",
      type: "yes_no_text",
      placeholder: "Тип и как давно"
    },
    {
      id: 34,
      text: "Чувствуете ли вы себя изолированным от друзей или семьи?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Много поддержки", max: "Полная изоляция" } }
    },
    {
      id: 35,
      text: "Были ли в вашей жизни травмы (детские, недавние)?",
      type: "yes_no_text",
      placeholder: "Краткое описание"
    },
    {
      id: 36,
      text: "Есть ли у вас хронические заболевания, влияющие на психическое здоровье?",
      type: "yes_no_text",
      placeholder: "Какие"
    },
    {
      id: 37,
      text: "Работает ли ваш текущий график (работа/учеба) против вашего благополучия?",
      type: "yes_no_examples",
      placeholder: "Примеры стрессоров"
    },
    {
      id: 39,
      text: "Есть ли у вас доступ к безопасному месту для терапии (дом, онлайн)?",
      type: "no_text",
      placeholder: "Препятствия"
    },
    {
      id: 40,
      text: "Испытываете ли вы финансовый стресс (долги, безработица)?",
      type: "yes_no_scale",
      scale: { min: 0, max: 10, labels: { min: "Нет стресса", max: "Критический стресс" } }
    },
    {
      id: 41,
      text: "Был ли у вас предыдущий опыт терапии?",
      type: "yes_no_text",
      placeholder: "Что понравилось/не понравилось"
    },
    {
      id: 42,
      text: "Есть ли у вас дети или иждивенцы, влияющие на ваше расписание?",
      type: "yes_no_text",
      placeholder: "Как это влияет"
    },
    {
      id: 43,
      text: "Чувствуете ли вы давление от общества или культуры по поводу психического здоровья?",
      type: "scale",
      scale: { min: 0, max: 10, labels: { min: "Нет давления", max: "Сильное давление" } }
    },
    {
      id: 44,
      text: "Готовы ли вы к изменениям в образе жизни (например, отказ от зависимостей)?",
      type: "scale",
      scale: { min: 0, max: 10, labels: { min: "Нет готовности", max: "Максимум мотивации" } }
    },
    {
      id: 45,
      text: "Какие ваши сильные стороны или ресурсы (хобби, поддержка), которые можно использовать в терапии?",
      type: "open_text"
    },
    {
      id: 46,
      text: "Опишите, что ещё вас беспокоит, а также дополнительные особенности вашей ситуации",
      type: "open_text"
    },
  ];

  res.json(questions);
});

// Сохранить результаты первичного теста
router.post('/primary/save', async (req, res) => {
  try {
    const { sessionId, answers, email } = req.body;
    
    const { data, error } = await supabase
      .from('primary_test_results')
      .upsert({
        session_id: sessionId,
        email: email,
        answers: answers,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
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
    
    // Email больше не обязателен, так как удален из теста
    // Генерируем уникальный токен и пароль для доступа к ЛК
    const dashboardToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const dashboardPassword = generateDashboardPassword();
    
    const { data, error } = await supabase
      .from('primary_test_results')
      .upsert({
        session_id: sessionId,
        answers: answers,
        dashboard_token: dashboardToken,
        dashboard_password: dashboardPassword,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Результаты теста сохранены в БД');
    console.log('🔑 Сгенерированный токен:', dashboardToken);
    console.log('🔐 Сгенерированный пароль:', dashboardPassword);
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Ошибка при сохранении результатов теста:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить результаты первичного теста
router.get('/primary/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('🔍 Запрос данных теста для sessionId:', sessionId);
    
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('❌ Ошибка Supabase:', error);
      throw error;
    }
    
    if (!data) {
      console.log('❌ Данные не найдены для sessionId:', sessionId);
      return res.status(404).json({ success: false, error: 'Test results not found' });
    }

    console.log('✅ Данные найдены:', {
      session_id: data.session_id,
      email: data.email,
      has_dashboard_token: !!data.dashboard_token,
      has_dashboard_password: !!data.dashboard_password
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching primary test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить пол пользователя по sessionId
router.get('/gender/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('👤 Запрос пола для sessionId:', sessionId);
    
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('answers')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('❌ Ошибка при получении пола:', error);
      // Возвращаем male по умолчанию, если не найдено
      return res.json({ success: true, gender: 'male' });
    }
    
    if (!data || !data.answers) {
      console.log('⚠️ Ответы не найдены для sessionId:', sessionId);
      return res.json({ success: true, gender: 'male' });
    }

    // Ищем ответ на вопрос о поле (questionId: 1)
    const genderAnswer = data.answers.find(a => a.questionId === 1);
    const gender = genderAnswer?.answer === 'female' ? 'female' : 'male';
    
    console.log('✅ Пол определён:', gender);
    res.json({ success: true, gender });
  } catch (error) {
    console.error('❌ Ошибка при получении пола:', error);
    res.json({ success: true, gender: 'male' }); // По умолчанию male
  }
});

// Получить результаты теста по токену ЛК
router.get('/dashboard/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('*')
      .eq('dashboard_token', token)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Dashboard not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching dashboard by token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Проверить валидность токена ЛК
router.post('/verify-dashboard-token', async (req, res) => {
  try {
    const { dashboardToken } = req.body;
    
    console.log('🔐 [VERIFY TOKEN] Проверяем dashboard token');
    
    if (!dashboardToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Токен обязателен' 
      });
    }
    
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('session_id, nickname, dashboard_token')
      .eq('dashboard_token', dashboardToken)
      .maybeSingle();

    if (error) {
      console.error('❌ [VERIFY TOKEN] Ошибка запроса:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Ошибка при проверке токена' 
      });
    }

    if (!data) {
      console.log('❌ [VERIFY TOKEN] Токен не найден');
      return res.status(401).json({ 
        success: false, 
        error: 'Недействительный токен доступа' 
      });
    }

    console.log('✅ [VERIFY TOKEN] Токен валиден');
    res.json({ 
      success: true,
      sessionId: data.session_id,
      nickname: data.nickname
    });
  } catch (error) {
    console.error('❌ [VERIFY TOKEN] Ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Проверить nickname и пароль для доступа к ЛК
router.post('/verify-nickname-credentials', async (req, res) => {
  try {
    const { nickname, password } = req.body;
    
    console.log('🔐 [VERIFY NICKNAME] Проверяем credentials для nickname:', nickname);
    
    if (!nickname || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Никнейм и пароль обязательны' 
      });
    }
    
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('nickname, dashboard_password, dashboard_token')
      .eq('nickname', nickname)
      .maybeSingle();

    if (error) {
      console.error('❌ [VERIFY NICKNAME] Ошибка запроса:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Ошибка при проверке данных' 
      });
    }

    if (!data) {
      console.log('❌ [VERIFY NICKNAME] Пользователь не найден для nickname:', nickname);
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный никнейм или пароль' 
      });
    }

    const storedPassword = data.dashboard_password;
    console.log('🔐 [VERIFY NICKNAME] Пароль из БД найден');
    
    // Сравниваем пароли (регистр важен)
    if (storedPassword === password) {
      console.log('✅ [VERIFY NICKNAME] Пароли совпадают, доступ разрешен');
      res.json({ 
        success: true, 
        dashboardToken: data.dashboard_token 
      });
    } else {
      console.log('❌ [VERIFY NICKNAME] Пароли не совпадают, доступ запрещен');
      res.status(400).json({ 
        success: false, 
        error: 'Неверный никнейм или пароль' 
      });
    }
  } catch (error) {
    console.error('❌ [VERIFY NICKNAME] Критическая ошибка:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

// Проверить email и пароль для доступа к ЛК (старый метод)
router.post('/verify-credentials', async (req, res) => {
  try {
    const { sessionId, email, password } = req.body;
    
    console.log('🔐 Проверяем credentials для sessionId:', sessionId, 'email:', email, 'password:', password);
    
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('email, dashboard_password')
      .eq('session_id', sessionId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const storedEmail = data.email;
    const storedPassword = data.dashboard_password;
    console.log('📧 Email из БД:', storedEmail);
    console.log('🔐 Пароль из БД:', storedPassword);
    
    // Сравниваем email (регистр не важен) и пароль (регистр важен)
    const emailMatch = storedEmail && email && storedEmail.toLowerCase() === email.toLowerCase();
    const passwordMatch = storedPassword && password && storedPassword === password;
    
    if (emailMatch && passwordMatch) {
      console.log('✅ Credentials совпадают, доступ разрешен');
      res.json({ success: true });
    } else {
      console.log('❌ Credentials не совпадают, доступ запрещен');
      if (!emailMatch) {
        res.status(400).json({ success: false, error: 'Invalid email' });
      } else {
        res.status(400).json({ success: false, error: 'Invalid password' });
      }
    }
  } catch (error) {
    console.error('Error verifying credentials:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Сохранить результаты дополнительного теста
router.post('/additional/save', async (req, res) => {
  try {
    const { sessionId, testName, testUrl, testResult, answers } = req.body;
    
    // Проверяем, существует ли уже результат для этого теста
    // Ищем по test_type и test_url, так как могут быть старые записи с другим test_type
    // Например, старые записи могут иметь test_type='HCL-32', а новые 'bipolar'
    // Сначала ищем по test_type, если не найдено - ищем по test_url
    let existingResult = null;
    
    if (testName) {
      const { data: resultByType } = await supabase
        .from('additional_test_results')
        .select('id, test_type')
        .eq('session_id', sessionId)
        .eq('test_type', testName)
        .maybeSingle();
      
      if (resultByType) {
        existingResult = resultByType;
      }
    }
    
    // Если не нашли по test_type, ищем по test_url (для старых записей)
    if (!existingResult && testUrl) {
      const { data: resultByUrl } = await supabase
        .from('additional_test_results')
        .select('id, test_type')
        .eq('session_id', sessionId)
        .eq('test_url', testUrl)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (resultByUrl) {
        existingResult = resultByUrl;
        console.log('🔄 [SAVE] Найдена старая запись по test_url с другим test_type:', resultByUrl.test_type, 'обновляем на:', testName);
      }
    }

    // Вычисляем score из answers, если передан объект answers
    let calculatedScore = testResult;
    if (answers && typeof answers === 'object') {
      // Если передан объект answers, вычисляем score
      calculatedScore = Object.values(answers).reduce((sum, val) => {
        if (Array.isArray(val)) {
          return sum + val.reduce((s, v) => s + v, 0);
        }
        return sum + (typeof val === 'number' ? val : 0);
      }, 0);
    }
    
    let result;
    if (existingResult) {
      // Обновляем существующий результат
      console.log('🔄 [SAVE] Обновляем существующий результат для test_type:', testName);
      const updateData = {
        test_url: testUrl,
        answers: answers || testResult // Сохраняем либо объект ответов, либо итоговый балл
        // updated_at обновляется автоматически через триггер в БД
      };
      
      // Добавляем score только если колонка существует (проверяем через try-catch или просто не добавляем)
      // Пока убираем score, так как колонки нет в схеме
      // updateData.score = calculatedScore;
      
      const { data, error } = await supabase
        .from('additional_test_results')
        .update(updateData)
        .eq('id', existingResult.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
      console.log('✅ [SAVE] Результат обновлен:', result.id);
    } else {
      // Вычисляем score из answers, если передан объект answers
      let calculatedScore = testResult;
      if (answers && typeof answers === 'object') {
        calculatedScore = Object.values(answers).reduce((sum, val) => {
          if (Array.isArray(val)) {
            return sum + val.reduce((s, v) => s + v, 0);
          }
          return sum + (typeof val === 'number' ? val : 0);
        }, 0);
      }
      
      const insertData = {
        session_id: sessionId,
        test_type: testName,
        test_url: testUrl,
        answers: answers || testResult
      };
      
      // Добавляем score только если колонка существует
      // Пока убираем score, так как колонки нет в схеме
      // insertData.score = calculatedScore;
      
      const { data, error } = await supabase
      .from('additional_test_results')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
      result = data;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error saving additional test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Сохранить результат дополнительного теста
router.post('/additional/save-result', async (req, res) => {
  try {
    const { sessionId, testName, testUrl, testResult } = req.body;
    
    console.log('💾 [ВЕРСИЯ 2.1] Получен запрос на сохранение результата теста');
    console.log('📋 Тело запроса:', JSON.stringify(req.body, null, 2));
    console.log('💾 Извлеченные данные:', { sessionId, testName, testUrl, testResult });
    console.log('🔧 Используем колонки: test_type и answers (не test_name и test_result)');
    
    // Проверяем все обязательные поля
    if (!sessionId || sessionId.trim() === '') {
      console.log('❌ SessionId пустой или отсутствует');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    if (!testName || testName.trim() === '') {
      console.log('❌ TestName пустой или отсутствует');
      return res.status(400).json({ success: false, error: 'TestName is required' });
    }
    
    if (!testResult || testResult.trim() === '') {
      console.log('❌ TestResult пустой или отсутствует');
      return res.status(400).json({ success: false, error: 'TestResult is required' });
    }
    
    // Получаем email пользователя из primary_test_results
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('email')
      .eq('session_id', sessionId)
      .single();
    
    if (primaryError || !primaryTest) {
      console.log('❌ Primary test не найден для sessionId:', sessionId);
      return res.status(404).json({ success: false, error: 'Primary test not found' });
    }
    
    const email = primaryTest.email;
    console.log('📧 Email пользователя:', email);
    console.log('✅ Primary test найден для sessionId:', sessionId);
    
    // Проверяем, существует ли уже результат для этого теста
    console.log('🔍 Ищем существующий результат с test_type =', testName);
    const { data: existingResult, error: existingError } = await supabase
      .from('additional_test_results')
      .select('id')
      .eq('session_id', sessionId)
      .eq('test_type', testName)
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.log('❌ Ошибка при поиске существующего результата:', existingError);
      throw existingError;
    }
    
    console.log('🔍 Существующий результат:', existingResult);
    
    let result;
    if (existingResult) {
      // Обновляем существующий результат
      console.log('🔄 Обновляем существующий результат');
      const { data, error } = await supabase
        .from('additional_test_results')
        .update({
          answers: req.body.answers || testResult,
          test_url: testUrl
        })
        .eq('session_id', sessionId)
        .eq('test_type', testName)
        .select()
        .single();
      
      if (error) throw error;
      result = { data };
    } else {
      // Создаем новый результат
      console.log('➕ Создаем новый результат');
      console.log('📝 Данные для вставки:', {
        session_id: sessionId,
        test_type: testName,
        test_url: testUrl,
        answers: testResult
      });
      const { data, error } = await supabase
        .from('additional_test_results')
        .insert({
          session_id: sessionId,
          test_type: testName,
          test_url: testUrl,
          answers: testResult
        })
        .select()
        .single();
      
      if (error) throw error;
      result = { data };
    }

    console.log('✅ Результат теста сохранен в БД');
    
    // НЕ запускаем генерацию здесь - она запустится только после того, как пользователь
    // введет ВСЕ результаты дополнительных тестов и нажмет кнопку "Перейти к персональному плану"
    console.log('ℹ️ [BACKGROUND-GENERATION] Генерация документов будет запущена после нажатия финальной кнопки');
    
    res.json({ success: true, data: result.data });
  } catch (error) {
    const errMsg = error?.message || String(error);
    const supaMeta = ` code=${error.code || ''} details=${error.details || ''} hint=${error.hint || ''}`;
    console.error(`❌ [TESTS] Ошибка при сохранении результата теста: ${errMsg}${supaMeta}`, error?.stack || '');
    res.status(500).json({ success: false, error: errMsg });
  }
});

// Получить результаты дополнительных тестов по sessionId
router.get('/additional/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('🔍 [RESULTS BY SESSION] Загружаем результаты по sessionId:', sessionId);
    
    // Загружаем результаты, сортируя по updated_at (если есть) или created_at
    // Дедупликация будет выполнена на фронтенде
    const { data, error } = await supabase
      .from('additional_test_results')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    console.log('🔍 [RESULTS BY SESSION] Найдено записей для sessionId', sessionId, ':', data?.length || 0);
    console.log('🔍 [RESULTS BY SESSION] Записи для sessionId:', data);

    if (error) {
      console.error('❌ [RESULTS BY SESSION] Ошибка запроса:', error);
      throw error;
    }

    res.json({ success: true, results: data || [] });
  } catch (error) {
    console.error('❌ [RESULTS BY SESSION] Error fetching additional tests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Получить результаты дополнительных тестов по email
router.get('/additional/results-by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log('📧 [RESULTS BY EMAIL] Загружаем результаты по email:', email);
    
    // Сначала проверим, есть ли вообще записи в таблице
    const { data: allData, error: allError } = await supabase
      .from('additional_test_results')
      .select('*')
      .limit(10);
    
    console.log('📊 [RESULTS BY EMAIL] Всего записей в таблице:', allData?.length || 0);
    console.log('📊 [RESULTS BY EMAIL] Первые записи:', allData?.slice(0, 3));
    
    // Теперь ищем по email
    const { data, error } = await supabase
      .from('additional_test_results')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });
    
    console.log('📧 [RESULTS BY EMAIL] Найдено записей для email', email, ':', data?.length || 0);
    console.log('📧 [RESULTS BY EMAIL] Записи для email:', data);
    
    if (error) {
      console.error('❌ [RESULTS BY EMAIL] Ошибка запроса:', error);
      throw error;
    }

    res.json({ success: true, results: data || [] });
  } catch (error) {
    console.error('❌ [RESULTS BY EMAIL] Error fetching additional tests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Функция генерации пароля для доступа к ЛК
function generateDashboardPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;
