import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, Button, Card, Space, message } from 'antd';
import { CheckCircleOutlined, CopyOutlined, MailOutlined } from '@ant-design/icons';
import { sendDashboardAccessEmail, checkEmailJSConfig } from '../services/emailService';

const { Title, Text, Paragraph } = Typography;

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardToken, setDashboardToken] = useState<string | null>(null);
  const [dashboardPassword, setDashboardPassword] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
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
        setDashboardPassword(data.data.dashboard_password);
        setUserEmail(data.data.email);
        
        // Автоматически отправляем email, если EmailJS настроен
        if (checkEmailJSConfig()) {
          sendEmailWithData(data.data.email, data.data.dashboard_password, data.data.dashboard_token);
        } else {
          console.log('⚠️ EmailJS не настроен. Данные отображаются только на странице.');
        }
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

  const sendEmailWithData = async (email: string, password: string, token: string) => {
    setSendingEmail(true);
    try {
      const dashboardUrl = `${window.location.origin}/lk/${token}`;
      const success = await sendDashboardAccessEmail({
        userEmail: email,
        dashboardPassword: password,
        dashboardUrl: dashboardUrl
      });

      if (success) {
        setEmailSent(true);
        message.success('📧 Данные для доступа отправлены на вашу почту!');
      } else {
        message.warning('Не удалось отправить email с данными доступа');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      message.error('Ошибка при отправке email');
    } finally {
      setSendingEmail(false);
    }
  };

  const manualSendEmail = async () => {
    if (!userEmail || !dashboardPassword || !dashboardToken) return;
    await sendEmailWithData(userEmail, dashboardPassword, dashboardToken);
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
            Сохраните данные ниже для доступа с любого устройства.
          </Paragraph>

          <Card 
            size="small" 
            style={{ 
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f'
            }}
          >
            <Title level={5} style={{ margin: '0 0 16px 0' }}>
              Данные для входа в личный кабинет:
            </Title>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                Ссылка:
              </Text>
              <div style={{ 
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                marginBottom: '8px'
              }}>
                {getDashboardUrl()}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                Email:
              </Text>
              <div style={{ 
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '16px',
                marginBottom: '8px'
              }}>
                {userEmail}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                Пароль:
              </Text>
              <div style={{ 
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '24px',
                fontFamily: 'monospace',
                textAlign: 'center',
                letterSpacing: '2px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                {dashboardPassword}
              </div>
            </div>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="dashed" 
                icon={<CopyOutlined />}
                onClick={copyToClipboard}
                style={{ width: '100%' }}
              >
                Скопировать ссылку
              </Button>
              
              {checkEmailJSConfig() && !emailSent && (
                <Button 
                  type="default" 
                  icon={<MailOutlined />}
                  onClick={manualSendEmail}
                  loading={sendingEmail}
                  style={{ width: '100%' }}
                >
                  {sendingEmail ? 'Отправляем email...' : 'Отправить данные на почту'}
                </Button>
              )}
              
              {!checkEmailJSConfig() && (
                <div style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#fff7e6',
                  border: '1px solid #ffd591',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <Text style={{ color: '#fa8c16', fontSize: '14px' }}>
                    ⚠️ Отправка email не настроена. Сохраните данные самостоятельно.
                  </Text>
                </div>
              )}
              
              {emailSent && (
                <div style={{ 
                  padding: '8px 12px',
                  backgroundColor: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <Text style={{ color: '#52c41a', fontSize: '14px' }}>
                    ✅ Данные отправлены на {userEmail}
                  </Text>
                </div>
              )}
            </Space>
          </Card>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              size="large"
              onClick={goToDashboard}
              style={{ width: '100%' }}
            >
              Перейти в личный кабинет
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/')}
              style={{ width: '100%' }}
            >
              На главную
            </Button>
          </Space>

          <Paragraph style={{ fontSize: '14px', color: '#999', margin: 0 }}>
            <strong>Важно:</strong> Сохраните эти данные в надежном месте. 
            Для входа в личный кабинет вам потребуется ввести email и пароль. 
            Доступ возможен с любого устройства.
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
