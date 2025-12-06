import { apiRequest } from '../config/api';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Получить или создать WebSocket соединение
 */
function getSocket(): Socket {
  if (!socket) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                      (import.meta.env.DEV ? 'http://localhost:5000' : 'https://idenself.com');
    
    console.log('🔌 [WS] Подключаемся к WebSocket:', apiBaseUrl);
    
    socket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socket.on('connect', () => {
      console.log('✅ [WS] Подключено к WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('❌ [WS] Отключено от WebSocket');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ [WS] Ошибка подключения:', error);
    });
  }
  
  return socket;
}

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
 * ВАЖНО: Использует тот же sessionId что и в тесте!
 */
export const getOrCreateSessionId = (): string => {
  // Приоритет: sessionId из теста (localStorage) > sessionStorage > новый
  let sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
  
  if (!sessionId) {
    // Проверяем testProgress
    const testProgress = localStorage.getItem('testProgress');
    if (testProgress) {
      try {
        const data = JSON.parse(testProgress);
        if (data.sessionId) {
          sessionId = data.sessionId;
        }
      } catch (e) {
        console.error('Ошибка парсинга testProgress:', e);
      }
    }
  }
  
  if (!sessionId) {
    // Создаём новый только если нигде не нашли
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  
  return sessionId;
};

/**
 * Запустить WebSocket соединение для отслеживания онлайн статуса
 */
export const startHeartbeat = () => {
  const currentPath = window.location.pathname;
  
  // Не подключаемся для /chat и /cms
  if (currentPath.startsWith('/chat') || currentPath.startsWith('/cms')) {
    console.log('📊 [WS] Пропускаем WebSocket для', currentPath);
    return;
  }
  
  const sessionId = getOrCreateSessionId();
  const socket = getSocket();
  
  // Отправляем статус "онлайн" при подключении
  socket.emit('user_online', { sessionId, page: currentPath });
  console.log('🟢 [WS] Отправили user_online:', sessionId);
  
  // Heartbeat каждые 30 секунд
  const heartbeatInterval = setInterval(() => {
    const path = window.location.pathname;
    
    // Проверяем что не перешли на /chat или /cms
    if (path.startsWith('/chat') || path.startsWith('/cms')) {
      clearInterval(heartbeatInterval);
      socket.disconnect();
      return;
    }
    
    // Отправляем heartbeat только если вкладка активна
    if (document.visibilityState === 'visible') {
      socket.emit('heartbeat', { sessionId, page: path });
    }
  }, 30000);
  
  // Отключаемся при закрытии страницы
  window.addEventListener('beforeunload', () => {
    clearInterval(heartbeatInterval);
    socket.disconnect();
  });
  
  // Паузим heartbeat если вкладка неактивна
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // При возвращении отправляем user_online снова
      socket.emit('user_online', { sessionId, page: window.location.pathname });
    }
  });
};

