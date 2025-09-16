import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, Button, Card, Space, message } from 'antd';
import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardToken, setDashboardToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (sessionId) {
      fetchDashboardToken();
    } else {
      setError('Неверные параметры');
      setLoading(false);
    }
  }, [sessionId]);

  const fetchDashboardToken = async () => {
    try {
      const response = await fetch(`/api/tests/primary/${sessionId}`);
      const data = await response.json();

      if (data.success && data.data.dashboard_token) {
        setDashboardToken(data.data.dashboard_token);
      } else {
        setError('Не удалось получить ссылку на личный кабинет');
      }
    } catch (error) {
      console.error('Error fetching dashboard token:', error);
      setError('Ошибка при получении ссылки на личный кабинет');
    } finally {
      setLoading(false);
    }
  };

  const getDashboardUrl = () => {
    if (!dashboardToken) return '';
    return `${window.location.origin}/lk/${dashboardToken}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getDashboardUrl());
      message.success('Ссылка скопирована в буфер обмена!');
    } catch (error) {
      message.error('Не удалось скопировать ссылку');
    }
  };

  const goToDashboard = () => {
    if (dashboardToken) {
      navigate(`/lk/${dashboardToken}`);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <Text>Подготавливаем ваш личный кабинет...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <Text type="danger" style={{ fontSize: '18px' }}>
          {error}
        </Text>
        <Button type="primary" onClick={() => navigate('/')}>
          На главную
        </Button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f0f2f5'
    }}>
      <Card style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <CheckCircleOutlined 
            style={{ 
              fontSize: '64px', 
              color: '#52c41a' 
            }} 
          />
          
          <Title level={2} style={{ color: '#00695C', margin: 0 }}>
            Оплата прошла успешно!
          </Title>
          
          <Paragraph style={{ fontSize: '16px', color: '#666' }}>
            Спасибо за оплату! Ваш личный кабинет готов. 
            Сохраните ссылку ниже для доступа с любого устройства.
          </Paragraph>

          <Card 
            size="small" 
            style={{ 
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f'
            }}
          >
            <Title level={5} style={{ margin: '0 0 12px 0' }}>
              Ваша персональная ссылка:
            </Title>
            <div style={{ 
              padding: '8px 12px',
              backgroundColor: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              marginBottom: '12px'
            }}>
              {getDashboardUrl()}
            </div>
            <Button 
              type="dashed" 
              icon={<CopyOutlined />}
              onClick={copyToClipboard}
              style={{ width: '100%' }}
            >
              Скопировать ссылку
            </Button>
          </Card>

          <Space size="middle">
            <Button 
              type="primary" 
              size="large"
              onClick={goToDashboard}
            >
              Перейти в личный кабинет
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/')}
            >
              На главную
            </Button>
          </Space>

          <Paragraph style={{ fontSize: '14px', color: '#999', margin: 0 }}>
            <strong>Важно:</strong> Сохраните эту ссылку в закладках браузера 
            или скопируйте в надежное место. Она даёт доступ к вашему личному кабинету 
            с любого устройства.
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
