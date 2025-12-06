import { apiRequest } from '../config/api';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let isHeartbeatActive = false;

/**
 * Получить или создать WebSocket соединение
 */
function getSocket(): Socket {
  if (!socket || !socket.connected) {
    // @ts-ignore
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 
                      ((import.meta as any).env?.MODE === 'development' ? 'http://localhost:5000' : 'https://idenself.com');
    
    console.log('🔌 [WS] Подключаемся к WebSocket:', apiBaseUrl);
    
    socket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socket.on('connect', () => {
      console.log('✅ [WS] Подключено к WebSocket, ID:', socket?.id);
      
      // При переподключении отправляем user_online снова
      const sessionId = getOrCreateSessionId();
      const currentPath = window.location.pathname;
      
      if (!currentPath.startsWith('/chat') && !currentPath.startsWith('/cms')) {
        socket?.emit('user_online', { sessionId, page: currentPath });
        console.log('🟢 [WS] user_online отправлен:', { sessionId, page: currentPath });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ [WS] Отключено от WebSocket, причина:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ [WS] Ошибка подключения:', error.message);
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
  // Приоритет: sessionId из dashboard/test (localStorage) > sessionStorage > новый
  let sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
  
  console.log('🔍 [SESSION] Ищем sessionId в localStorage:', localStorage.getItem('sessionId'));
  console.log('🔍 [SESSION] Ищем sessionId в sessionStorage:', sessionStorage.getItem('sessionId'));
  
  if (!sessionId) {
    // Проверяем testProgress
    const testProgress = localStorage.getItem('testProgress');
    if (testProgress) {
      try {
        const data = JSON.parse(testProgress);
        if (data.sessionId) {
          sessionId = data.sessionId;
          console.log('🔍 [SESSION] Найден sessionId в testProgress:', sessionId);
        }
      } catch (e) {
        console.error('❌ [SESSION] Ошибка парсинга testProgress:', e);
      }
    }
  }
  
  if (!sessionId) {
    // Создаём новый только если нигде не нашли
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('sessionId', sessionId);
    console.log('⚠️ [SESSION] Создан НОВЫЙ sessionId:', sessionId);
  } else {
    console.log('✅ [SESSION] Используем существующий sessionId:', sessionId);
  }
  
  return sessionId;
};

/**
 * Запустить WebSocket соединение для отслеживания онлайн статуса
 * ВАЖНО: Вызывается только один раз при загрузке приложения!
 */
export const startHeartbeat = () => {
  // Если уже активен - не запускаем повторно
  if (isHeartbeatActive) {
    console.log('⚠️ [WS] Heartbeat уже активен, пропускаем');
    return;
  }
  
  const currentPath = window.location.pathname;
  
  // Не подключаемся для /chat и /cms
  if (currentPath.startsWith('/chat') || currentPath.startsWith('/cms')) {
    console.log('📊 [WS] Пропускаем WebSocket для', currentPath);
    return;
  }
  
  isHeartbeatActive = true;
  console.log('🚀 [WS] Запускаем heartbeat систему');
  
  const sessionId = getOrCreateSessionId();
  console.log('🔑 [WS] Session ID:', sessionId);
  
  const socket = getSocket();
  
  // Отправляем статус "онлайн" при подключении (если уже подключен)
  if (socket.connected) {
    socket.emit('user_online', { sessionId, page: currentPath });
    console.log('🟢 [WS] user_online отправлен сразу:', { sessionId, page: currentPath });
  }
  
  // Heartbeat каждые 30 секунд
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(() => {
    const path = window.location.pathname;
    
    // Проверяем что не перешли на /chat или /cms
    if (path.startsWith('/chat') || path.startsWith('/cms')) {
      console.log('🛑 [WS] Остановка heartbeat - перешли на', path);
      stopHeartbeat();
      return;
    }
    
    // Отправляем heartbeat только если вкладка активна
    if (document.visibilityState === 'visible' && socket.connected) {
      socket.emit('heartbeat', { sessionId, page: path });
      console.log('💓 [WS] Heartbeat отправлен');
    }
  }, 30000);
  
  // Отключаемся при закрытии страницы
  const handleBeforeUnload = () => {
    console.log('👋 [WS] Закрытие страницы');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    socket.disconnect();
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Паузим heartbeat если вкладка неактивна
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const path = window.location.pathname;
      if (!path.startsWith('/chat') && !path.startsWith('/cms')) {
        // При возвращении отправляем user_online снова
        socket.emit('user_online', { sessionId, page: path });
        console.log('👁️ [WS] Вкладка активна, user_online отправлен');
      }
    } else {
      console.log('😴 [WS] Вкладка неактивна');
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
};

/**
 * Остановить heartbeat
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  if (socket && socket.connected) {
    socket.disconnect();
  }
  
  isHeartbeatActive = false;
  console.log('🛑 [WS] Heartbeat остановлен');
}

