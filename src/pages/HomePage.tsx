import { useNavigate } from 'react-router-dom';
import { Typography, Button, Card, Row, Col, Space, List } from 'antd';
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

const HomePage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/test');
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <Title level={1} style={{ color: '#00695C', marginBottom: '16px' }}>
          Если у тебя ПРЛ
        </Title>
        <Title level={3} style={{ color: '#666', fontWeight: 'normal', marginBottom: '40px' }}>
          Пройди тест и получи:
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
        <Button 
          type="primary" 
          size="large"
          onClick={handleStart}
          style={{ 
            height: '60px', 
            fontSize: '18px', 
            fontWeight: 'bold',
            padding: '0 80px',
            minWidth: '200px'
          }}
        >
          Начать
        </Button>
      </div>
    </div>
  );
};

export default HomePage;