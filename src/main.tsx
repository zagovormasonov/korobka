import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Глобальный обработчик необработанных промисов (для Safari)
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ [UNHANDLED-PROMISE] Необработанная ошибка промиса:', event.reason);
  
  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  // Отправляем на сервер
  fetch('/api/errors/client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: {
        name: 'UnhandledPromiseRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      },
      userAgent,
      isSafari,
      isIOS,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
  }).catch(() => {
    // Игнорируем ошибки отправки
  });
  
  // Предотвращаем вывод в консоль браузера (опционально)
  // event.preventDefault();
});

// Глобальный обработчик обычных ошибок
window.addEventListener('error', (event) => {
  console.error('❌ [GLOBAL-ERROR] Глобальная ошибка:', event.error);
  
  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  // Отправляем на сервер только если это не ошибка из ErrorBoundary
  if (event.error && !event.error._handledByErrorBoundary) {
    fetch('/api/errors/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          name: event.error?.name || 'Error',
          message: event.error?.message || event.message,
          stack: event.error?.stack
        },
        userAgent,
        isSafari,
        isIOS,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Игнорируем ошибки отправки
    });
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element with id="root" not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode> 
);


