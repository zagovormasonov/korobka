import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Card, Row, Col } from 'antd';
import { useThemeColor } from '../hooks/useThemeColor';
// import { 
//   FileTextOutlined, 
//   UserOutlined, 
//   CalendarOutlined, 
//   FilePdfOutlined, 
//   MessageOutlined
// } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

// const iconColor = '#4F958B';

const benefits = [
  {
    title: 'Персональный план, что делать именно в твоём случае',
    subtitle: 'Индивидуальный подход к твоей ситуации',
    icon: <img src="/plan.svg" alt="Chat" style={{ width: '100px', height: '100px' }} />,
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
    icon: <img src="/podbor.svg" alt="Chat" style={{ width: '100px', height: '100px' }} />,
    items: []
  },
  {
    title: 'Подготовим к сеансу с психологом и психиатром',
    subtitle: 'Поможем максимально эффективно использовать время',
    icon: <img src="/podgot.svg" alt="Chat" style={{ width: '100px', height: '100px' }} />,
    items: [
      'Что сказать специалисту в твоём случае',
      'Как на первом сеансе определить, что он, скорее всего, тебе подходит'
    ]
  },
  {
    title: 'Подготовим PDF для психолога и психиатра',
    subtitle: 'Документ, который поможет специалисту лучше понять тебя',
    icon: <img src="/file.svg" alt="Chat" style={{ width: '100px', height: '100px' }} />,
    items: [
      'Даёшь его специалисту, и он понимает, что делать в твоём случае'
    ]
  },
  {
    title: 'Ты сможешь поделиться с нами тем, что было на сеансе, и мы дадим обратную связь',
    subtitle: 'Поддержим тебя на каждом этапе',
    icon: <img src="/chat.svg" alt="Chat" style={{ width: '100px', height: '100px' }} />,
    items: []
  }
];

const TestInfoPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Устанавливаем белый цвет статус-бара
  useThemeColor('#ffffff');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={1} style={{ color: 'black', marginBottom: '20px', fontFamily: 'Comfortaa, sans-serif' }}>
          Если у тебя ПРЛ
        </Title>
        <Paragraph style={{ fontSize: '18px', color: 'black', maxWidth: '600px', margin: '0 auto' }}>
          Пройди тест и получи:
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

      <div style={{ 
        textAlign: 'center',
        padding: '40px 20px',
        marginBottom: '40px'
      }}>
        <Button 
          type="primary" 
          size="large"
          onClick={() => navigate('/bpd_test')}
          style={{ 
            width: '100%',
            maxWidth: '600px',
            height: '56px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: '#4F958B',
            borderColor: '#4F958B',
            border: 'none',
            borderRadius: '28px',
            boxShadow: 'none'
          }}
        >
          Начать
        </Button>
      </div>
    </div>
  );
};

export default TestInfoPage;