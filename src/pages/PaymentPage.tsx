import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Typography, Button, Card, Row, Col, Space, message, Checkbox, Spin } from 'antd';
import { apiRequest } from '../config/api';
import { useThemeColor } from '../hooks/useThemeColor';
import { 
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const iconColor = 'rgb(243, 186, 111)';

const benefits = [
  {
    title: 'Персональный план, что делать именно в твоём случае',
    subtitle: 'Индивидуальный подход к твоей ситуации',
    icon: <img src="/plan.png" alt="Plan" style={{ width: '100px', height: '100px' }} />,
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
    icon: <img src="/podbor.png" alt="Selection" style={{ width: '100px', height: '100px' }} />,
    items: []
  },
  {
    title: 'Подготовим к сеансу',
    subtitle: 'Поможем максимально эффективно использовать время с психологом',
    icon: <img src="/podgot.png" alt="Preparation" style={{ width: '100px', height: '100px' }} />,
    items: [
      'Что сказать специалисту в твоём случае',
      'Как на первом сеансе определить, что он, скорее всего, тебе подходит'
    ]
  },
  {
    title: 'Подготовим PDF для психолога',
    subtitle: 'Документ, который поможет специалисту лучше понять тебя',
    icon: <img src="/file.png" alt="PDF" style={{ width: '100px', height: '100px' }} />,
    items: [
      'Даёшь его психологу, и он понимает, что делать в твоём случае'
    ]
  },
  {
    title: 'Ты сможешь поделиться с нами, что было на сеансе у психолога, и мы дадим обратную связь',
    subtitle: 'Поддержим тебя на каждом этапе',
    icon: <img src="/chat.png" alt="Chat" style={{ width: '100px', height: '100px' }} />,
    items: []
  }
];

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [sessionId] = useState(() => searchParams.get('sessionId') || '');
  const [mascotMessage, setMascotMessage] = useState('');
  const [loadingMascotMessage, setLoadingMascotMessage] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  
  // Устанавливаем белый цвет статус-бара
  useThemeColor('#ffffff');

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
    setLoadingMascotMessage(true);
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
    } finally {
      setLoadingMascotMessage(false);
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
            color: '#4F958B', 
            marginBottom: '20px',
            display: 'block'
          }} 
        />
        <Title level={1} style={{ color: 'black', marginBottom: '20px', fontFamily: 'Comfortaa, sans-serif' }}>
          Тест пройден
        </Title>
      </div>

      <Card 
        style={{ 
          marginBottom: '40px', 
          backgroundColor: 'rgb(255, 246, 234)',
          border: 'none',
          maxWidth: '800px',
          margin: '0 auto 40px auto'
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
                objectFit: 'contain'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {loadingMascotMessage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Spin size="small" />
                <Paragraph style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
                  Луми анализирует данные вашего теста...
                </Paragraph>
              </div>
            ) : (
              <Paragraph style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
                {mascotMessage || 'Отлично! Ты прошел тест и теперь можешь получить персональный план!'}
              </Paragraph>
            )}
          </div>
        </div>
      </Card>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Paragraph style={{ fontSize: '18px', color: 'black', maxWidth: '600px', margin: '0 auto' }}>
          Получи доступ к персональному плану:
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
        {benefits.map((benefit, index) => (
          <Col xs={24} md={12} key={index}>
            <Card 
              style={{ 
                height: '100%',
                border: '1px solid #e0e0e0',
                borderRadius: '12px'
              }}
            >
              <div style={{ 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px'
              }}>
                {benefit.icon}
              </div>
              <Title level={4} style={{ 
                marginBottom: '8px', 
                color: 'black',
                fontFamily: 'Comfortaa, sans-serif'
              }}>
                {benefit.title}
              </Title>
              <Paragraph style={{ color: 'black', marginBottom: '12px' }}>
                {benefit.subtitle}
              </Paragraph>
              {benefit.items.length > 0 && (
                <ul style={{ paddingLeft: '20px', marginBottom: 0 }}>
                  {benefit.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '8px', color: '#666' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
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
              <Link to="/offer" style={{ color: 'rgb(243, 186, 111)' }}>
                Публичной оферты
              </Link>
              ,{' '}
              <Link to="/privacy-policy" style={{ color: 'rgb(243, 186, 111)' }}>
                Политики конфиденциальности
              </Link>
              {' '}и даю{' '}
              <Link to="/consent" style={{ color: 'rgb(243, 186, 111)' }}>
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
          style={{ 
            width: '100%',
            maxWidth: '600px',
            height: '56px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: 'rgb(243, 186, 111)',
            borderColor: 'rgb(243, 186, 111)',
            border: 'none',
            borderRadius: '28px',
            boxShadow: 'none'
          }}
        >
          Оплатить 10₽
        </Button>
      </div>
    </div>
  );
};

export default PaymentPage;