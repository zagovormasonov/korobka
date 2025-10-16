import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

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
    generateDocumentsInBackground(sessionId);

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
    console.log('🔄 [BACKGROUND-GENERATION] Начинаем последовательную генерацию документов для sessionId:', sessionId);
    
    const baseUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
    
    // Проверяем, не запущена ли уже генерация
    const { data: existingData, error: fetchError } = await supabase
      .from('primary_test_results')
      .select('documents_generation_started, documents_generation_completed, personal_plan_generated, session_preparation_generated, psychologist_pdf_generated')
      .eq('session_id', sessionId)
      .single();

    if (fetchError) {
      console.error('❌ [BACKGROUND-GENERATION] Ошибка при получении данных:', fetchError);
      return;
    }

    if (existingData.documents_generation_completed) {
      console.log('⚠️ [BACKGROUND-GENERATION] Генерация уже завершена для sessionId:', sessionId);
      return;
    }

    if (existingData.documents_generation_started && !existingData.documents_generation_completed) {
      console.log('⚠️ [BACKGROUND-GENERATION] Генерация уже запущена для sessionId:', sessionId);
      return;
    }
    
    // 1. Генерируем персональный план (если еще не сгенерирован)
    if (!existingData.personal_plan_generated) {
      console.log('📝 [BACKGROUND-GENERATION] Генерируем персональный план...');
      try {
        const planResponse = await fetch(`${baseUrl}/api/ai/personal-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (planResponse.ok) {
          const planData = await planResponse.json();
          if (planData.success) {
            await supabase
              .from('primary_test_results')
              .update({ personal_plan_generated: true })
              .eq('session_id', sessionId);
            console.log('✅ [BACKGROUND-GENERATION] Персональный план сгенерирован');
          }
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
      console.log('📋 [BACKGROUND-GENERATION] Генерируем подготовку к сеансу на основе персонального плана...');
      try {
        const sessionResponse = await fetch(`${baseUrl}/api/ai/session-preparation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, specialistType: 'psychologist' }),
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.success) {
            await supabase
              .from('primary_test_results')
              .update({ 
                session_preparation_generated: true,
                session_preparation_content: sessionData.content
              })
              .eq('session_id', sessionId);
            console.log('✅ [BACKGROUND-GENERATION] Подготовка к сеансу сгенерирована');
          }
        }
      } catch (error) {
        console.error('❌ [BACKGROUND-GENERATION] Ошибка генерации подготовки к сеансу:', error);
        return;
      }
    } else {
      console.log('✅ [BACKGROUND-GENERATION] Подготовка к сеансу уже сгенерирована');
    }

    // 3. Генерируем PDF для психолога (на основе подготовки к сеансу)
    if (!existingData.psychologist_pdf_generated) {
      console.log('📄 [BACKGROUND-GENERATION] Генерируем PDF для психолога на основе подготовки к сеансу...');
      try {
        const pdfResponse = await fetch(`${baseUrl}/api/pdf/psychologist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (pdfResponse.ok) {
          const pdfContent = await pdfResponse.text();
          await supabase
            .from('primary_test_results')
            .update({ 
              psychologist_pdf_generated: true,
              psychologist_pdf_content: pdfContent
            })
            .eq('session_id', sessionId);
          console.log('✅ [BACKGROUND-GENERATION] PDF для психолога сгенерирован');
        }
      } catch (error) {
        console.error('❌ [BACKGROUND-GENERATION] Ошибка генерации PDF для психолога:', error);
        return;
      }
    } else {
      console.log('✅ [BACKGROUND-GENERATION] PDF для психолога уже сгенерирован');
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
    
    // Отмечаем ошибку в БД
    await supabase
      .from('primary_test_results')
      .update({ 
        documents_generation_completed: false,
        documents_generation_completed_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
  }
}

export default router;
