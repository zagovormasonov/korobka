import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin } from 'antd';
import { apiRequest } from '../config/api';

const { Text, Title } = Typography;

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
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '24px',
        background: 'linear-gradient(135deg, #F7B98F, #A7D7C4)',
        fontFamily: 'Comfortaa, sans-serif'
      }}>
        {/* Логотип */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Typography.Title level={1} style={{ 
            margin: '0',
            fontSize: '36px',
            fontWeight: 'bold',
            fontFamily: 'Comfortaa, sans-serif'
          }}>
            <span style={{ color: '#212121' }}>Iden</span>
            <span style={{ color: '#F7B98F' }}>self</span>
          </Typography.Title>
        </div>
        
        <Spin size="large" />
        <Text style={{ color: '#212121', fontSize: '16px', fontFamily: 'Comfortaa, sans-serif' }}>
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
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '24px',
        textAlign: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #F7B98F, #A7D7C4)',
        fontFamily: 'Comfortaa, sans-serif'
      }}>
        {/* Логотип */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Title level={1} style={{ 
            margin: '0',
            fontSize: '36px',
            fontWeight: 'bold',
            fontFamily: 'Comfortaa, sans-serif'
          }}>
            <span style={{ color: '#212121' }}>Iden</span>
            <span style={{ color: '#F7B98F' }}>self</span>
          </Title>
        </div>
        
        <Text type="danger" style={{ fontSize: '18px', color: '#ff4d4f', fontFamily: 'Comfortaa, sans-serif' }}>
          {error}
        </Text>
        <Text style={{ color: '#212121', fontFamily: 'Comfortaa, sans-serif' }}>
          Проверьте правильность ссылки или обратитесь в поддержку
        </Text>
      </div>
    );
  }

  return null; // Компонент перенаправляет, поэтому ничего не рендерим
};

export default DashboardTokenPage;
