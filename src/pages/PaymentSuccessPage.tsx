import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, Button, Card, Space, message, Input, Form, Checkbox } from 'antd';
import { CheckCircleOutlined, CopyOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { apiRequest } from '../config/api';

const { Title, Text, Paragraph } = Typography;

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1 - ввод данных, 2 - сохранение данных
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dataSaved, setDataSaved] = useState(false);
  const [dashboardToken, setDashboardToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (sessionId) {
      // Просто проверяем, что сессия валидна
      setLoading(false);
    } else {
      setError('Неверные параметры');
      setLoading(false);
    }
  }, [sessionId]);

  const handleFirstStep = () => {
    if (!nickname || !password || !confirmPassword) {
      message.error('Пожалуйста, заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      message.error('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      message.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setStep(2);
  };

  const saveCredentials = async () => {
    if (!dataSaved) {
      message.error('Пожалуйста, подтвердите, что вы сохранили данные для входа');
      return;
    }

    setSaving(true);
    try {
      // Создаем dashboard token и сохраняем данные в Supabase
      const response = await apiRequest('api/dashboard/create-credentials', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          nickname,
          password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDashboardToken(data.dashboardToken);
        message.success('Данные успешно сохранены!');
        
        // Перенаправляем на страницу входа в ЛК через 2 секунды
        setTimeout(() => {
          navigate('/lk/login');
        }, 2000);
      } else {
        message.error(data.error || 'Ошибка при сохранении данных');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      message.error('Произошла ошибка при сохранении данных');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = `Данные для входа idenself.com
Логин: ${nickname}
Пароль: ${password}

#тесты #план #прл #психолог`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      message.success('Текст скопирован в буфер обмена!');
    }).catch(() => {
      message.error('Не удалось скопировать текст');
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: '20px' }}>Загрузка...</Paragraph>
        </Card>
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <Title level={2} type="danger">Ошибка</Title>
          <Paragraph>{error}</Paragraph>
          <Button type="primary" onClick={() => navigate('/')}>
            На главную
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {step === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <CheckCircleOutlined 
                style={{ 
                  fontSize: '48px', 
                  color: '#52c41a', 
                  marginBottom: '16px' 
                }} 
              />
              <Title level={2} style={{ color: '#00695c', marginBottom: '8px' }}>
                Оплата прошла успешно!
              </Title>
            </div>

            <div style={{ 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              <Text style={{ color: '#389e0d', fontSize: '14px' }}>
                В целях вашей анонимности мы не сохраняем ваше имя и контактные данные
              </Text>
            </div>

            <Form layout="vertical">
              <Form.Item 
                label="Придумайте ник"
                required
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Введите ваш ник"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  size="large"
                />
              </Form.Item>

              <Form.Item 
                label="Пароль"
                required
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="large"
                />
              </Form.Item>

              <Form.Item 
                label="Подтверждение пароля"
                required
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  size="large"
                />
              </Form.Item>

              <Button 
                type="primary" 
                size="large" 
                onClick={handleFirstStep}
                style={{ 
                  width: '100%', 
                  marginTop: '20px',
                  padding: '25px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Далее
              </Button>
            </Form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <CheckCircleOutlined 
                style={{ 
                  fontSize: '48px', 
                  color: '#52c41a', 
                  marginBottom: '16px' 
                }} 
              />
              <Title level={3} style={{ color: '#00695c', marginBottom: '8px' }}>
                Сохраните данные для входа
              </Title>
            </div>

            <div style={{ 
              background: '#fff2e8', 
              border: '1px solid #ffbb96', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '20px'
            }}>
              <Text style={{ color: '#d46b08', fontSize: '14px' }}>
                Сохраните данные для входа в заметки или менеджер паролей, чтобы не забыть, 
                иначе данные могут быть утеряны
              </Text>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                Пример текста:
              </Text>
              
              <div style={{ 
                background: '#f5f5f5', 
                border: '1px solid #d9d9d9', 
                borderRadius: '8px', 
                padding: '16px',
                position: 'relative'
              }}>
                <pre style={{ 
                  margin: 0, 
                  fontFamily: 'monospace', 
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap'
                }}>
{`Данные для входа idenself.com
Логин: ${nickname}
Пароль: ${password}

#тесты #план #прл #психолог`}
                </pre>
                
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={copyToClipboard}
                  style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <Checkbox 
                checked={dataSaved}
                onChange={(e) => setDataSaved(e.target.checked)}
              >
                Я сохранил(а) данные для входа
              </Checkbox>
            </div>

            <Button 
              type="primary" 
              size="large" 
              onClick={saveCredentials}
              loading={saving}
              disabled={!dataSaved}
              style={{ 
                width: '100%',
                padding: '25px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {saving ? 'Сохраняем...' : 'Далее'}
            </Button>

            {dashboardToken && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '20px',
                color: '#52c41a'
              }}>
                <Text>Перенаправляем на страницу входа в личный кабинет...</Text>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;