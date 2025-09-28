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
    icon: <FileTextOutlined style={{ color: 'white', fontSize: '32px' }} />,
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
    icon: <UserOutlined style={{ color: 'white', fontSize: '32px' }} />,
    items: []
  },
  {
    title: 'Подготовим к сеансу',
    subtitle: 'Поможем максимально эффективно использовать время с психологом',
    icon: <CalendarOutlined style={{ color: 'white', fontSize: '32px' }} />,
    items: [
      'Что сказать специалисту в твоём случае',
      'Как на первом сеансе определить, что он, скорее всего, тебе подходит'
    ]
  },
  {
    title: 'Подготовим PDF для психолога',
    subtitle: 'Документ, который поможет специалисту лучше понять тебя',
    icon: <FilePdfOutlined style={{ color: 'white', fontSize: '32px' }} />,
    items: [
      'Даёшь его психологу, и он понимает, что делать в твоём случае'
    ]
  },
  {
    title: 'Ты сможешь поделиться с нами, что было на сеансе у психолога, и мы дадим обратную связь',
    subtitle: 'Поддержим тебя на каждом этапе',
    icon: <MessageOutlined style={{ color: 'white', fontSize: '32px' }} />,
    items: []
  }
];

const BpdTestPage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/test');
  };

  const handleLogin = () => {
    navigate('/lk/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F7B98F, #A7D7C4)',
      padding: '40px 20px',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Логотип */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={1} style={{ 
            margin: '0 0 40px 0',
            fontSize: '42px',
            fontWeight: 'bold',
            fontFamily: 'Comfortaa, sans-serif'
          }}>
            <span style={{ color: '#212121' }}>Iden</span>
            <span style={{ color: '#F7B98F' }}>self</span>
          </Title>
        </div>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Title level={1} style={{ 
            color: '#212121', 
            marginBottom: '16px',
            fontSize: '32px',
            fontWeight: 'bold',
            fontFamily: 'Comfortaa, sans-serif'
          }}>
            Если у тебя ПРЛ
          </Title>
          <Title level={3} style={{ 
            color: '#212121', 
            fontWeight: 'normal', 
            marginBottom: '40px',
            fontSize: '18px',
            fontFamily: 'Comfortaa, sans-serif'
          }}>
            Пройди тест и получи:
          </Title>
        </div>

        {/* Карточки с преимуществами */}
        <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
          {benefits.map((benefit, index) => (
            <Col xs={24} md={12} lg={8} key={index}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  background: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F7B98F, #A7D7C4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      {benefit.icon}
                    </div>
                  </div>
                  
                  <div>
                    <Title level={4} style={{ margin: '0 0 8px 0', color: '#212121', textAlign: 'left', fontFamily: 'Comfortaa, sans-serif' }}>
                      {benefit.title}
                    </Title>
                    <Paragraph style={{ margin: '0 0 16px 0', color: '#666', textAlign: 'left', fontSize: '16px', fontFamily: 'Comfortaa, sans-serif' }}>
                      {benefit.subtitle}
                    </Paragraph>
                    
                    {benefit.items.length > 0 && (
                      <List
                        size="small"
                        dataSource={benefit.items}
                        renderItem={(item) => (
                          <List.Item style={{ padding: '4px 0', border: 'none' }}>
                            <span style={{ color: '#333', fontSize: '14px', fontFamily: 'Comfortaa, sans-serif' }}>• {item}</span>
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

        {/* Кнопки */}
        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="large">
            <Button 
              type="primary" 
              size="large"
              onClick={handleStart}
              style={{ 
                height: '60px', 
                fontSize: '18px', 
                fontWeight: 'bold',
                padding: '0 80px',
                minWidth: '300px',
                background: '#212121',
                borderColor: '#212121',
                borderRadius: '30px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                fontFamily: 'Comfortaa, sans-serif'
              }}
            >
              Начать тест
            </Button>
            
            <Button 
              type="default" 
              size="large"
              onClick={handleLogin}
              style={{ 
                height: '60px', 
                fontSize: '18px', 
                fontWeight: 'bold',
                padding: '0 80px',
                minWidth: '300px',
                background: 'white',
                borderColor: '#212121',
                color: '#212121',
                borderRadius: '30px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                fontFamily: 'Comfortaa, sans-serif'
              }}
            >
              Войти в ЛК
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default BpdTestPage;
