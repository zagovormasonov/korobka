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

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [ANALYTICS] Ошибка tracking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

