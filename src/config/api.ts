// Конфигурация API endpoints

// Получаем базовый URL для API из переменных окружения
const getApiBaseUrl = (): string => {
  // В development используем прокси (относительные URL)
  if (import.meta.env.DEV) {
    return '';
  }
  
  // В production используем переменную окружения или fallback на Render URL
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://korobka-1.onrender.com';
  
  console.log('🔧 API Base URL:', apiUrl);
  console.log('🔧 Environment:', import.meta.env.MODE);
  console.log('🔧 Is DEV:', import.meta.env.DEV);
  
  return apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Функция для создания полного URL API запроса
export const createApiUrl = (endpoint: string): string => {
  // Убираем начальный слэш если есть
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // В development возвращаем относительный URL (прокси обработает)
  if (import.meta.env.DEV) {
    return `/${cleanEndpoint}`;
  }
  
  // В production возвращаем полный URL
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Вспомогательная функция для fetch запросов
export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const url = createApiUrl(endpoint);
  console.log(`🌐 API Request: ${options?.method || 'GET'} ${url}`);
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

