import { apiRequest } from '../config/api';

/**
 * Отправка события аналитики на сервер
 * @param eventType - тип события (test_start, test_complete, payment_success и т.д.)
 * @param sessionId - ID сессии пользователя
 * @param metadata - дополнительные данные (номер вопроса, тип теста и т.д.)
 */
export const trackEvent = async (
  eventType: string,
  sessionId: string,
  metadata?: Record<string, any>
) => {
  try {
    const pageUrl = window.location.pathname;
    
    await apiRequest('api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        eventType,
        pageUrl,
        metadata
      })
    });
    
    console.log(`📊 [ANALYTICS] Событие отправлено: ${eventType}`, metadata);
  } catch (error) {
    console.error(`❌ [ANALYTICS] Ошибка отправки события ${eventType}:`, error);
    // Не блокируем выполнение, если аналитика не работает
  }
};

/**
 * Получить или создать session ID для аналитики
 */
export const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  
  if (!sessionId) {
    // Проверяем, может быть есть основной sessionId
    sessionId = sessionStorage.getItem('sessionId') || localStorage.getItem('sessionId');
    
    if (!sessionId) {
      // Создаём новый
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  
  return sessionId;
};

