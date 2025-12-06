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

/**
 * Запустить отправку heartbeat для отслеживания онлайн пользователей
 * Отправляет событие каждые 30 секунд пока вкладка активна
 */
export const startHeartbeat = () => {
  const sessionId = getOrCreateSessionId();
  const currentPath = window.location.pathname;
  
  // Не отправляем heartbeat для /chat и /cms
  if (currentPath.startsWith('/chat') || currentPath.startsWith('/cms')) {
    console.log('📊 [HEARTBEAT] Пропускаем heartbeat для', currentPath);
    return;
  }
  
  // Отправляем первый heartbeat сразу
  trackEvent('heartbeat', sessionId, { page: currentPath });
  
  // Затем каждые 30 секунд
  const interval = setInterval(() => {
    const path = window.location.pathname;
    
    // Проверяем что не перешли на /chat или /cms
    if (path.startsWith('/chat') || path.startsWith('/cms')) {
      clearInterval(interval);
      return;
    }
    
    // Проверяем что вкладка активна (не свернута)
    if (document.visibilityState === 'visible') {
      trackEvent('heartbeat', sessionId, { page: path });
    }
  }, 30000); // 30 секунд
  
  // Очищаем interval при закрытии страницы
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
  
  // Останавливаем heartbeat если вкладка неактивна больше 2 минут
  let lastActiveTime = Date.now();
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastActiveTime = Date.now();
      // Отправляем heartbeat при возвращении на вкладку
      trackEvent('heartbeat', sessionId, { page: window.location.pathname });
    } else {
      // Если вкладка свернута больше 2 минут - останавливаем
      setTimeout(() => {
        if (Date.now() - lastActiveTime > 120000) {
          clearInterval(interval);
        }
      }, 120000);
    }
  });
};

