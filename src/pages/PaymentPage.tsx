import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Typography, Button, Card, Row, Col, Space, message, List, Checkbox } from 'antd';
import { apiRequest } from '../config/api';
import { 
  FileTextOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  FilePdfOutlined, 
  MessageOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { apiRequest } from '../config/api';

const { Title, Paragraph } = Typography;

const benefits = [
  {
    title: 'Персональный план, что делать именно в твоём случае',
    subtitle: 'Индивидуальный подход к твоей ситуации',
    icon: <FileTextOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: [
      'Конкретные действия',
      'Какие тесты ещё пройти в твоём случае',
      'Какой метод терапии использовать',
      'Какой нужен психолог'
    ]
  },
  {
    title: 'Подберём психолога под твой случай',
    subtitle: 'Найдём специалиста, который понимает твои особенности',
    icon: <UserOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: []
  },
  {
    title: 'Подготовим к сеансу',
    subtitle: 'Поможем максимально эффективно использовать время с психологом',
    icon: <CalendarOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: [
      'Что сказать специалисту в твоём случае',
      'Как на первом сеансе определить, что он, скорее всего, тебе подходит'
    ]
  },
  {
    title: 'Подготовим PDF для психолога',
    subtitle: 'Документ, который поможет специалисту лучше понять тебя',
    icon: <FilePdfOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: [
      'Даёшь его психологу, и он понимает, что делать в твоём случае'
    ]
  },
  {
    title: 'Ты сможешь поделиться с нами, что было на сеансе у психолога, и мы дадим обратную связь',
    subtitle: 'Поддержим тебя на каждом этапе',
    icon: <MessageOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: []
  }
];

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [sessionId] = useState(() => searchParams.get('sessionId') || '');
  const [mascotMessage, setMascotMessage] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  useEffect(() => {
    if (sessionId) {
      generateMascotMessage();
      
      // Проверяем, пришел ли пользователь после неудачной оплаты
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'failed') {
        message.error('❌ Оплата не прошла. Попробуйте еще раз или обратитесь в поддержку.');
        // Убираем параметр из URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [sessionId]);

  const generateMascotMessage = async () => {
    try {
      const response = await apiRequest('api/ai/mascot-message/payment', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMascotMessage(data.message);
      } else {
        console.error('Error generating mascot message');
        setMascotMessage('Отлично! Ты прошел тест и теперь можешь получить персональный план!');
      }
    } catch (error) {
      console.error('Error generating mascot message:', error);
      setMascotMessage('Отлично! Ты прошел тест и теперь можешь получить персональный план!');
    }
  };

  const handlePayment = async () => {
    if (!sessionId) {
      message.error('Ошибка: не найден ID сессии');
      return;
    }

    if (!agreementAccepted) {
      message.warning('Необходимо согласиться с условиями для продолжения');
      return;
    }

    setPaymentLoading(true);

    try {
      console.log('💳 Начинаем создание платежа для sessionId:', sessionId);
      
      const response = await apiRequest('api/payments/create', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });

      console.log('📤 Отправляем запрос на создание платежа...');
      console.log('📥 Получен ответ:', response.status, response.statusText);

      const data = await response.json();
      console.log('📊 Данные ответа:', data);
      
      if (data.success) {
        // Перенаправляем пользователя на страницу оплаты Тинькофф в том же окне
        // После успешной оплаты Тинькофф автоматически перенаправит в личный кабинет
        window.location.href = data.paymentUrl;
      } else {
        message.error('Ошибка при создании платежа');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error('Произошла ошибка при обработке платежа');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <CheckCircleOutlined 
          style={{ 
            fontSize: '80px', 
            color: '#00695C', 
            marginBottom: '20px',
            display: 'block'
          }} 
        />
        <Title level={1} style={{ color: '#00695C', marginBottom: '20px' }}>
          Тест пройден
        </Title>
      </div>

      {mascotMessage && (
        <Card 
          style={{ 
            marginBottom: '40px', 
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
              <img 
                src="/mascot.png"  
                alt="Луми" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  objectFit: 'contain',
                  animation: paymentLoading ? 'spin 2s linear infinite' : 'none'
                }}
              />
              {paymentLoading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '70px',
                  height: '70px',
                  border: '3px solid #b7eb8f',
                  borderTop: '3px solid #00695C',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Paragraph style={{ margin: 0, fontSize: '16px', lineHeight: '1.6' }}>
                {paymentLoading ? 'Луми обрабатывает ваш запрос...' : mascotMessage}
              </Paragraph>
            </div>
          </div>
        </Card>
      )}

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={3} style={{ color: '#00695C', marginBottom: '30px' }}>
          Получи:
        </Title>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
        {benefits.map((benefit, index) => (
          <Col xs={24} md={12} lg={8} key={index}>
            <Card 
              hoverable
              style={{ height: '100%' }}
              bodyStyle={{ padding: '24px' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ textAlign: 'left' }}>
                  {benefit.icon}
                </div>
                
                <div>
                  <Title level={4} style={{ margin: '0 0 8px 0', color: '#00695C', textAlign: 'left' }}>
                    {benefit.title}
                  </Title>
                  <Paragraph style={{ margin: '0 0 16px 0', color: '#666', textAlign: 'left', fontSize: '16px' }}>
                    {benefit.subtitle}
                  </Paragraph>
                  
                  {benefit.items.length > 0 && (
                    <List
                      size="small"
                      dataSource={benefit.items}
                      renderItem={(item) => (
                        <List.Item style={{ padding: '4px 0', border: 'none' }}>
                          <span style={{ color: '#333', fontSize: '14px' }}>• {item}</span>
                        </List.Item>
                      )}
                      style={{ marginTop: '16px' }}
                    />
                  )}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px auto', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Checkbox 
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <span style={{ 
              fontSize: '14px', 
              lineHeight: '1.5',
              textAlign: 'left',
              flex: 1
            }}>
              Я согласен(на) с условиями{' '}
              <Link to="/offer" style={{ color: '#00695C' }}>
                Публичной оферты
              </Link>
              ,{' '}
              <Link to="/privacy-policy" style={{ color: '#00695C' }}>
                Политики конфиденциальности
              </Link>
              {' '}и даю{' '}
              <Link to="/consent" style={{ color: '#00695C' }}>
                Согласие на обработку персональных данных
              </Link>
            </span>
          </div>
        </div>
        
        <Button 
          type="primary" 
          size="large"
          onClick={handlePayment}
          loading={paymentLoading}
          disabled={!agreementAccepted}
          style={{ 
            height: '60px', 
            fontSize: '18px', 
            fontWeight: 'bold',
            padding: '0 40px',
            opacity: agreementAccepted ? 1 : 0.6
          }}
        >
          Оплатить 1₽
        </Button>
      </div>
    </div>
  );
};

export default PaymentPage;