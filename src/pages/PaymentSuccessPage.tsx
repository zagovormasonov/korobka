import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, Spin, Button, Card, message, Input, Form, Checkbox } from 'antd';
import { CheckCircleOutlined, CopyOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { apiRequest } from '../config/api';
import Silk from '../components/Silk';

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
        minHeight: 'calc(100vh + 100px)',
        padding: '40px 20px 140px 20px',
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
        <Card style={{ textAlign: 'center', padding: '40px', borderRadius: '24px', boxShadow: 'none', backgroundColor: '#f1f1f1' }}>
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
        minHeight: 'calc(100vh + 100px)',
        padding: '40px 20px 140px 20px',
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
        <Card style={{ 
          textAlign: 'center', 
          padding: '40px', 
          borderRadius: '24px', 
          boxShadow: 'none', 
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.6)'
        }}>
          <Title level={2} type="danger">Ошибка</Title>
          <Paragraph>{error}</Paragraph>
          <Button 
            type="primary" 
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#f3ba6f',
              borderColor: '#f3ba6f',
              borderRadius: '28px',
              height: '48px'
            }}
          >
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
      minHeight: 'calc(100vh + 100px)',
      padding: '40px 20px 140px 20px',
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
      <Card style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '40px 24px',
        borderRadius: '24px',
        boxShadow: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.6)'
      }}>
        {step === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <CheckCircleOutlined 
                style={{ 
                  fontSize: '48px', 
                  color: '#4F958B', 
                  marginBottom: '16px' 
                }} 
              />
              <Title level={2} style={{ color: '#333', marginBottom: '8px', fontFamily: 'Comfortaa, sans-serif', fontSize: '24px' }}>
                Оплата прошла успешно!
              </Title>
            </div>

            <div style={{ 
              background: 'rgb(255, 246, 234)', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              <Text style={{ color: '#333', fontSize: '14px' }}>
                В целях вашей анонимности мы не сохраняем ваше имя и контактные данные
              </Text>
            </div>

            <Form layout="vertical" requiredMark={false}>
              <Form.Item 
                label="Придумайте ник"
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'whitesmoke' }} />}
                  placeholder="Введите никнейм"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  size="large"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    height: '48px'
                  }}
                />
              </Form.Item>

              <Form.Item 
                label="Пароль"
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'whitesmoke' }} />}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="large"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    height: '48px'
                  }}
                />
              </Form.Item>

              <Form.Item 
                label="Подтверждение пароля"
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'whitesmoke' }} />}
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  size="large"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    height: '48px'
                  }}
                />
              </Form.Item>

              <Button 
                type="primary" 
                size="large" 
                onClick={handleFirstStep}
                style={{ 
                  width: '100%', 
                  marginTop: '20px',
                  height: '56px',
                  fontSize: '16px',
                  fontWeight: '500',
                  backgroundColor: '#f3ba6f',
                  borderColor: '#f3ba6f',
                  borderRadius: '28px',
                  boxShadow: 'none'
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
                  color: '#4F958B', 
                  marginBottom: '16px' 
                }} 
              />
              <Title level={3} style={{ color: '#333', marginBottom: '8px', fontFamily: 'Comfortaa, sans-serif', fontSize: '20px' }}>
                Сохраните данные для входа
              </Title>
            </div>

            <div style={{ 
              background: 'rgb(255, 246, 234)', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '20px'
            }}>
              <Text style={{ color: '#333', fontSize: '14px' }}>
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
                height: '56px',
                fontSize: '16px',
                fontWeight: '500',
                backgroundColor: '#f3ba6f',
                borderColor: '#f3ba6f',
                borderRadius: '28px',
                boxShadow: 'none',
                opacity: dataSaved ? 1 : 0.6
              }}
            >
              {saving ? 'Сохраняем...' : 'Далее'}
            </Button>

            {dashboardToken && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '20px',
                color: '#999999'
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