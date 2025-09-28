import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Typography, Card, Input, Button, Form, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { apiRequest } from '../config/api';

const { Text, Title } = Typography;

const HomePage: React.FC = () => {
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
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F7B98F, #A7D7C4)',
      padding: '20px'
    }}>
      {/* Логотип */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Title level={1} style={{ 
          margin: '0',
          fontSize: '48px',
          fontWeight: 'bold',
          fontFamily: 'Comfortaa, sans-serif'
        }}>
          <span style={{ color: '#212121' }}>Iden</span>
          <span style={{ color: '#F7B98F' }}>self</span>
        </Title>
      </div>

      {/* Карточка входа */}
      <Card style={{ 
        width: '100%', 
        maxWidth: '400px', 
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#212121', marginBottom: '8px', fontFamily: 'Comfortaa, sans-serif' }}>
            Вход в личный кабинет
          </Title>
          <Text type="secondary" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
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
            label={<span style={{ fontFamily: 'Comfortaa, sans-serif' }}>Ваш никнейм</span>}
            rules={[
              { required: true, message: 'Пожалуйста, введите ваш никнейм' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Введите ваш никнейм"
              autoComplete="username"
              style={{ fontFamily: 'Comfortaa, sans-serif' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontFamily: 'Comfortaa, sans-serif' }}>Ваш пароль</span>}
            rules={[
              { required: true, message: 'Пожалуйста, введите ваш пароль' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Введите ваш пароль"
              autoComplete="current-password"
              style={{ fontFamily: 'Comfortaa, sans-serif' }}
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
                fontWeight: 'bold',
                fontFamily: 'Comfortaa, sans-serif'
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
          <Text style={{ color: '#389e0d', fontSize: '12px', fontFamily: 'Comfortaa, sans-serif' }}>
            💡 Если вы забыли данные для входа, обратитесь в службу поддержки
          </Text>
        </div>
      </Card>

      {/* Кнопка "Пройти тест" */}
      <Space direction="vertical" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Button 
          type="default" 
          size="large"
          onClick={() => navigate('/bpd_test')}
          style={{ 
            height: '50px', 
            fontSize: '16px', 
            fontWeight: 'bold',
            padding: '0 40px',
            minWidth: '200px',
            background: 'white',
            borderColor: '#212121',
            color: '#212121',
            borderRadius: '25px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            fontFamily: 'Comfortaa, sans-serif'
          }}
        >
          Пройти тест на ПРЛ
        </Button>
      </Space>

      {/* Ссылки внизу */}
      <div style={{ 
        textAlign: 'center',
        marginTop: 'auto',
        paddingTop: '20px'
      }}>
        <Space split={<span style={{ color: '#666' }}>•</span>} size="middle" wrap>
          <Link to="/offer" style={{ color: '#212121', fontSize: '12px', fontFamily: 'Comfortaa, sans-serif' }}>
            Публичная оферта
          </Link>
          <Link to="/privacy-policy" style={{ color: '#212121', fontSize: '12px', fontFamily: 'Comfortaa, sans-serif' }}>
            Политика конфиденциальности
          </Link>
          <Link to="/consent" style={{ color: '#212121', fontSize: '12px', fontFamily: 'Comfortaa, sans-serif' }}>
            Согласие на обработку персональных данных
          </Link>
        </Space>
      </div>
    </div>
  );
};

export default HomePage;