import express from 'express';
import { supabase } from '../index.js';
import crypto from 'crypto';

const router = express.Router();

// Создать учетные данные для доступа к ЛК
router.post('/create-credentials', async (req, res) => {
  try {
    const { sessionId, nickname, password } = req.body;

    if (!sessionId || !nickname || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Все поля обязательны' 
      });
    }

    // Генерируем уникальный токен для доступа к ЛК
    const dashboardToken = crypto.randomUUID();

    // Обновляем запись в primary_test_results
    const { data, error } = await supabase
      .from('primary_test_results')
      .update({
        nickname: nickname,
        dashboard_password: password,
        dashboard_token: dashboardToken,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Ошибка при сохранении учетных данных:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Ошибка при сохранении данных' 
      });
    }

    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Сессия не найдена' 
      });
    }

    console.log('✅ Учетные данные успешно сохранены для сессии:', sessionId);

    res.json({ 
      success: true, 
      dashboardToken,
      message: 'Учетные данные успешно сохранены'
    });

  } catch (error) {
    console.error('Ошибка при создании учетных данных:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

export default router;
