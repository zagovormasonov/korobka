import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin } from 'antd';
import DashboardPage from './DashboardPage';

const { Text } = Typography;

const DashboardTokenPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
      const response = await fetch(`/api/tests/dashboard/${dashboardToken}`);
      const data = await response.json();

      if (data.success) {
        setSessionId(data.data.session_id);
        // Перенаправляем на обычный ЛК с sessionId
        navigate(`/dashboard?sessionId=${data.data.session_id}`, { replace: true });
      } else {
        setError('Личный кабинет не найден или ссылка устарела');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Ошибка при загрузке личного кабинета');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <Text>Загружаем ваш личный кабинет...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <Text type="danger" style={{ fontSize: '18px' }}>
          {error}
        </Text>
        <Text type="secondary">
          Проверьте правильность ссылки или обратитесь в поддержку
        </Text>
      </div>
    );
  }

  return null; // Компонент перенаправляет, поэтому ничего не рендерим
};

export default DashboardTokenPage;
