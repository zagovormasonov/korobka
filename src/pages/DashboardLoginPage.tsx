import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Input, Button, Form, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Silk from '../components/Silk';
import { apiRequest } from '../config/api';

const { Text, Title } = Typography;

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
        
        // Перенаправляем в ЛК с токеном
        navigate(`/lk/${data.dashboardToken}`);
      } else {
        console.log('❌ [LOGIN] Неверные учетные данные');
        message.error(data.error || 'Неверный никнейм или пароль');
      }
    } catch (error) {
      console.error('❌ [LOGIN] Критическая ошибка при проверке учетных данных:', error);
      
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        message.error('Сервер вернул некорректный ответ. Возможно, сервер перегружен.');
      } else if (error.message.includes('fetch')) {
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
          speed={5}
          scale={0.5}
          color="#ffe59e"
          darkColor="#fd953f"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <Card style={{ 
        width: '100%', 
        maxWidth: '400px', 
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#00695c', marginBottom: '8px', fontFamily: 'Comfortaa, sans-serif' }}>
            Вход в личный кабинет
          </Title>
          <Text type="secondary">
            Введите ваш никнейм и пароль
          </Text>
        </div>

        <Form
          form={form}
          onFinish={verifyCredentialsAndEnter}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="nickname"
            label="Ваш никнейм"
            rules={[
              { required: true, message: 'Пожалуйста, введите ваш никнейм' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Введите ваш никнейм"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Ваш пароль"
            rules={[
              { required: true, message: 'Пожалуйста, введите ваш пароль' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Введите ваш пароль"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={verifying}
              style={{ 
                width: '100%',
                padding: '25px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {verifying ? 'Проверяем данные...' : 'Войти в личный кабинет'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          padding: '16px',
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '8px'
        }}>
          <Text style={{ color: '#389e0d', fontSize: '12px' }}>
            💡 Если вы забыли данные для входа, обратитесь в службу поддержки
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default DashboardLoginPage;
