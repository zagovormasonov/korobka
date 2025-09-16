import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, Card, Input, Button, Form, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const DashboardTokenPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [form] = Form.useForm();

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
        // Показываем форму для ввода email вместо прямого перенаправления
        setShowEmailForm(true);
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

  const verifyEmailAndEnter = async (values: { email: string }) => {
    if (!sessionId) return;
    
    setVerifyingEmail(true);
    try {
      const response = await fetch('/api/tests/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          email: values.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Email подтвержден! Перенаправляем в личный кабинет...');
        setTimeout(() => {
          navigate(`/dashboard?sessionId=${sessionId}`, { replace: true });
        }, 1000);
      } else {
        message.error('Неверный email. Проверьте адрес электронной почты.');
        form.setFields([
          {
            name: 'email',
            errors: ['Неверный email адрес']
          }
        ]);
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      message.error('Ошибка при проверке email');
    } finally {
      setVerifyingEmail(false);
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

  if (showEmailForm) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '20px',
        backgroundColor: '#f0f2f5'
      }}>
        <Card style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <LockOutlined style={{ fontSize: '48px', color: '#00695C', marginBottom: '16px' }} />
            <Title level={3} style={{ color: '#00695C', margin: 0 }}>
              Подтверждение доступа
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Для безопасности введите email, который был указан при прохождении теста
            </Text>
          </div>

          <Form
            form={form}
            onFinish={verifyEmailAndEnter}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email адрес"
              rules={[
                { required: true, message: 'Введите email адрес' },
                { type: 'email', message: 'Введите корректный email адрес' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="example@email.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={verifyingEmail}
                style={{ width: '100%' }}
              >
                {verifyingEmail ? 'Проверяем...' : 'Войти в личный кабинет'}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Если вы забыли email, обратитесь в поддержку
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return null; // Компонент перенаправляет, поэтому ничего не рендерим
};

export default DashboardTokenPage;
