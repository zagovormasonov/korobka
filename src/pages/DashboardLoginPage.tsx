import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Input, Button, Form, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { apiRequest } from '../config/api';

const { Text, Title } = Typography;

const DashboardLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [form] = Form.useForm();

  const verifyCredentialsAndEnter = async (values: { nickname: string; password: string }) => {
    setVerifying(true);
    
    try {
      console.log('🔐 Проверяем учетные данные:', { nickname: values.nickname });
      
      const response = await apiRequest('api/tests/verify-nickname-credentials', {
        method: 'POST',
        body: JSON.stringify({
          nickname: values.nickname,
          password: values.password
        }),
      });

      const data = await response.json();
      console.log('📥 Ответ от API:', data);

      if (data.success) {
        console.log('✅ Учетные данные подтверждены, перенаправляем в ЛК');
        message.success('Добро пожаловать в личный кабинет!');
        
        // Перенаправляем в ЛК с токеном
        navigate(`/lk/${data.dashboardToken}`);
      } else {
        console.log('❌ Неверные учетные данные');
        message.error(data.error || 'Неверный никнейм или пароль');
      }
    } catch (error) {
      console.error('❌ Ошибка при проверке учетных данных:', error);
      message.error('Произошла ошибка при входе в систему');
    } finally {
      setVerifying(false);
    }
  };

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
        maxWidth: '400px', 
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={2} style={{ color: '#00695c', marginBottom: '8px' }}>
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
