import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Typography, Button, Form, Input, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Silk from '../components/Silk';
import { apiRequest } from '../config/api';

const { Title } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [form] = Form.useForm();

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
        navigate(`/lk/${data.dashboardToken}`);
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
          color="#ffe59e"
          darkColor="#e8722a"
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
        marginBottom: '40px'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <Title level={1} style={{ 
            color: 'black', 
            marginBottom: '16px',
            fontSize: '48px',
            fontFamily: 'Comfortaa, sans-serif',
            fontWeight: 'normal',
            textAlign: 'left',
            lineHeight: '1.2'
          }}>
            Если<br />у тебя ПРЛ
          </Title>
          <div style={{ 
            color: 'rgba(0, 0, 0, 0.8)', 
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 'normal',
            textAlign: 'left',
            lineHeight: '1.4'
          }}>
            Пройди тест или войди<br />в личный кабинет
          </div>
        </div>

        <Button 
          type="primary" 
          size="large"
          onClick={() => navigate('/test-info')}
          style={{ 
            height: '60px', 
            fontSize: '20px', 
            fontFamily: 'Inter, sans-serif',
            fontWeight: '500',
            padding: '0 40px',
            width: '100%',
            maxWidth: '300px',
            background: 'white',
            color: 'black',
            borderRadius: '30px',
            boxShadow: 'none',
            border: 'none',
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
        backgroundColor: '#f1f1f1',
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
          >
            <Input
              prefix={<UserOutlined style={{ color: 'whitesmoke' }} />}
              placeholder="Введите никнейм"
              autoComplete="username"
              style={{ 
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'white',
                height: '48px',
                fontSize: '16px'
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
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'whitesmoke' }} />}
              placeholder="Введите пароль"
              autoComplete="current-password"
              style={{ 
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'white',
                height: '48px',
                fontSize: '16px'
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
                fontWeight: '500',
                backgroundColor: '#f3ba6f',
                borderColor: '#f3ba6f',
                border: 'none',
                boxShadow: 'none'
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