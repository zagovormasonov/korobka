import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

dotenv.config({ path: path.join(projectRoot, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Хранилище активных пользователей: sessionId -> { socketId, lastSeen, page }
const activeSessions = new Map();

export function initializeWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  console.log('🔌 WebSocket сервер инициализирован');

  io.on('connection', (socket) => {
    console.log('✅ [WS] Новое подключение:', socket.id);

    // Пользователь подключился
    socket.on('user_online', (data) => {
      const { sessionId, page } = data;
      
      // Пропускаем /chat и /cms
      if (page?.startsWith('/chat') || page?.startsWith('/cms')) {
        console.log('⚪ [WS] Пропускаем страницу:', page);
        return;
      }

      console.log(`🟢 [WS] Пользователь онлайн: ${sessionId} на ${page}`);
      
      activeSessions.set(sessionId, {
        socketId: socket.id,
        lastSeen: Date.now(),
        page: page || '/'
      });

      // Отправляем обновлённое количество в CMS
      io.emit('online_count', activeSessions.size);
      io.emit('online_users_update', Array.from(activeSessions.keys()));
      
      // Сохраняем heartbeat событие в analytics_events
      supabase
        .from('analytics_events')
        .insert({
          session_id: sessionId,
          event_type: 'heartbeat',
          page_url: page,
          metadata: { socket_id: socket.id }
        })
        .then(({ error }) => {
          if (error) console.error('❌ [WS] Ошибка сохранения heartbeat:', error);
        });
    });

    // Heartbeat для поддержания соединения
    socket.on('heartbeat', (data) => {
      const { sessionId, page } = data;
      
      if (page?.startsWith('/chat') || page?.startsWith('/cms')) {
        return;
      }

      if (activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, {
          ...activeSessions.get(sessionId),
          lastSeen: Date.now(),
          page: page || '/'
        });
      }
    });

    // Пользователь отключился
    socket.on('disconnect', () => {
      console.log('❌ [WS] Отключение:', socket.id);
      
      // Находим и удаляем сессию по socketId
      for (const [sessionId, data] of activeSessions.entries()) {
        if (data.socketId === socket.id) {
          activeSessions.delete(sessionId);
          console.log(`🔴 [WS] Пользователь офлайн: ${sessionId}`);
          break;
        }
      }

      // Отправляем обновлённое количество
      io.emit('online_count', activeSessions.size);
      io.emit('online_users_update', Array.from(activeSessions.keys()));
    });
  });

  // Очистка старых сессий каждую минуту (если нет heartbeat больше 2 минут)
  setInterval(() => {
    const now = Date.now();
    const twoMinutesAgo = now - 2 * 60 * 1000;
    let cleaned = 0;

    for (const [sessionId, data] of activeSessions.entries()) {
      if (data.lastSeen < twoMinutesAgo) {
        activeSessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [WS] Очищено ${cleaned} неактивных сессий`);
      io.emit('online_count', activeSessions.size);
      io.emit('online_users_update', Array.from(activeSessions.keys()));
    }
  }, 60000); // каждую минуту

  return io;
}

// API для получения списка онлайн пользователей
export function getOnlineUsers() {
  return Array.from(activeSessions.keys());
}

export function getOnlineCount() {
  return activeSessions.size;
}

