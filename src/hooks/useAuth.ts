import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { apiRequest } from '../config/api';

interface AuthData {
  sessionId: string;
  nickname: string;
  personalPlanUnlocked: boolean;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  authData: AuthData | null;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  updatePersonalPlanUnlocked: (unlocked: boolean) => void;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authData, setAuthData] = useState<AuthData | null>(null);

  const logout = () => {
    localStorage.removeItem('dashboardToken');
    sessionStorage.removeItem('dashboardToken');
    setIsAuthenticated(false);
    setAuthData(null);
    message.success('Вы вышли из системы');
  };

  const updatePersonalPlanUnlocked = (unlocked: boolean) => {
    if (authData) {
      setAuthData({
        ...authData,
        personalPlanUnlocked: unlocked
      });
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      // Сначала проверяем localStorage, потом sessionStorage
      let token = localStorage.getItem('dashboardToken');
      if (!token) {
        token = sessionStorage.getItem('dashboardToken');
        // Если токен найден в sessionStorage, переносим в localStorage
        if (token) {
          localStorage.setItem('dashboardToken', token);
          sessionStorage.removeItem('dashboardToken');
        }
      }

      if (!token) {
        console.log('❌ [AUTH] Токен не найден');
        return false;
      }

      console.log('🔐 [AUTH] Проверяем токен:', token.substring(0, 20) + '...');

      const response = await apiRequest('api/dashboard/verify-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        console.log('❌ [AUTH] Токен недействителен, статус:', response.status);
        localStorage.removeItem('dashboardToken');
        sessionStorage.removeItem('dashboardToken');
        return false;
      }

      const data = await response.json();

      if (data.success && data.sessionId) {
        console.log('✅ [AUTH] Токен валиден, sessionId:', data.sessionId);
        setAuthData({
          sessionId: data.sessionId,
          nickname: data.nickname || '',
          personalPlanUnlocked: data.personalPlanUnlocked === true
        });
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('❌ [AUTH] success=false или нет sessionId');
        localStorage.removeItem('dashboardToken');
        sessionStorage.removeItem('dashboardToken');
        return false;
      }
    } catch (error) {
      console.error('❌ [AUTH] Ошибка при проверке токена:', error);
      localStorage.removeItem('dashboardToken');
      sessionStorage.removeItem('dashboardToken');
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const isValid = await checkAuth();
      setIsLoading(false);
      
      if (!isValid) {
        setIsAuthenticated(false);
        setAuthData(null);
      }
    };

    initAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    authData,
    logout,
    checkAuth,
    updatePersonalPlanUnlocked
  };
};
