import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(projectRoot, '.env') });

const router = express.Router();

// Создаем клиент Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Отправка события (tracking)
router.post('/track', async (req, res) => {
  try {
    const { sessionId, eventType, pageUrl, metadata } = req.body;
    
    if (!sessionId || !eventType) {
      return res.status(400).json({ 
        success: false, 
        error: 'sessionId и eventType обязательны' 
      });
    }

    console.log(`📊 [ANALYTICS] Tracking событие: ${eventType} для session ${sessionId}`);
    
    // Сохраняем событие в analytics_events
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        session_id: sessionId,
        event_type: eventType,
        page_url: pageUrl || null,
        metadata: metadata || null
      });

    if (error) {
      console.error('❌ [ANALYTICS] Ошибка сохранения события:', error);
      throw error;
    }

    // Если это test_start, создаём запись в primary_test_results (если её ещё нет)
    if (eventType === 'test_start') {
      try {
        // Проверяем, существует ли уже запись для этого sessionId
        const { data: existingUser, error: checkError } = await supabase
          .from('primary_test_results')
          .select('session_id')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found, это нормально
          console.error('❌ [ANALYTICS] Ошибка проверки существующего пользователя:', checkError);
        } else if (!existingUser) {
          // Создаём новую запись без answers (пользователь только начал тест)
          const { error: insertError } = await supabase
            .from('primary_test_results')
            .insert({
              session_id: sessionId,
              answers: null, // Пока нет ответов
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('❌ [ANALYTICS] Ошибка создания записи пользователя:', insertError);
            // Не прерываем выполнение, это не критично
          } else {
            console.log(`✅ [ANALYTICS] Создана запись для нового пользователя: ${sessionId}`);
          }
        }
      } catch (userError) {
        console.error('❌ [ANALYTICS] Ошибка при создании записи пользователя:', userError);
        // Не прерываем выполнение, продолжаем
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [ANALYTICS] Ошибка tracking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

