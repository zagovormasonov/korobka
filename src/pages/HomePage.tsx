import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Typography, Button, Form, Input, Card, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Silk from '../components/Silk';
import { apiRequest } from '../config/api';
import { useThemeColor } from '../hooks/useThemeColor';
import { useAuth } from '../hooks/useAuth';

const { Title } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [form] = Form.useForm();
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  
  // Устанавливаем цвет статус-бара для градиентного фона
  useThemeColor('#FFED82');

  // Проверяем авторизацию при загрузке страницы
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (isAuthenticated) {
        console.log('✅ [HOME] Пользователь авторизован, редирект в личный кабинет');
        navigate('/dashboard', { replace: true });
        return;
      }
    };

    if (!isLoading) {
      checkAuthAndRedirect();
    }
  }, [isAuthenticated, isLoading, navigate]);

  const verifyCredentialsAndEnter = async (values: { nickname: string; password: string }) => {
    setVerifying(true);
    
    try {
      console.log('🔐 [LOGIN] Проверяем учетные данные:', { nickname: values.nickname });
      
      const response = await apiRequest('api/tests/verify-nickname-credentials', {
        method: 'POST',
        body: JSON.stringify({
          nickname: values.nickname,
          password: values.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ [LOGIN] Учетные данные подтверждены');
        message.success('Добро пожаловать в личный кабинет!');
        // Сохраняем токен в localStorage для долгосрочного хранения
        localStorage.setItem('dashboardToken', data.dashboardToken);
        // Также сохраняем в sessionStorage для совместимости
        sessionStorage.setItem('dashboardToken', data.dashboardToken);
        navigate(`/dashboard`);
      } else {
        console.log('❌ [LOGIN] Неверные учетные данные');
        message.error(data.error || 'Неверный никнейм или пароль');
      }
    } catch (error) {
      console.error('❌ [LOGIN] Ошибка при проверке учетных данных:', error);
      message.error('Произошла ошибка при входе в систему');
    } finally {
      setVerifying(false);
    }
  };

  // Показываем спиннер во время проверки авторизации
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Silk />
        <Spin size="large" />
        <div style={{ color: '#666', fontSize: '16px' }}>Проверяем авторизацию...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: 'calc(100vh + 100px)',
      padding: '40px 20px 140px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      {/* Silk фон */}
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
          color="#FFED82"
          darkColor="#4F958B"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Логотип вверху */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '60px',
        paddingTop: '20px'
      }}>
        <div style={{ 
          fontSize: '32px', 
          fontFamily: 'Comfortaa, sans-serif',
          fontWeight: '600',
          color: 'black'
        }}>
          idenself
        </div>
      </div>

      {/* Заголовок, подзаголовок и кнопка */}
      <div style={{ 
        width: '100%',
        maxWidth: '600px',
        marginBottom: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <Title level={1} style={{ 
            color: 'black', 
            marginBottom: '16px',
            fontSize: '48px',
            fontFamily: 'Comfortaa, sans-serif',
            fontWeight: 'normal',
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            Если <br></br> у тебя ПРЛ
          </Title>
          <div style={{ 
            color: 'rgba(0, 0, 0, 0.8)', 
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 'normal',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            Пройди тест и получи персональный план действий
          </div>
        </div>

        <Button 
          type="primary" 
          size="large"
          onClick={() => navigate('/test-info')}
          className="home-test-button"
          style={{ 
            height: '60px', 
            fontSize: '20px', 
            fontFamily: 'Inter, sans-serif',
            fontWeight: '500',
            padding: '0 40px',
            width: '100%',
            maxWidth: '300px',
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: 'black',
            borderRadius: '30px',
            boxShadow: 'none',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            marginBottom: '40px'
          }}
        >
          Пройти тест
        </Button>
      </div>

      {/* Форма входа */}
      <Card style={{ 
        width: '100%', 
        maxWidth: '400px', 
        borderRadius: '24px',
        boxShadow: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        padding: '40px 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={2} style={{ 
            marginBottom: '0px', 
            color: '#333',
            fontFamily: 'Comfortaa, sans-serif',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Вход в личный кабинет
          </Title>
        </div>

        <Form
          form={form}
          onFinish={verifyCredentialsAndEnter}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="nickname"
            label={<span style={{ color: '#333', fontSize: '14px' }}>Никнейм</span>}
            rules={[
              { required: true, message: 'Пожалуйста, введите никнейм!' }
            ]}
            className="glass-input"
          >
            <Input
              prefix={<UserOutlined style={{ color: 'black' }} />}
              placeholder="Введите никнейм"
              autoComplete="username"
              className="glass-input"
              style={{ 
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'white',
                height: '48px',
                fontSize: '16px',
                outline: 'none'
              }}
              styles={{
                affixWrapper: {
                  border: 'none',
                  boxShadow: 'none',
                  outline: 'none'
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#333', fontSize: '14px' }}>Пароль</span>}
            rules={[
              { required: true, message: 'Пожалуйста, введите пароль!' }
            ]}
            style={{ marginBottom: '32px' }}
            className="glass-input"
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'black' }} />}
              placeholder="Введите пароль"
              autoComplete="current-password"
              className="glass-input"
              style={{ 
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'white',
                height: '48px',
                fontSize: '16px',
                outline: 'none'
              }}
              styles={{
                affixWrapper: {
                  border: 'none',
                  boxShadow: 'none',
                  outline: 'none'
                }
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '0px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={verifying}
              style={{ 
                width: '100%', 
                height: '56px',
                borderRadius: '28px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#4F958B',
                borderColor: 'rgba(255, 255, 255, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            >
              {verifying ? 'Проверяем данные...' : 'Войти в личный кабинет'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Ссылки внизу */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <Link 
          to="/offer" 
          style={{ 
            color: 'rgb(0, 0, 0)', 
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'none'
          }}
        >
          Публичная оферта
        </Link>
        <Link 
          to="/privacy-policy" 
          style={{ 
            color: 'rgb(0, 0, 0)', 
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'none'
          }}
        >
          Политика конфиденциальности
        </Link>
        <Link 
          to="/consent" 
          style={{ 
            color: 'rgb(0, 0, 0)', 
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'none'
          }}
        >
          Согласие на обработку персональных данных
        </Link>
      </div>
    </div>
  );
};

export default HomePage;