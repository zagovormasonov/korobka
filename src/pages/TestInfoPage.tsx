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

const TestInfoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={1} style={{ color: '#00695C', marginBottom: '20px', fontFamily: 'Comfortaa, sans-serif' }}>
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
                border: '2px solid #e8f5e9',
                borderRadius: '12px'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                {benefit.icon}
              </div>
              <Title level={4} style={{ 
                marginBottom: '8px', 
                color: '#333',
                fontFamily: 'Comfortaa, sans-serif'
              }}>
                {benefit.title}
              </Title>
              <Paragraph style={{ color: '#666', marginBottom: '12px' }}>
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
        backgroundColor: '#f6ffed',
        borderRadius: '12px',
        border: '1px solid #b7eb8f',
        marginBottom: '40px'
      }}>
        <Title level={3} style={{ color: '#00695C', marginBottom: '16px', fontFamily: 'Comfortaa, sans-serif' }}>
          Стоимость: 10 рублей
        </Title>
        <Paragraph style={{ fontSize: '16px', marginBottom: '24px', color: '#666' }}>
          Получи персональный план действий и начни путь к улучшению своего состояния
        </Paragraph>
        <Button 
          type="primary" 
          size="large"
          onClick={() => navigate('/bpd_test')}
          style={{ 
            height: '56px',
            padding: '0 48px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: '#00695C',
            borderColor: '#00695C',
            borderRadius: '28px'
          }}
        >
          Пройти тест
        </Button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/offer" 
            style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}
          >
            Публичная оферта
          </Link>
          <Link 
            to="/privacy-policy" 
            style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}
          >
            Политика конфиденциальности
          </Link>
          <Link 
            to="/consent" 
            style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}
          >
            Согласие на обработку персональных данных
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TestInfoPage;
