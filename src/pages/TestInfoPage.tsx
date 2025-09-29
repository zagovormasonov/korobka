import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Typography, Button, Card, Row, Col } from 'antd';
import { 
  FileTextOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  FilePdfOutlined, 
  MessageOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const iconColor = 'rgb(243, 186, 111)';

const benefits = [
  {
    title: 'Персональный план, что делать именно в твоём случае',
    subtitle: 'Индивидуальный подход к твоей ситуации',
    icon: <FileTextOutlined style={{ color: iconColor, fontSize: '32px' }} />,
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
    icon: <UserOutlined style={{ color: iconColor, fontSize: '32px' }} />,
    items: []
  },
  {
    title: 'Подготовим к сеансу',
    subtitle: 'Поможем максимально эффективно использовать время с психологом',
    icon: <CalendarOutlined style={{ color: iconColor, fontSize: '32px' }} />,
    items: [
      'Что сказать специалисту в твоём случае',
      'Как на первом сеансе определить, что он, скорее всего, тебе подходит'
    ]
  },
  {
    title: 'Подготовим PDF для психолога',
    subtitle: 'Документ, который поможет специалисту лучше понять тебя',
    icon: <FilePdfOutlined style={{ color: iconColor, fontSize: '32px' }} />,
    items: [
      'Даёшь его психологу, и он понимает, что делать в твоём случае'
    ]
  },
  {
    title: 'Ты сможешь поделиться с нами, что было на сеансе у психолога, и мы дадим обратную связь',
    subtitle: 'Поддержим тебя на каждом этапе',
    icon: <MessageOutlined style={{ color: iconColor, fontSize: '32px' }} />,
    items: []
  }
];

const TestInfoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={1} style={{ color: 'black', marginBottom: '20px', fontFamily: 'Comfortaa, sans-serif' }}>
          Что ты получишь
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          После прохождения теста ты получишь персональный план действий
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
        {benefits.map((benefit, index) => (
          <Col xs={24} md={12} key={index}>
            <Card 
              hoverable 
              style={{ 
                height: '100%',
                border: '1px solid #e0e0e0',
                borderRadius: '12px'
              }}
            >
              <div style={{ 
                marginBottom: '0px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: `2px solid ${iconColor}`,
                padding: '20px'
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
            backgroundColor: 'rgb(243, 186, 111)',
            borderColor: 'rgb(243, 186, 111)',
            border: 'none',
            borderRadius: '28px',
            boxShadow: 'none'
          }}
        >
          Пройти тест
        </Button>
      </div>
    </div>
  );
};

export default TestInfoPage;