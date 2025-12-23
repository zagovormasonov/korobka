import express from 'express';
import { sendErrorToTelegram } from '../utils/telegram-errors.js';

const router = express.Router();

router.post('/client', express.json(), async (req, res) => {
  try {
    const { error, errorInfo, userAgent, isSafari, isIOS, url, timestamp } = req.body;
    
    console.error('❌ [CLIENT-ERROR] Ошибка от клиента:', {
      error: error?.message,
      url,
      userAgent,
      isSafari,
      isIOS,
      timestamp
    });
    
    // Отправляем в Telegram
    const errorObj = new Error(error?.message || 'Client error');
    errorObj.stack = error?.stack;
    errorObj.name = error?.name || 'ClientError';
    
    await sendErrorToTelegram(errorObj, {
      source: 'client',
      url,
      userAgent,
      isSafari: isSafari ? 'true' : 'false',
      isIOS: isIOS ? 'true' : 'false',
      componentStack: errorInfo?.componentStack?.substring(0, 500),
      timestamp
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ [CLIENT-ERROR] Ошибка при обработке клиентской ошибки:', err);
    res.status(500).json({ success: false });
  }
});

export default router;

