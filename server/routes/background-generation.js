import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

// Инициализируем глобальный объект для отслеживания запущенных генераций
if (!global.generationInProgress) {
  global.generationInProgress = new Set();
}

// Запуск фоновой генерации документов
router.post('/start', async (req, res) => {
  try {
    console.log('🚀 [BACKGROUND-GENERATION] Запуск фоновой генерации документов');
    const { sessionId } = req.body;
    
    if (!sessionId) {
      console.error('❌ [BACKGROUND-GENERATION] SessionId не передан');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }

    // Проверяем, не запущена ли уже генерация
    const { data: existingData, error: fetchError } = await supabase
      .from('primary_test_results')
      .select('documents_generation_started, documents_generation_completed')
      .eq('session_id', sessionId)
      .single();

    if (fetchError) {
      console.error('❌ [BACKGROUND-GENERATION] Ошибка при получении данных:', fetchError);
      return res.status(500).json({ success: false, error: 'Failed to fetch session data' });
    }

    if (existingData.documents_generation_started) {
      console.log('⚠️ [BACKGROUND-GENERATION] Генерация уже запущена для sessionId:', sessionId);
      
      // Если генерация не завершена, принудительно запускаем её снова
      if (!existingData.documents_generation_completed) {
        console.log('🔄 [BACKGROUND-GENERATION] Принудительно перезапускаем генерацию...');
        generateDocumentsInBackground(sessionId).catch(error => {
          console.error('❌ [BACKGROUND-GENERATION] Ошибка в принудительной генерации:', error);
        });
      }
      
      return res.json({ 
        success: true, 
        message: 'Generation already started',
        status: existingData.documents_generation_completed ? 'completed' : 'in_progress'
      });
    }

    // Отмечаем, что генерация началась
    const { error: updateError } = await supabase
      .from('primary_test_results')
      .update({ 
        documents_generation_started: true,
        documents_generation_started_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('❌ [BACKGROUND-GENERATION] Ошибка при обновлении статуса:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update generation status' });
    }

    // Запускаем фоновую генерацию (не ждем завершения)
    console.log('🚀 [BACKGROUND-GENERATION] Запускаем функцию generateDocumentsInBackground...');
    console.log('🚀 [BACKGROUND-GENERATION] SessionId для генерации:', sessionId);
    generateDocumentsInBackground(sessionId).catch(error => {
      console.error('❌ [BACKGROUND-GENERATION] Ошибка в фоновой генерации:', error);
    });

    console.log('✅ [BACKGROUND-GENERATION] Фоновая генерация запущена для sessionId:', sessionId);
    res.json({ 
      success: true, 
      message: 'Background generation started',
      status: 'started'
    });

  } catch (error) {
    console.error('❌ [BACKGROUND-GENERATION] Ошибка:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Проверка статуса генерации документов
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }

    const { data, error } = await supabase
      .from('primary_test_results')
      .select(`
        documents_generation_started,
        documents_generation_completed,
        personal_plan_generated,
        session_preparation_generated,
        psychologist_pdf_generated,
        documents_generation_started_at,
        documents_generation_completed_at
      `)
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('❌ [BACKGROUND-GENERATION-STATUS] Ошибка:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch status' });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Если генерация запущена, но не завершена, принудительно запускаем её
    // НО только если она не запущена уже в данный момент
    if (data.documents_generation_started && !data.documents_generation_completed) {
      // Проверяем, не запущена ли уже генерация в данный момент
      if (!global.generationInProgress || !global.generationInProgress.has(sessionId)) {
        console.log('🔄 [BACKGROUND-GENERATION-STATUS] Принудительно запускаем генерацию из статуса...');
        generateDocumentsInBackground(sessionId).catch(error => {
          console.error('❌ [BACKGROUND-GENERATION-STATUS] Ошибка в принудительной генерации:', error);
        });
      } else {
        console.log('⏳ [BACKGROUND-GENERATION-STATUS] Генерация уже выполняется для sessionId:', sessionId);
      }
    }

    res.json({
      success: true,
      status: data.documents_generation_completed ? 'completed' : 
              data.documents_generation_started ? 'in_progress' : 'not_started',
      documents: {
        personal_plan: data.personal_plan_generated,
        session_preparation: data.session_preparation_generated,
        psychologist_pdf: data.psychologist_pdf_generated
      },
      timestamps: {
        started_at: data.documents_generation_started_at,
        completed_at: data.documents_generation_completed_at
      }
    });

  } catch (error) {
    console.error('❌ [BACKGROUND-GENERATION-STATUS] Ошибка:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Функция для фоновой генерации документов
async function generateDocumentsInBackground(sessionId) {
  try {
    // Отмечаем, что генерация запущена
    global.generationInProgress.add(sessionId);
    
    console.log('🔄 [BACKGROUND-GENERATION] ===== ФУНКЦИЯ generateDocumentsInBackground ЗАПУЩЕНА =====');
    console.log('🔄 [BACKGROUND-GENERATION] Начинаем последовательную генерацию документов для sessionId:', sessionId);
    console.log('⏰ [BACKGROUND-GENERATION] Время начала:', new Date().toISOString());
    console.log('🔄 [BACKGROUND-GENERATION] Process ID:', process.pid);
    console.log('🔄 [BACKGROUND-GENERATION] Memory usage:', process.memoryUsage());
    console.log('🔄 [BACKGROUND-GENERATION] Node version:', process.version);
    console.log('🔄 [BACKGROUND-GENERATION] Platform:', process.platform);
    
    // Используем относительный URL для внутренних запросов
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://idenself.com' 
      : `http://127.0.0.1:${process.env.PORT || 5000}`;
    
    // Проверяем, не запущена ли уже генерация
    console.log('🔍 [BACKGROUND-GENERATION] Запрашиваем данные из БД для sessionId:', sessionId);
    const { data: existingData, error: fetchError } = await supabase
      .from('primary_test_results')
      .select('documents_generation_started, documents_generation_completed, personal_plan_generated, session_preparation_generated, psychologist_pdf_generated')
      .eq('session_id', sessionId)
      .single();
    
    console.log('📊 [BACKGROUND-GENERATION] Результат запроса к БД:', {
      hasData: !!existingData,
      hasError: !!fetchError,
      errorMessage: fetchError?.message
    });

    if (fetchError) {
      console.error('❌ [BACKGROUND-GENERATION] Ошибка при получении данных:', fetchError);
      return;
    }

    console.log('📊 [BACKGROUND-GENERATION] Данные из БД:', {
      documents_generation_started: existingData.documents_generation_started,
      documents_generation_completed: existingData.documents_generation_completed,
      personal_plan_generated: existingData.personal_plan_generated,
      session_preparation_generated: existingData.session_preparation_generated,
      psychologist_pdf_generated: existingData.psychologist_pdf_generated
    });

    if (existingData.documents_generation_completed) {
      console.log('⚠️ [BACKGROUND-GENERATION] Генерация уже завершена для sessionId:', sessionId);
      return;
    }

    if (existingData.documents_generation_started && !existingData.documents_generation_completed) {
      console.log('⚠️ [BACKGROUND-GENERATION] Генерация уже запущена для sessionId:', sessionId);
      console.log('🔄 [BACKGROUND-GENERATION] Продолжаем генерацию с того места, где остановились...');
      // НЕ выходим из функции, продолжаем генерацию
    }
    
    // 1. Генерируем персональный план (если еще не сгенерирован)
    if (!existingData.personal_plan_generated) {
      console.log('📝 [BACKGROUND-GENERATION] === ЭТАП 1: Генерация персонального плана ===');
      console.log('📝 [BACKGROUND-GENERATION] Генерируем персональный план...');
      console.log('🔗 [BACKGROUND-GENERATION] URL для запроса:', `${baseUrl}/api/ai/personal-plan`);
      console.log('📤 [BACKGROUND-GENERATION] Отправляем запрос с sessionId:', sessionId);
      console.log('⏰ [BACKGROUND-GENERATION] Время начала этапа 1:', new Date().toISOString());
      console.log('🌐 [BACKGROUND-GENERATION] Выполняем fetch запрос к:', `${baseUrl}/api/ai/personal-plan`);
      try {
        const planResponse = await fetch(`${baseUrl}/api/pdf/personal-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          signal: AbortSignal.timeout(300000), // 5 минут timeout
        });

        console.log('📥 [BACKGROUND-GENERATION] Получен ответ от AI API:', planResponse.status, planResponse.statusText);
        console.log('⏰ [BACKGROUND-GENERATION] Время получения ответа:', new Date().toISOString());
        
        if (planResponse.ok) {
          // PDF endpoint возвращает PDF blob, но нам нужно только отметить, что план сгенерирован
          const { error: updateError } = await supabase
            .from('primary_test_results')
            .update({ personal_plan_generated: true })
            .eq('session_id', sessionId);
          
          if (updateError) {
            console.error('❌ [BACKGROUND-GENERATION] Ошибка обновления БД:', updateError);
          } else {
            console.log('✅ [BACKGROUND-GENERATION] БД обновлена: personal_plan_generated = true');
          }
          console.log('✅ [BACKGROUND-GENERATION] Персональный план сгенерирован');
          console.log('⏰ [BACKGROUND-GENERATION] Время завершения этапа 1:', new Date().toISOString());
          console.log('🔄 [BACKGROUND-GENERATION] Переходим к этапу 2...');
        } else {
          const errorText = await planResponse.text();
          console.error('❌ [BACKGROUND-GENERATION] HTTP ошибка при генерации персонального плана:', planResponse.status, errorText);
          return;
        }
      } catch (error) {
        console.error('❌ [BACKGROUND-GENERATION] Ошибка генерации персонального плана:', error);
        return;
      }
    } else {
      console.log('✅ [BACKGROUND-GENERATION] Персональный план уже сгенерирован');
    }

    // 2. Генерируем подготовку к сеансу (на основе персонального плана)
    if (!existingData.session_preparation_generated) {
      console.log('📋 [BACKGROUND-GENERATION] === ЭТАП 2: Генерация подготовки к сеансу ===');
      console.log('📋 [BACKGROUND-GENERATION] Генерируем подготовку к сеансу на основе персонального плана...');
      console.log('⏰ [BACKGROUND-GENERATION] Время начала этапа 2:', new Date().toISOString());
      try {
        const sessionResponse = await fetch(`${baseUrl}/api/pdf/session-preparation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, specialistType: 'psychologist' }),
          signal: AbortSignal.timeout(300000), // 5 минут timeout
        });

        if (sessionResponse.ok) {
          // PDF endpoint возвращает PDF blob, но нам нужно только отметить, что подготовка сгенерирована
          const { error: updateError } = await supabase
            .from('primary_test_results')
            .update({ session_preparation_generated: true })
            .eq('session_id', sessionId);
          
          if (updateError) {
            console.error('❌ [BACKGROUND-GENERATION] Ошибка обновления БД:', updateError);
          } else {
            console.log('✅ [BACKGROUND-GENERATION] БД обновлена: session_preparation_generated = true');
          }
          console.log('✅ [BACKGROUND-GENERATION] Подготовка к сеансу сгенерирована');
          console.log('⏰ [BACKGROUND-GENERATION] Время завершения этапа 2:', new Date().toISOString());
          console.log('🔄 [BACKGROUND-GENERATION] Переходим к этапу 3...');
        } else {
          const errorText = await sessionResponse.text();
          console.error('❌ [BACKGROUND-GENERATION] HTTP ошибка при генерации подготовки к сеансу:', sessionResponse.status, errorText);
          return;
        }
      } catch (error) {
        console.error('❌ [BACKGROUND-GENERATION] Ошибка генерации подготовки к сеансу:', error);
        return;
      }
    } else {
      console.log('✅ [BACKGROUND-GENERATION] Подготовка к сеансу уже сгенерирована');
    }

    // 3. Генерируем рекомендации для психолога (на основе подготовки к сеансу)
    if (!existingData.psychologist_pdf_generated) {
      console.log('📄 [BACKGROUND-GENERATION] === ЭТАП 3: Генерация рекомендаций для психолога ===');
      console.log('📄 [BACKGROUND-GENERATION] Генерируем рекомендации для психолога на основе подготовки к сеансу...');
      console.log('⏰ [BACKGROUND-GENERATION] Время начала этапа 3:', new Date().toISOString());
      try {
        const pdfResponse = await fetch(`${baseUrl}/api/pdf/psychologist-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          signal: AbortSignal.timeout(300000), // 5 минут timeout
        });

        console.log('📥 [BACKGROUND-GENERATION] Получен ответ от psychologist API:', pdfResponse.status, pdfResponse.statusText);
        
        if (pdfResponse.ok) {
          // PDF endpoint возвращает PDF blob, но нам нужно только отметить, что рекомендации сгенерированы
          const { error: updateError } = await supabase
            .from('primary_test_results')
            .update({ psychologist_pdf_generated: true })
            .eq('session_id', sessionId);
          
          if (updateError) {
            console.error('❌ [BACKGROUND-GENERATION] Ошибка обновления БД:', updateError);
          } else {
            console.log('✅ [BACKGROUND-GENERATION] БД обновлена: psychologist_pdf_generated = true');
          }
          console.log('✅ [BACKGROUND-GENERATION] Рекомендации для психолога сгенерированы');
          console.log('⏰ [BACKGROUND-GENERATION] Время завершения этапа 3:', new Date().toISOString());
        } else {
          const errorText = await pdfResponse.text();
          console.error('❌ [BACKGROUND-GENERATION] HTTP ошибка при генерации рекомендаций для психолога:', pdfResponse.status, errorText);
          return;
        }
      } catch (error) {
        console.error('❌ [BACKGROUND-GENERATION] Ошибка генерации рекомендаций для психолога:', error);
        return;
      }
    } else {
      console.log('✅ [BACKGROUND-GENERATION] Рекомендации для психолога уже сгенерированы');
    }

    // Отмечаем, что генерация завершена
    await supabase
      .from('primary_test_results')
      .update({ 
        documents_generation_completed: true,
        documents_generation_completed_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    console.log('🎉 [BACKGROUND-GENERATION] Все документы сгенерированы для sessionId:', sessionId);

  } catch (error) {
    console.error('❌ [BACKGROUND-GENERATION] Критическая ошибка фоновой генерации:', error);
    console.error('❌ [BACKGROUND-GENERATION] Stack trace:', error.stack);
    console.error('❌ [BACKGROUND-GENERATION] SessionId:', sessionId);
    console.error('❌ [BACKGROUND-GENERATION] Error name:', error.name);
    console.error('❌ [BACKGROUND-GENERATION] Error message:', error.message);
    
    // Отмечаем ошибку в БД
    try {
      await supabase
        .from('primary_test_results')
        .update({ 
          documents_generation_completed: false,
          documents_generation_completed_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
      console.log('✅ [BACKGROUND-GENERATION] Ошибка записана в БД');
    } catch (dbError) {
      console.error('❌ [BACKGROUND-GENERATION] Ошибка при записи ошибки в БД:', dbError);
    }
  } finally {
    // Убираем из списка запущенных генераций
    global.generationInProgress.delete(sessionId);
    console.log('✅ [BACKGROUND-GENERATION] Генерация завершена для sessionId:', sessionId);
  }
}

// Скачать готовый персональный план
router.get('/download/personal-plan/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }

    // Получаем готовый персональный план из БД
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('personal_plan')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Personal plan not found' });
    }

    if (!data.personal_plan) {
      return res.status(404).json({ success: false, error: 'Personal plan not generated yet' });
    }

    // Возвращаем HTML с персональным планом
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Персональный план</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Персональный план</h1>
          <p>Дата создания: ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
        <div class="content">${data.personal_plan}</div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('❌ [DOWNLOAD-PERSONAL-PLAN] Ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Скачать готовую подготовку к сеансу
router.get('/download/session-preparation/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }

    // Получаем готовую подготовку к сеансу из БД
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('session_preparation_content')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Session preparation not found' });
    }

    if (!data.session_preparation_content) {
      return res.status(404).json({ success: false, error: 'Session preparation not generated yet' });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(data.session_preparation_content);

  } catch (error) {
    console.error('❌ [DOWNLOAD-SESSION-PREPARATION] Ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Скачать готовый PDF для психолога
router.get('/download/psychologist-pdf/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }

    // Получаем готовый PDF для психолога из БД
    const { data, error } = await supabase
      .from('primary_test_results')
      .select('psychologist_pdf_content')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Psychologist PDF not found' });
    }

    if (!data.psychologist_pdf_content) {
      return res.status(404).json({ success: false, error: 'Psychologist PDF not generated yet' });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(data.psychologist_pdf_content);

  } catch (error) {
    console.error('❌ [DOWNLOAD-PSYCHOLOGIST-PDF] Ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
