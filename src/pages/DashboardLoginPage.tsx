import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Input, Button, Form, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Silk from '../components/Silk';
import { apiRequest } from '../config/api';

const { Title } = Typography;

const DashboardLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [form] = Form.useForm();

  // Проверяем доступность API при загрузке страницы
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        console.log('🏥 [HEALTH] Проверяем доступность API...');
        const response = await apiRequest('api/health');
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [HEALTH] API доступен:', data);
        } else {
          console.log('⚠️ [HEALTH] API недоступен, статус:', response.status);
        }
      } catch (error) {
        console.error('❌ [HEALTH] Ошибка проверки API:', error);
      }
    };

    checkApiHealth();
  }, []);

  const verifyCredentialsAndEnter = async (values: { nickname: string; password: string }) => {
    setVerifying(true);
    
    try {
      console.log('🔐 [LOGIN] Проверяем учетные данные:', { nickname: values.nickname });
      console.log('🔗 [LOGIN] Отправляем запрос на:', 'api/tests/verify-nickname-credentials');
      
      const response = await apiRequest('api/tests/verify-nickname-credentials', {
        method: 'POST',
        body: JSON.stringify({
          nickname: values.nickname,
          password: values.password
        }),
      });

      console.log('📥 [LOGIN] Статус ответа:', response.status);
      console.log('📥 [LOGIN] Заголовки ответа:', Object.fromEntries(response.headers.entries()));

      // Проверяем, что ответ действительно JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ [LOGIN] Сервер вернул не JSON:', contentType);
        const textResponse = await response.text();
        console.error('❌ [LOGIN] Содержимое ответа:', textResponse.substring(0, 500));
        
        if (response.status === 502) {
          message.error('Сервер временно недоступен. Попробуйте позже.');
        } else if (response.status >= 500) {
          message.error('Ошибка сервера. Обратитесь в поддержку.');
        } else {
          message.error('Неожиданный ответ от сервера');
        }
        return;
      }

      const data = await response.json();
      console.log('📊 [LOGIN] Данные ответа:', data);

      if (data.success) {
        console.log('✅ [LOGIN] Учетные данные подтверждены, перенаправляем в ЛК');
        message.success('Добро пожаловать в личный кабинет!');
        
        // Сохраняем токен в sessionStorage
        sessionStorage.setItem('dashboardToken', data.dashboardToken);
        navigate(`/dashboard`);
      } else {
        console.log('❌ [LOGIN] Неверные учетные данные');
        message.error(data.error || 'Неверный никнейм или пароль');
      }
    } catch (error) {
      console.error('❌ [LOGIN] Критическая ошибка при проверке учетных данных:', error);
      
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        message.error('Сервер вернул некорректный ответ. Возможно, сервер перегружен.');
      } else if (error instanceof Error && error.message.includes('fetch')) {
        message.error('Не удается подключиться к серверу. Проверьте интернет-соединение.');
      } else {
        message.error('Произошла ошибка при входе в систему');
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh + 100px)',
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
    </div>
  );
};

export default DashboardLoginPage;
