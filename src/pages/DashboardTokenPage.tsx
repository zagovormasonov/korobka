import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin } from 'antd';
import Silk from '../components/Silk';
import { apiRequest } from '../config/api';

const { Text } = Typography;

const DashboardTokenPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchDashboardByToken(token);
    } else {
      setError('Неверная ссылка');
      setLoading(false);
    }
  }, [token]);

  const fetchDashboardByToken = async (dashboardToken: string) => {
    try {
      console.log('🔍 [TOKEN PAGE] Проверяем токен:', dashboardToken);
      const response = await apiRequest(`api/tests/dashboard/${dashboardToken}`);
      const data = await response.json();

      if (data.success) {
        console.log('✅ [TOKEN PAGE] Токен валиден, перенаправляем в ЛК');
        // Сразу перенаправляем в ЛК без дополнительных проверок
        navigate(`/dashboard?sessionId=${data.data.session_id}`, { replace: true });
      } else {
        console.log('❌ [TOKEN PAGE] Токен не найден');
        setError('Личный кабинет не найден или ссылка устарела');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ [TOKEN PAGE] Ошибка при проверке токена:', error);
      setError('Ошибка при загрузке личного кабинета');
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh + 100px)',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        paddingBottom: '100px'
      }}>
        <div style={{
          position: 'fixed',
          top: -50,
          left: 0,
          width: '100%',
          height: 'calc(100vh + 150px)',
          zIndex: -1
        }}>
          <Silk
            speed={8.7}
            scale={0.5}
            color="#ffe59e"
            darkColor="#e8722a"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        <Spin size="large" />
        <Text style={{ color: 'rgba(0, 0, 0, 0.7)', fontSize: '16px', fontFamily: 'Inter, sans-serif' }}>
          Загружаем ваш личный кабинет...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh + 100px)',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        padding: '20px 20px 120px 20px',
        position: 'relative'
      }}>
        <div style={{
          position: 'fixed',
          top: -50,
          left: 0,
          width: '100%',
          height: 'calc(100vh + 150px)',
          zIndex: -1
        }}>
          <Silk
            speed={8.7}
            scale={0.5}
            color="#ffe59e"
            darkColor="#e8722a"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        <Text type="danger" style={{ fontSize: '18px', color: '#ff4d4f', fontFamily: 'Comfortaa, sans-serif' }}>
          {error}
        </Text>
        <Text style={{ color: 'rgba(0, 0, 0, 0.6)', fontFamily: 'Inter, sans-serif' }}>
          Проверьте правильность ссылки или обратитесь в поддержку
        </Text>
      </div>
    );
  }

  return null; // Компонент перенаправляет, поэтому ничего не рендерим
};

export default DashboardTokenPage;
